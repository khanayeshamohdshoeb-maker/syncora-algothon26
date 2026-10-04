import {
  Task,
  PendingOperation,
  ConflictItem,
  SyncSummary,
  SyncHealth,
} from '../types';
import * as db from './db';
import { networkManager } from './networkSimulator';

type SyncListener = (summary: SyncSummary) => void;

class SyncEngine {
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private lastMessage: string = 'Engine initialized. Ready to sync.';
  private listeners: Set<SyncListener> = new Set();
  private autoSyncIntervalId: any = null;

  constructor() {
    // When network changes from offline to online, auto-trigger sync!
    networkManager.subscribe((isOnline) => {
      if (isOnline) {
        db.logActivity({
          stage: 'CONNECTION_RESTORED',
          title: 'Connection Restored',
          description: 'Network restored. Preparing automated synchronization queue...',
        }).catch(console.error);

        // Immediate sync attempt when reconnecting
        this.synchronize().catch(console.error);
      } else {
        db.logActivity({
          stage: 'WAITING_FOR_CONNECTION',
          title: 'Offline Mode Active',
          description: 'Network disconnected. Local modifications will be held in persistent Outbox.',
        }).catch(console.error);
        this.notify();
      }
    });

    // Start background polling when autoSync is enabled
    this.startAutoSync();
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.getSummary().then(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async getSummary(): Promise<SyncSummary> {
    const tasks = await db.getAllTasks();
    const pending = await db.getPendingOperations();
    const conflicts = await db.getAllConflicts();
    const isOnline = networkManager.isOnline();

    let syncHealth: SyncHealth = 'optimal';
    if (this.isSyncing) {
      syncHealth = 'syncing';
    } else if (conflicts.length > 0) {
      syncHealth = 'has_conflicts';
    } else if (!isOnline || pending.length > 0) {
      syncHealth = 'offline_buffered';
    }

    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingCount: pending.length,
      conflictsCount: conflicts.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.completed).length,
      syncHealth,
      message: this.lastMessage,
    };
  }

  private async notify() {
    const summary = await this.getSummary();
    this.listeners.forEach((l) => l(summary));
  }

  public startAutoSync() {
    if (this.autoSyncIntervalId) clearInterval(this.autoSyncIntervalId);
    this.autoSyncIntervalId = setInterval(async () => {
      const settings = await db.getSettings();
      if (settings.autoSync && networkManager.isOnline() && !this.isSyncing) {
        const pending = await db.getPendingOperations();
        if (pending.length > 0) {
          await this.synchronize();
        }
      }
    }, 8000);
  }

  /**
   * Main synchronization execution flow
   */
  public async synchronize(): Promise<{ success: boolean; count: number; error?: string }> {
    if (this.isSyncing) {
      return { success: false, count: 0, error: 'Sync already in progress' };
    }

    const isOnline = networkManager.isOnline();
    if (!isOnline) {
      this.lastMessage = 'Sync interrupted: Device is offline. Changes are safe locally.';
      await db.logActivity({
        stage: 'SYNC_FAILED',
        title: 'Sync Interrupted',
        description: 'Unable to reach server. Pending operations retained in local IndexedDB outbox.',
      });
      this.notify();
      return { success: false, count: 0, error: 'Offline' };
    }

    this.isSyncing = true;
    this.lastMessage = 'Syncing…';
    this.notify();

    try {
      await db.logActivity({
        stage: 'SYNC_STARTED',
        title: 'Synchronization Started',
        description: 'Reading outbox operations and reconciling with remote cloud replica...',
      });

      // Simulate realistic network roundtrip
      await networkManager.simulateNetworkDelay();

      // Double-check connection hasn't dropped mid-flight
      if (!networkManager.isOnline()) {
        throw new Error('Network dropped during transfer.');
      }

      const pendingOps = await db.getPendingOperations();
      let syncedCount = 0;

      for (const op of pendingOps) {
        op.status = 'SYNCING';
        await db.putPendingOperation(op);

        const serverTask = await db.getServerTaskById(op.taskId);

        if (op.type === 'CREATE') {
          // New task pushed to server
          const newServerTask: Task = {
            ...op.taskSnapshot,
            syncState: 'SYNCED',
            version: 1,
            updatedAt: new Date().toISOString(),
          };
          await db.putServerTask(newServerTask);
          await db.putTask(newServerTask);
          await db.deletePendingOperation(op.id);

          await db.logActivity({
            stage: 'SERVER_CONFIRMED',
            title: 'Created on Server',
            description: `Remote confirmed creation of: "${newServerTask.title}" (v1)`,
            taskId: newServerTask.id,
            taskTitle: newServerTask.title,
          });
          syncedCount++;
        } else if (op.type === 'UPDATE' || op.type === 'TOGGLE_COMPLETE') {
          if (!serverTask) {
            // Task was removed on server while edited offline
            const conflict: ConflictItem = {
              id: 'conf-' + Math.random().toString(36).substring(2, 9),
              taskId: op.taskId,
              localTask: op.taskSnapshot,
              serverTask: {
                ...op.taskSnapshot,
                title: '[Deleted on Server]',
                description: 'This record was deleted on the remote server while modified locally.',
                version: (op.baseVersion || 1) + 1,
              },
              detectedAt: new Date().toISOString(),
              status: 'UNRESOLVED',
            };
            await db.putConflict(conflict);
            op.taskSnapshot.syncState = 'CONFLICT';
            await db.putTask(op.taskSnapshot);
            await db.deletePendingOperation(op.id);

            await db.logActivity({
              stage: 'CONFLICT_DETECTED',
              title: 'Conflict Detected (Deleted Remote)',
              description: `Task "${op.taskSnapshot.title}" was deleted remotely. Manual resolution required.`,
              taskId: op.taskId,
              taskTitle: op.taskSnapshot.title,
            });
            continue;
          }

          // Conflict detection check: If server revision has advanced beyond client's baseVersion
          // and has divergent content:
          const isDivergent =
            serverTask.version > op.baseVersion &&
            (serverTask.title !== op.taskSnapshot.title ||
              serverTask.description !== op.taskSnapshot.description ||
              serverTask.priority !== op.taskSnapshot.priority ||
              serverTask.completed !== op.taskSnapshot.completed);

          if (isDivergent) {
            // REVISION / VERSION CONFLICT DETECTED!
            const conflict: ConflictItem = {
              id: 'conf-' + Math.random().toString(36).substring(2, 9),
              taskId: op.taskId,
              localTask: op.taskSnapshot,
              serverTask: { ...serverTask },
              detectedAt: new Date().toISOString(),
              status: 'UNRESOLVED',
            };
            await db.putConflict(conflict);

            const conflictedLocal: Task = {
              ...op.taskSnapshot,
              syncState: 'CONFLICT',
            };
            await db.putTask(conflictedLocal);
            await db.deletePendingOperation(op.id);

            await db.logActivity({
              stage: 'CONFLICT_DETECTED',
              title: 'Conflict Detected (Concurrent Revision)',
              description: `Server is at v${serverTask.version} while local edit was based on v${op.baseVersion}.`,
              taskId: op.taskId,
              taskTitle: op.taskSnapshot.title,
            });
          } else {
            // Safe to apply! Increment server version
            const nextVersion = Math.max(serverTask.version, op.taskSnapshot.version) + 1;
            const updatedServerTask: Task = {
              ...op.taskSnapshot,
              version: nextVersion,
              syncState: 'SYNCED',
              updatedAt: new Date().toISOString(),
            };
            await db.putServerTask(updatedServerTask);
            await db.putTask(updatedServerTask);
            await db.deletePendingOperation(op.id);

            await db.logActivity({
              stage: 'SERVER_CONFIRMED',
              title: 'Server Confirmed Update',
              description: `Synchronized "${updatedServerTask.title}" (Revision bumped to v${nextVersion})`,
              taskId: updatedServerTask.id,
              taskTitle: updatedServerTask.title,
            });
            syncedCount++;
          }
        } else if (op.type === 'DELETE') {
          if (serverTask && serverTask.version > op.baseVersion) {
            // Task was updated on server while deleted locally -> Conflict!
            const conflict: ConflictItem = {
              id: 'conf-' + Math.random().toString(36).substring(2, 9),
              taskId: op.taskId,
              localTask: { ...op.taskSnapshot, syncState: 'CONFLICT' },
              serverTask: { ...serverTask },
              detectedAt: new Date().toISOString(),
              status: 'UNRESOLVED',
            };
            await db.putConflict(conflict);
            await db.deletePendingOperation(op.id);
            await db.putTask({ ...op.taskSnapshot, syncState: 'CONFLICT' });

            await db.logActivity({
              stage: 'CONFLICT_DETECTED',
              title: 'Conflict Detected (Delete vs Server Update)',
              description: `Task "${serverTask.title}" was updated on server (v${serverTask.version}) while deleted locally.`,
              taskId: op.taskId,
              taskTitle: op.taskSnapshot.title,
            });
          } else {
            // Safe delete
            await db.deleteServerTask(op.taskId);
            await db.deleteTaskPermanently(op.taskId);
            await db.deletePendingOperation(op.id);

            await db.logActivity({
              stage: 'SERVER_CONFIRMED',
              title: 'Remote Delete Confirmed',
              description: `Task deletion permanently propagated to cloud server.`,
              taskId: op.taskId,
              taskTitle: op.taskSnapshot.title,
            });
            syncedCount++;
          }
        }
      }

      // Inbound Sync: Pull remote changes not yet present in local database
      const allServerTasks = await db.getServerTasks();
      const allLocalTasks = await db.getAllTasks();
      const localMap = new Map(allLocalTasks.map((t) => [t.id, t]));
      const activePending = await db.getPendingOperations();
      const pendingTaskIds = new Set(activePending.map((p) => p.taskId));

      for (const st of allServerTasks) {
        if (!localMap.has(st.id) && !pendingTaskIds.has(st.id)) {
          // New task created remotely by another device
          await db.putTask({ ...st, syncState: 'SYNCED' });
          syncedCount++;
        }
      }

      this.lastSyncTime = new Date().toISOString();
      this.lastMessage =
        syncedCount > 0 ? `${syncedCount} changes synchronized` : 'All changes up to date';

      await db.logActivity({
        stage: 'SYNC_SUCCESS',
        title: 'Synchronization Complete',
        description:
          syncedCount > 0
            ? `Successfully synchronized ${syncedCount} operation(s) with cloud replica.`
            : 'All local and cloud states are consistent.',
      });

      return { success: true, count: syncedCount };
    } catch (err: any) {
      console.error('Synchronization error:', err);
      this.lastMessage = 'Sync interrupted. Your changes are safe locally. We’ll retry when possible.';
      await db.logActivity({
        stage: 'SYNC_FAILED',
        title: 'Sync Interrupted',
        description: err.message || 'Network transport failure. Outbox preserved safely.',
      });
      return { success: false, count: 0, error: err.message };
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  /**
   * Create task operation
   */
  public async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'syncState'>): Promise<Task> {
    const isOnline = networkManager.isOnline();
    const newTask: Task = {
      ...taskData,
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      syncState: isOnline ? 'SYNCED' : 'PENDING_CREATE',
    };

    // Save locally first! (Offline-first rule)
    await db.putTask(newTask);

    await db.logActivity({
      stage: 'LOCAL_SAVED',
      title: 'Task Created',
      description: `Saved "${newTask.title}" to local IndexedDB partition.`,
      taskId: newTask.id,
      taskTitle: newTask.title,
    });

    if (isOnline) {
      // Synchronize directly with server
      await db.putServerTask(newTask);
      this.lastSyncTime = new Date().toISOString();
      this.lastMessage = '1 change synchronized';
      await db.logActivity({
        stage: 'SERVER_CONFIRMED',
        title: 'Server Confirmed Creation',
        description: `Directly synced new task "${newTask.title}" to cloud.`,
        taskId: newTask.id,
        taskTitle: newTask.title,
      });
    } else {
      // Store in pending queue outbox
      const op: PendingOperation = {
        id: 'op-' + Math.random().toString(36).substring(2, 9),
        type: 'CREATE',
        taskId: newTask.id,
        taskSnapshot: newTask,
        baseVersion: 0,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
        retryCount: 0,
      };
      await db.putPendingOperation(op);

      await db.logActivity({
        stage: 'WAITING_FOR_CONNECTION',
        title: 'Enqueued in Outbox',
        description: `Pending CREATE operation queued for "${newTask.title}". Waiting for connection.`,
        taskId: newTask.id,
        taskTitle: newTask.title,
      });
    }

    this.notify();
    return newTask;
  }

  /**
   * Update task operation
   */
  public async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const existing = await db.getTaskById(id);
    if (!existing) return null;

    const isOnline = networkManager.isOnline();
    const baseVer = existing.version;
    const newVer = baseVer + 1;

    const updatedTask: Task = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: newVer,
      syncState: isOnline ? 'SYNCED' : 'PENDING_UPDATE',
    };

    // Save locally first
    await db.putTask(updatedTask);

    await db.logActivity({
      stage: 'LOCAL_SAVED',
      title: 'Task Updated Locally',
      description: `Updated "${updatedTask.title}" locally (v${baseVer} → v${newVer}).`,
      taskId: updatedTask.id,
      taskTitle: updatedTask.title,
    });

    if (isOnline) {
      await db.putServerTask(updatedTask);
      this.lastSyncTime = new Date().toISOString();
      this.lastMessage = '1 change synchronized';
      await db.logActivity({
        stage: 'SERVER_CONFIRMED',
        title: 'Server Confirmed Update',
        description: `Propagated updates for "${updatedTask.title}" to cloud.`,
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
      });
    } else {
      const op: PendingOperation = {
        id: 'op-' + Math.random().toString(36).substring(2, 9),
        type: 'UPDATE',
        taskId: updatedTask.id,
        taskSnapshot: updatedTask,
        baseVersion: baseVer,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
        retryCount: 0,
      };
      await db.putPendingOperation(op);

      await db.logActivity({
        stage: 'WAITING_FOR_CONNECTION',
        title: 'Update Queued in Outbox',
        description: `Queued offline UPDATE for "${updatedTask.title}". Will sync when reconnected.`,
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
      });
    }

    this.notify();
    return updatedTask;
  }

  /**
   * Toggle task completion
   */
  public async toggleTaskComplete(id: string): Promise<Task | null> {
    const task = await db.getTaskById(id);
    if (!task) return null;
    return this.updateTask(id, { completed: !task.completed });
  }

  /**
   * Delete task operation
   */
  public async deleteTask(id: string): Promise<boolean> {
    const task = await db.getTaskById(id);
    if (!task) return false;

    const isOnline = networkManager.isOnline();

    if (isOnline) {
      await db.deleteTaskPermanently(id);
      await db.deleteServerTask(id);
      this.lastSyncTime = new Date().toISOString();
      this.lastMessage = '1 deletion synchronized';
      await db.logActivity({
        stage: 'SERVER_CONFIRMED',
        title: 'Task Deleted',
        description: `Permanently removed "${task.title}" across local and server.`,
        taskId: task.id,
        taskTitle: task.title,
      });
    } else {
      // Mark as deleted locally or tombstone
      await db.deleteTaskPermanently(id);
      const op: PendingOperation = {
        id: 'op-' + Math.random().toString(36).substring(2, 9),
        type: 'DELETE',
        taskId: id,
        taskSnapshot: task,
        baseVersion: task.version,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
        retryCount: 0,
      };
      await db.putPendingOperation(op);

      await db.logActivity({
        stage: 'LOCAL_SAVED',
        title: 'Task Deleted Offline',
        description: `Removed "${task.title}" from local view. Deletion operation held in outbox.`,
        taskId: task.id,
        taskTitle: task.title,
      });
    }

    this.notify();
    return true;
  }

  /**
   * Conflict Resolution: Keep Local
   */
  public async resolveConflictKeepLocal(conflictId: string): Promise<void> {
    const conflicts = await db.getAllConflicts();
    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    const nextVer = Math.max(conflict.localTask.version, conflict.serverTask.version) + 1;
    const resolvedTask: Task = {
      ...conflict.localTask,
      version: nextVer,
      syncState: 'SYNCED',
      updatedAt: new Date().toISOString(),
    };

    await db.putTask(resolvedTask);
    await db.putServerTask(resolvedTask);
    await db.resolveConflict(conflictId, 'KEEP_LOCAL');

    await db.logActivity({
      stage: 'SYNC_SUCCESS',
      title: 'Conflict Resolved (Keep Local)',
      description: `Retained local version of "${resolvedTask.title}". Bumped server to v${nextVer}.`,
      taskId: resolvedTask.id,
      taskTitle: resolvedTask.title,
    });

    this.lastMessage = 'Conflict resolved successfully.';
    this.notify();
  }

  /**
   * Conflict Resolution: Keep Server
   */
  public async resolveConflictKeepServer(conflictId: string): Promise<void> {
    const conflicts = await db.getAllConflicts();
    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    const resolvedTask: Task = {
      ...conflict.serverTask,
      syncState: 'SYNCED',
      updatedAt: new Date().toISOString(),
    };

    await db.putTask(resolvedTask);
    await db.resolveConflict(conflictId, 'KEEP_SERVER');

    await db.logActivity({
      stage: 'SYNC_SUCCESS',
      title: 'Conflict Resolved (Keep Server)',
      description: `Replaced local edits with server state for "${resolvedTask.title}" (v${resolvedTask.version}).`,
      taskId: resolvedTask.id,
      taskTitle: resolvedTask.title,
    });

    this.lastMessage = 'Conflict resolved successfully.';
    this.notify();
  }

  /**
   * Conflict Resolution: Merge
   */
  public async resolveConflictMerge(
    conflictId: string,
    mergedFields: {
      title: string;
      description: string;
      priority: Task['priority'];
      completed: boolean;
    }
  ): Promise<void> {
    const conflicts = await db.getAllConflicts();
    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    const nextVer = Math.max(conflict.localTask.version, conflict.serverTask.version) + 1;
    const mergedTask: Task = {
      ...conflict.localTask,
      title: mergedFields.title,
      description: mergedFields.description,
      priority: mergedFields.priority,
      completed: mergedFields.completed,
      version: nextVer,
      syncState: 'SYNCED',
      updatedAt: new Date().toISOString(),
    };

    await db.putTask(mergedTask);
    await db.putServerTask(mergedTask);
    await db.resolveConflict(conflictId, 'MERGE');

    await db.logActivity({
      stage: 'SYNC_SUCCESS',
      title: 'Conflict Resolved (Merged)',
      description: `Combined edits into unified version v${nextVer} for "${mergedTask.title}".`,
      taskId: mergedTask.id,
      taskTitle: mergedTask.title,
    });

    this.lastMessage = 'Conflict resolved successfully.';
    this.notify();
  }

  /**
   * Simulate a concurrent conflict for judge demo or testing
   * Bumps server version with conflicting title/description,
   * while leaving local client with a stale base version!
   */
  public async simulateConcurrentConflict(targetTaskId?: string): Promise<{ taskId: string; conflictTitle: string }> {
    let taskToConflict: Task | null = null;
    const allTasks = await db.getAllTasks();

    if (targetTaskId) {
      taskToConflict = await db.getTaskById(targetTaskId);
    }
    if (!taskToConflict && allTasks.length > 0) {
      taskToConflict = allTasks[0];
    }

    if (!taskToConflict) {
      // Create a base task first if none exist
      taskToConflict = await this.createTask({
        title: 'Global Latency Benchmarks',
        description: 'Verify 99th percentile sync propagation across edge regions.',
        priority: 'high',
        completed: false,
      });
    }

    const taskId = taskToConflict.id;
    const originalVersion = taskToConflict.version;

    // 1. Simulate server change from another team member in London:
    const serverConflictingVersion: Task = {
      ...taskToConflict,
      title: taskToConflict.title + ' [Server Revision by Team Lead]',
      description:
        taskToConflict.description +
        '\n\n[CLOUD UPDATE]: Added strict requirements for regional data residency and compliance audits.',
      priority: 'urgent',
      version: originalVersion + 1,
      updatedAt: new Date(Date.now() + 1000).toISOString(),
      syncState: 'SYNCED',
    };
    await db.putServerTask(serverConflictingVersion);

    // 2. Put local change into pending queue with baseVersion = originalVersion:
    const localConflictingVersion: Task = {
      ...taskToConflict,
      title: taskToConflict.title + ' [Local Offline Draft]',
      description:
        taskToConflict.description +
        '\n\n[LOCAL UPDATE]: Modified offline on mobile node with local experimental metrics.',
      priority: 'medium',
      version: originalVersion + 1,
      updatedAt: new Date().toISOString(),
      syncState: 'PENDING_UPDATE',
    };
    await db.putTask(localConflictingVersion);

    const op: PendingOperation = {
      id: 'op-' + Math.random().toString(36).substring(2, 9),
      type: 'UPDATE',
      taskId: taskId,
      taskSnapshot: localConflictingVersion,
      baseVersion: originalVersion, // Stale base version! Server is now at originalVersion + 1
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
    };
    await db.putPendingOperation(op);

    await db.logActivity({
      stage: 'LOCAL_SAVED',
      title: 'Conflict Scenario Prepared',
      description: `Server updated to v${serverConflictingVersion.version} while local node queued offline v${originalVersion} edit.`,
      taskId: taskId,
      taskTitle: localConflictingVersion.title,
    });

    this.notify();
    return { taskId, conflictTitle: localConflictingVersion.title };
  }
}

export const syncEngine = new SyncEngine();
