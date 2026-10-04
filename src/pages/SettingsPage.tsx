import React, { useState, useEffect } from 'react';
import { useSyncora } from '../context/SyncoraContext';
import { SyncoraLogo } from '../components/SyncoraLogo';
import {
  Settings,
  User,
  Sliders,
  HardDrive,
  Database,
  Info,
  RotateCcw,
  Download,
  ShieldCheck,
  Check,
  Layers,
  Clock,
  RefreshCw,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    tasks,
    pendingOperations,
    conflicts,
    activities,
    syncSummary,
    resetToDefault,
  } = useSyncora();

  const [autoSync, setAutoSync] = useState(settings.autoSync);
  const [syncInterval, setSyncInterval] = useState(settings.syncIntervalSeconds);
  const [conflictPolicy, setConflictPolicy] = useState(settings.conflictDefaultStrategy);
  const [deviceName, setDeviceName] = useState(settings.deviceName);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(
    null
  );

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        setStorageEstimate({
          usage: est.usage || 124000,
          quota: est.quota || 1073741824,
        });
      });
    }
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      autoSync,
      syncIntervalSeconds: Number(syncInterval),
      conflictDefaultStrategy: conflictPolicy,
      deviceName,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      tasks,
      pendingOperations,
      conflicts,
      activities,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syncora_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System & Storage Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Configure offline cache policies, inspect local storage usage, and manage node identities.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {/* 1. Account & Device Identity */}
      <div className="p-6 rounded-2xl bg-[#090e1c] border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <User className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
            Node Identity & Account
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Device Identity Key</label>
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-[11px] truncate">
              {settings.deviceId}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Unique device identifier for vector clock reconciliation.
            </span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Device Friendly Name</label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* 2. Sync Preferences */}
      <form
        onSubmit={handleSavePreferences}
        className="p-6 rounded-2xl bg-[#090e1c] border border-slate-800/80 shadow-xl space-y-5"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
            Sync Preferences
          </h2>
        </div>

        <div className="space-y-4 text-xs">
          {/* Auto-sync toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-bold text-white block">Automated Background Sync</span>
              <span className="text-slate-400 text-[11px]">
                Trigger synchronization automatically when network is detected.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Sync Frequency (Seconds)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={syncInterval}
                onChange={(e) => setSyncInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Default Conflict Handling
              </label>
              <select
                value={conflictPolicy}
                onChange={(e) => setConflictPolicy(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-cyan-400"
              >
                <option value="prompt">Prompt in Conflict Resolution Room</option>
                <option value="keep_local">Auto-prefer Local Device</option>
                <option value="keep_server">Auto-prefer Remote Cloud</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* 3. Offline Storage & Diagnostics */}
      <div className="p-6 rounded-2xl bg-[#090e1c] border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
            Offline Storage & Partition Diagnostics
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase mb-1">Cached Tasks</span>
            <span className="text-lg font-bold text-white">{tasks.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">IndexedDB records</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase mb-1">Pending Outbox</span>
            <span className="text-lg font-bold text-amber-300">{pendingOperations.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Unsynced operations</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase mb-1">Conflicts</span>
            <span className="text-lg font-bold text-red-400">{conflicts.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Divergent revisions</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase mb-1">Storage Usage</span>
            <span className="text-lg font-bold text-cyan-300">
              {storageEstimate ? formatBytes(storageEstimate.usage) : '124 KB'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Browser partition</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Last Successful Synchronization:</span>
          </div>
          <span className="font-mono text-white font-bold">
            {syncSummary.lastSyncTime ? new Date(syncSummary.lastSyncTime).toLocaleString() : 'Never'}
          </span>
        </div>
      </div>

      {/* 4. Data Management & Recovery */}
      <div className="p-6 rounded-2xl bg-[#090e1c] border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
            Data Export & Reset
          </h2>
        </div>

        <p className="text-xs text-slate-400">
          Export full JSON dump of local cache and outbox queue for backup, or restore to baseline demo tasks.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Database JSON</span>
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Reset local cache and server replica to initial demo tasks?')) {
                await resetToDefault();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 border border-rose-800/60 text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Reset Demo Baseline</span>
          </button>
        </div>
      </div>

      {/* 5. About SYNCORA */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c162e] to-[#070b16] border border-cyan-900/40 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <SyncoraLogo size={28} showText={false} />
          <div>
            <h2 className="text-sm font-bold text-white font-mono">About SYNCORA</h2>
            <span className="text-[11px] text-cyan-400 font-mono">
              International Hackathon Offline-First Architecture
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
          <p>
            <strong>SYNCORA</strong> is engineered around the principle of uninterrupted human agency:
            network connectivity is an opportunistic enhancement, not a prerequisite for software functionality.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>
              <strong>Synchronous Local Write:</strong> All creates, updates, and deletes are committed to browser-native IndexedDB instantly with zero latency.
            </li>
            <li>
              <strong>Transactional Outbox:</strong> Offline operations enter a persistent FIFO queue with idempotency keys.
            </li>
            <li>
              <strong>Version Vector Reconciliation:</strong> Differential updates compare local base revisions against server revisions, preventing silent data loss.
            </li>
            <li>
              <strong>Transparent Human-in-the-Loop Conflict Resolution:</strong> Divergent branches present side-by-side diffing with Keep Local, Keep Server, and Semantic Merge.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
