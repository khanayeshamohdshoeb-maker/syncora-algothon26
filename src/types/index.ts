export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type SyncState = 'SYNCED' | 'PENDING_CREATE' | 'PENDING_UPDATE' | 'PENDING_DELETE' | 'CONFLICT';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  syncState: SyncState;
  tags?: string[];
  dueDate?: string;
  isDeleted?: boolean; // For tombstone sync handling
}

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'TOGGLE_COMPLETE';

export type OperationStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface PendingOperation {
  id: string;
  type: OperationType;
  taskId: string;
  taskSnapshot: Task;
  baseVersion: number;
  timestamp: string;
  status: OperationStatus;
  retryCount: number;
  lastError?: string;
}

export interface ConflictItem {
  id: string;
  taskId: string;
  localTask: Task;
  serverTask: Task;
  detectedAt: string;
  status: 'UNRESOLVED' | 'RESOLVED';
  resolvedAt?: string;
  resolutionStrategy?: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'MERGE';
}

export type SyncStage =
  | 'LOCAL_SAVED'
  | 'WAITING_FOR_CONNECTION'
  | 'CONNECTION_RESTORED'
  | 'SYNC_STARTED'
  | 'SERVER_CONFIRMED'
  | 'SYNC_SUCCESS'
  | 'SYNC_FAILED'
  | 'CONFLICT_DETECTED';

export interface SyncActivity {
  id: string;
  timestamp: string;
  stage: SyncStage;
  title: string;
  description: string;
  taskId?: string;
  taskTitle?: string;
  metadata?: Record<string, unknown>;
}

export type NetworkMode = 'auto' | 'offline' | 'online' | 'flaky' | 'slow';

export type SyncHealth = 'optimal' | 'syncing' | 'offline_buffered' | 'has_conflicts' | 'error';

export interface SyncSummary {
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  conflictsCount: number;
  totalTasks: number;
  completedTasks: number;
  syncHealth: SyncHealth;
  message?: string;
}

export interface AppSettings {
  autoSync: boolean;
  syncIntervalSeconds: number;
  conflictDefaultStrategy: 'prompt' | 'keep_local' | 'keep_server' | 'merge';
  soundFeedback: boolean;
  deviceId: string;
  deviceName: string;
}
