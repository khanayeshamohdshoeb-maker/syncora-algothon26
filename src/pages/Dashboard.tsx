import React, { useState } from 'react';
import { useSyncora } from '../context/SyncoraContext';
import { SyncFlowDiagram } from '../components/SyncFlowDiagram';
import { TaskModal } from '../components/TaskModal';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Play,
  ArrowRight,
  ShieldCheck,
  Server,
  Database,
  ExternalLink,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    tasks,
    pendingOperations,
    conflicts,
    syncSummary,
    isOnline,
    setActiveTab,
    synchronize,
    activities,
  } = useSyncora();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const diffSeconds = Math.round((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a1226] to-[#0d1c3a] border border-cyan-900/40 p-6 md:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            ENTERPRISE OFFLINE-FIRST RESILIENCE
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight font-sans">
            Work without interruption.
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
            Your work stays available, even when the connection doesn’t. Write, edit, and organize instantly with client-side persistence and zero data loss.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>

            <button
              onClick={() => setActiveTab('judge-demo')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-700/50 font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 text-cyan-400" />
              <span>Launch 2-Min Judge Demo</span>
            </button>

            <button
              onClick={() => synchronize()}
              disabled={syncSummary.isSyncing || !isOnline}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-slate-300 border border-slate-700/80 text-xs font-medium transition disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-cyan-400 ${
                  syncSummary.isSyncing ? 'animate-spin' : ''
                }`}
              />
              <span>Re-sync Server</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Tasks */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="p-5 rounded-2xl bg-[#090e1c] border border-slate-800/80 hover:border-cyan-500/40 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              TOTAL TASKS
            </span>
            <Layers className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{tasks.length}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Stored in IndexedDB cache</span>
            <ArrowRight className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* Stat 2: Completed */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="p-5 rounded-2xl bg-[#090e1c] border border-slate-800/80 hover:border-emerald-500/40 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              COMPLETED
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            {completedCount}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {tasks.length > 0 ? `${Math.round((completedCount / tasks.length) * 100)}% completion rate` : '0%'}
          </div>
        </div>

        {/* Stat 3: Pending Changes */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-5 rounded-2xl border transition cursor-pointer group shadow-lg ${
            pendingOperations.length > 0
              ? 'bg-amber-950/20 border-amber-600/60 hover:border-amber-500'
              : 'bg-[#090e1c] border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              PENDING CHANGES
            </span>
            <Clock
              className={`w-4 h-4 group-hover:scale-110 transition ${
                pendingOperations.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'
              }`}
            />
          </div>
          <div
            className={`text-3xl font-extrabold font-mono ${
              pendingOperations.length > 0 ? 'text-amber-300' : 'text-white'
            }`}
          >
            {pendingOperations.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {pendingOperations.length > 0
              ? 'Holding in persistent outbox'
              : 'Outbox clear & synchronized'}
          </div>
        </div>

        {/* Stat 4: Conflicts */}
        <div
          onClick={() => setActiveTab('conflicts')}
          className={`p-5 rounded-2xl border transition cursor-pointer group shadow-lg ${
            conflicts.length > 0
              ? 'bg-red-950/30 border-red-600/80 hover:border-red-500'
              : 'bg-[#090e1c] border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              CONFLICTS
            </span>
            <AlertTriangle
              className={`w-4 h-4 group-hover:scale-110 transition ${
                conflicts.length > 0 ? 'text-red-400 animate-bounce' : 'text-slate-400'
              }`}
            />
          </div>
          <div
            className={`text-3xl font-extrabold font-mono ${
              conflicts.length > 0 ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            {conflicts.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {conflicts.length > 0
              ? 'Attention needed in resolution room'
              : 'Zero vector divergence'}
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry Bar: Connection, Last sync, Outbox, Health */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090e1c] border border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-400 block mb-1">Current Connection</span>
          <div className="flex items-center gap-1.5 font-bold">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300">ONLINE (Sync Active)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300">OFFLINE (Buffer Mode)</span>
              </>
            )}
          </div>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Last Synchronization</span>
          <div className="flex items-center gap-1.5 font-bold text-white">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatLastSync(syncSummary.lastSyncTime)}</span>
          </div>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Pending Operations</span>
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>{syncSummary.pendingCount} queued mutations</span>
          </div>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Sync Health</span>
          <div className="flex items-center gap-1.5 font-bold">
            {syncSummary.syncHealth === 'optimal' && (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Optimal (100% Synced)</span>
              </>
            )}
            {syncSummary.syncHealth === 'syncing' && (
              <>
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-cyan-300">Synchronizing...</span>
              </>
            )}
            {syncSummary.syncHealth === 'offline_buffered' && (
              <>
                <Server className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300">Offline Buffer Engaged</span>
              </>
            )}
            {syncSummary.syncHealth === 'has_conflicts' && (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Reconciliation Required</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Visual Synchronization Flow (Requirement 7) */}
      <SyncFlowDiagram />

      {/* Recent Sync Activity Sneak-Peek */}
      <div className="rounded-2xl bg-[#090e1c] border border-slate-800/80 p-5 md:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Recent Sync Event Stream
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of mutations, connections, and server handshakes
            </p>
          </div>
          <button
            onClick={() => setActiveTab('activity')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No events logged yet. Create or edit a task to trigger activity.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.slice(0, 4).map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">{act.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{act.description}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(act.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
