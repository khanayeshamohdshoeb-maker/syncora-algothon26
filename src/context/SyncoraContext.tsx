import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Task,
  PendingOperation,
  ConflictItem,
  SyncActivity,
  SyncSummary,
  NetworkMode,
  AppSettings,
} from '../types';
import * as db from '../lib/db';
import { syncEngine } from '../lib/syncEngine';
import { networkManager } from '../lib/networkSimulator';

export type NavTab =
  | 'dashboard'
  | 'tasks'
  | 'pending'
  | 'activity'
  | 'conflicts'
  | 'judge-demo'
  | 'settings';

interface SyncoraContextType {
  // Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Data
  tasks: Task[];
  pendingOperations: PendingOperation[];
  conflicts: ConflictItem[];
  activities: SyncActivity[];
  syncSummary: SyncSummary;
  settings: AppSettings;

  // Connectivity
  isOnline: boolean;
  networkMode: NetworkMode;
  setNetworkMode: (mode: NetworkMode) => void;

  // Operations
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'syncState'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleTaskComplete: (id: string) => Promise<Task | null>;

  // Sync operations
  synchronize: () => Promise<{ success: boolean; count: number; error?: string }>;
  resolveConflictKeepLocal: (conflictId: string) => Promise<void>;
  resolveConflictKeepServer: (conflictId: string) => Promise<void>;
  resolveConflictMerge: (
    conflictId: string,
    mergedFields: {
      title: string;
      description: string;
      priority: Task['priority'];
      completed: boolean;
    }
  ) => Promise<void>;

  // Demo & Diagnostic actions
  simulateConcurrentConflict: (targetTaskId?: string) => Promise<{ taskId: string; conflictTitle: string }>;
  resetToDefault: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const SyncoraContext = createContext<SyncoraContextType | null>(null);

export const SyncoraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [activities, setActivities] = useState<SyncActivity[]>([]);
  const [settings, setSettings] = useState<AppSettings>(db.DEFAULT_SETTINGS);
  const [isOnline, setIsOnline] = useState<boolean>(networkManager.getEffectiveOnlineState());
  const [networkMode, setNetworkModeState] = useState<NetworkMode>(networkManager.getMode());
  const [syncSummary, setSyncSummary] = useState<SyncSummary>({
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    conflictsCount: 0,
    totalTasks: 0,
    completedTasks: 0,
    syncHealth: 'optimal',
    message: 'System ready',
  });

  const refreshData = useCallback(async () => {
    try {
      const [t, p, c, a, s] = await Promise.all([
        db.getAllTasks(),
        db.getPendingOperations(),
        db.getAllConflicts(),
        db.getRecentActivities(100),
        db.getSettings(),
      ]);
      setTasks(t);
      setPendingOperations(p);
      setConflicts(c);
      setActivities(a);
      setSettings(s);

      const summary = await syncEngine.getSummary();
      setSyncSummary(summary);
    } catch (e) {
      console.error('Error refreshing Syncora data:', e);
    }
  }, []);

  // Initialize DB and event listeners on mount
  useEffect(() => {
    let unsubscribeSync: (() => void) | null = null;
    let unsubscribeNet: (() => void) | null = null;

    db.initializeDatabase()
      .then(async () => {
        await refreshData();

        unsubscribeSync = syncEngine.subscribe((summary) => {
          setSyncSummary(summary);
          refreshData();
        });

        unsubscribeNet = networkManager.subscribe((online, mode) => {
          setIsOnline(online);
          setNetworkModeState(mode);
          refreshData();
        });
      })
      .catch(console.error);

    return () => {
      if (unsubscribeSync) unsubscribeSync();
      if (unsubscribeNet) unsubscribeNet();
    };
  }, [refreshData]);

  const setNetworkMode = (mode: NetworkMode) => {
    networkManager.setMode(mode);
    setNetworkModeState(mode);
    setIsOnline(networkManager.getEffectiveOnlineState());
  };

  const handleCreateTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'syncState'>) => {
    const res = await syncEngine.createTask(data);
    await refreshData();
    return res;
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const res = await syncEngine.updateTask(id, updates);
    await refreshData();
    return res;
  };

  const handleDeleteTask = async (id: string) => {
    const res = await syncEngine.deleteTask(id);
    await refreshData();
    return res;
  };

  const handleToggleTaskComplete = async (id: string) => {
    const res = await syncEngine.toggleTaskComplete(id);
    await refreshData();
    return res;
  };

  const handleSynchronize = async () => {
    const res = await syncEngine.synchronize();
    await refreshData();
    return res;
  };

  const handleResolveConflictKeepLocal = async (conflictId: string) => {
    await syncEngine.resolveConflictKeepLocal(conflictId);
    await refreshData();
  };

  const handleResolveConflictKeepServer = async (conflictId: string) => {
    await syncEngine.resolveConflictKeepServer(conflictId);
    await refreshData();
  };

  const handleResolveConflictMerge = async (
    conflictId: string,
    mergedFields: {
      title: string;
      description: string;
      priority: Task['priority'];
      completed: boolean;
    }
  ) => {
    await syncEngine.resolveConflictMerge(conflictId, mergedFields);
    await refreshData();
  };

  const handleSimulateConflict = async (targetTaskId?: string) => {
    const res = await syncEngine.simulateConcurrentConflict(targetTaskId);
    await refreshData();
    return res;
  };

  const handleResetToDefault = async () => {
    await db.resetDatabaseToDefault();
    await refreshData();
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await db.updateSettings(newSettings);
    setSettings(updated);
    await refreshData();
  };

  return (
    <SyncoraContext.Provider
      value={{
        activeTab,
        setActiveTab,
        tasks,
        pendingOperations,
        conflicts,
        activities,
        syncSummary,
        settings,
        isOnline,
        networkMode,
        setNetworkMode,
        createTask: handleCreateTask,
        updateTask: handleUpdateTask,
        deleteTask: handleDeleteTask,
        toggleTaskComplete: handleToggleTaskComplete,
        synchronize: handleSynchronize,
        resolveConflictKeepLocal: handleResolveConflictKeepLocal,
        resolveConflictKeepServer: handleResolveConflictKeepServer,
        resolveConflictMerge: handleResolveConflictMerge,
        simulateConcurrentConflict: handleSimulateConflict,
        resetToDefault: handleResetToDefault,
        updateSettings: handleUpdateSettings,
        refreshData,
      }}
    >
      {children}
    </SyncoraContext.Provider>
  );
};

export const useSyncora = () => {
  const context = useContext(SyncoraContext);
  if (!context) {
    throw new Error('useSyncora must be used within a SyncoraProvider');
  }
  return context;
};
