import React, { useState } from 'react';
import { useSyncora } from '../context/SyncoraContext';
import { SyncStage } from '../types';
import * as db from '../lib/db';
import {
  Activity,
  HardDrive,
  Clock,
  Wifi,
  RefreshCw,
  Server,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Filter,
} from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const { activities, refreshData } = useSyncora();
  const [filterStage, setFilterStage] = useState<string>('all');

  const getStageMeta = (stage: SyncStage) => {
    switch (stage) {
      case 'LOCAL_SAVED':
        return {
          icon: HardDrive,
          color: 'text-cyan-400',
          bg: 'bg-cyan-950 border-cyan-800',
          badge: 'SAVED LOCALLY',
        };
      case 'WAITING_FOR_CONNECTION':
        return {
          icon: Clock,
          color: 'text-amber-400',
          bg: 'bg-amber-950 border-amber-800',
          badge: 'WAITING CONNECTION',
        };
      case 'CONNECTION_RESTORED':
        return {
          icon: Wifi,
          color: 'text-emerald-400',
          bg: 'bg-emerald-950 border-emerald-800',
          badge: 'CONNECTION RESTORED',
        };
      case 'SYNC_STARTED':
        return {
          icon: RefreshCw,
          color: 'text-cyan-300',
          bg: 'bg-cyan-950 border-cyan-700',
          badge: 'SYNC STARTED',
        };
      case 'SERVER_CONFIRMED':
        return {
          icon: Server,
          color: 'text-indigo-400',
          bg: 'bg-indigo-950 border-indigo-800',
          badge: 'SERVER CONFIRMED',
        };
      case 'SYNC_SUCCESS':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-950 border-emerald-700',
          badge: 'SYNC SUCCESS',
        };
      case 'SYNC_FAILED':
        return {
          icon: AlertTriangle,
          color: 'text-rose-400',
          bg: 'bg-rose-950 border-rose-800',
          badge: 'SYNC INTERRUPTED',
        };
      case 'CONFLICT_DETECTED':
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bg: 'bg-red-950 border-red-700',
          badge: 'CONFLICT DETECTED',
        };
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterStage === 'all') return true;
    return act.stage === filterStage;
  });

  const handleClearActivities = async () => {
    await db.clearAllActivities();
    await refreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sync Activity Timeline
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Audit trail of offline mutations, connection state changes, and remote confirmations.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleClearActivities}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Timeline</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filter Stage:
        </span>
        {[
          { id: 'all', label: 'All Events' },
          { id: 'LOCAL_SAVED', label: 'Saved Locally' },
          { id: 'WAITING_FOR_CONNECTION', label: 'Waiting Network' },
          { id: 'SYNC_STARTED', label: 'Sync Started' },
          { id: 'SERVER_CONFIRMED', label: 'Server Confirmed' },
          { id: 'SYNC_SUCCESS', label: 'Successful Sync' },
          { id: 'CONFLICT_DETECTED', label: 'Conflicts' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStage(f.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition cursor-pointer ${
              filterStage === f.id
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      {filteredActivities.length === 0 ? (
        <div className="rounded-2xl bg-[#090e1c] border border-dashed border-slate-800 p-12 text-center text-slate-400 text-xs">
          No activity recorded in this category yet.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {filteredActivities.map((act) => {
            const meta = getStageMeta(act.stage);
            const Icon = meta.icon;

            return (
              <div key={act.id} className="relative group">
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border flex items-center justify-center ${meta.bg}`}
                >
                  <Icon className={`w-3 h-3 ${meta.color}`} />
                </div>

                {/* Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#090e1c] border border-slate-800/80 hover:border-slate-700 transition shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{act.title}</span>
                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${meta.bg} ${meta.color}`}
                      >
                        {meta.badge}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString()} ·{' '}
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>

                  {act.taskTitle && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-cyan-300/80 font-mono">
                      <span>Target:</span>
                      <span className="text-slate-300 font-bold">{act.taskTitle}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
