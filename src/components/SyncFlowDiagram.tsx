import React from 'react';
import { useSyncora } from '../context/SyncoraContext';
import {
  Smartphone,
  HardDrive,
  Layers,
  Cpu,
  Cloud,
  ArrowDown,
  ArrowRight,
  Check,
  RefreshCw,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export const SyncFlowDiagram: React.FC = () => {
  const { syncSummary, isOnline, setActiveTab } = useSyncora();
  const isSyncing = syncSummary.isSyncing;

  const nodes = [
    {
      id: 'device',
      title: 'DEVICE',
      subtitle: 'Client Browser & UI',
      icon: Smartphone,
      status: 'Ready',
      detail: '0ms Latency',
      accent: 'border-slate-700 bg-slate-900/80 text-cyan-400',
      activeGlow: 'ring-1 ring-cyan-500/50',
    },
    {
      id: 'local_cache',
      title: 'LOCAL CACHE',
      subtitle: 'IndexedDB Store',
      icon: HardDrive,
      status: `${syncSummary.totalTasks} Cached Records`,
      detail: 'Persistent Offline Storage',
      accent: 'border-cyan-800/60 bg-slate-900/90 text-cyan-300',
      activeGlow: 'ring-1 ring-cyan-400',
      clickable: () => setActiveTab('tasks'),
    },
    {
      id: 'pending_queue',
      title: 'PENDING QUEUE',
      subtitle: 'FIFO Outbox',
      icon: Layers,
      status: `${syncSummary.pendingCount} Pending Ops`,
      detail: syncSummary.pendingCount > 0 ? 'Buffer Active' : 'Queue Empty',
      accent:
        syncSummary.pendingCount > 0
          ? 'border-amber-600/80 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/50'
          : 'border-slate-800 bg-slate-900/80 text-slate-300',
      clickable: () => setActiveTab('pending'),
    },
    {
      id: 'sync_engine',
      title: 'SYNC ENGINE',
      subtitle: 'Revision Evaluator',
      icon: Cpu,
      status: isSyncing
        ? 'Reconciling…'
        : syncSummary.conflictsCount > 0
        ? `${syncSummary.conflictsCount} Conflict(s)`
        : 'Differential Check',
      detail: 'Version Vector Matrix',
      accent: isSyncing
        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-200 ring-2 ring-cyan-400 shadow-lg shadow-cyan-950'
        : syncSummary.conflictsCount > 0
        ? 'border-red-600/80 bg-red-950/40 text-red-300 ring-1 ring-red-500/50'
        : 'border-slate-700 bg-slate-900/80 text-cyan-400',
      clickable: () =>
        syncSummary.conflictsCount > 0 ? setActiveTab('conflicts') : setActiveTab('activity'),
    },
    {
      id: 'server',
      title: 'SERVER',
      subtitle: 'Cloud Persistence',
      icon: Cloud,
      status: isOnline ? 'Connected' : 'Unreachable',
      detail: isOnline ? 'WebSocket & REST Ready' : 'Buffered on Client',
      accent: isOnline
        ? 'border-emerald-700/60 bg-emerald-950/30 text-emerald-300'
        : 'border-slate-800 bg-slate-900/60 text-slate-500 opacity-60',
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#0c1222] to-[#070b16] border border-slate-800/90 p-5 md:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 border-b border-slate-800/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
              Synchronization Pipeline Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time visual data flow from local device mutations to remote cloud persistence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Pipeline State:</span>
          {isSyncing ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Transferring
            </span>
          ) : !isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
              <AlertTriangle className="w-3 h-3" />
              Buffered at Outbox
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
              <Check className="w-3 h-3" />
              Synchronized & Idling
            </span>
          )}
        </div>
      </div>

      {/* Responsive Pipeline Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
        {nodes.map((node, index) => {
          const Icon = node.icon;
          const isLast = index === nodes.length - 1;

          return (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <div
                onClick={node.clickable}
                className={`relative flex flex-col p-4 rounded-xl border transition-all duration-300 select-none ${
                  node.accent
                } ${node.clickable ? 'cursor-pointer hover:scale-[1.02] hover:border-cyan-400' : ''}`}
              >
                {/* Active transmission ripple */}
                {isSyncing && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    Stage {index + 1}
                  </span>
                  <Icon className="w-4 h-4 opacity-90" />
                </div>

                <div className="text-sm font-black font-mono tracking-wider text-white">
                  {node.title}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">{node.subtitle}</div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {node.status}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate font-mono">
                    {node.detail}
                  </span>
                </div>
              </div>

              {/* Connector Arrow (Desktop: Right arrow, Mobile: Down arrow) */}
              {!isLast && (
                <div className="hidden md:flex justify-center items-center py-2 text-slate-600">
                  <ArrowRight
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isSyncing ? 'text-cyan-400 animate-pulse' : 'text-slate-700'
                    }`}
                  />
                </div>
              )}

              {!isLast && (
                <div className="md:hidden flex justify-center items-center py-1 text-slate-600">
                  <ArrowDown
                    className={`w-4 h-4 transition-colors duration-300 ${
                      isSyncing ? 'text-cyan-400 animate-pulse' : 'text-slate-700'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
