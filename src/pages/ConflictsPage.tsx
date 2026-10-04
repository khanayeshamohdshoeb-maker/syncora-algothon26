import React, { useState } from 'react';
import { useSyncora } from '../context/SyncoraContext';
import { ConflictItem, Priority, Task } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  ArrowRight,
  HardDrive,
  Cloud,
  Check,
  Zap,
  Sparkles,
} from 'lucide-react';

export const ConflictsPage: React.FC = () => {
  const {
    conflicts,
    resolveConflictKeepLocal,
    resolveConflictKeepServer,
    resolveConflictMerge,
    simulateConcurrentConflict,
  } = useSyncora();

  const [activeMergeConflictId, setActiveMergeConflictId] = useState<string | null>(null);
  const [mergedTitle, setMergedTitle] = useState('');
  const [mergedDescription, setMergedDescription] = useState('');
  const [mergedPriority, setMergedPriority] = useState<Priority>('medium');
  const [mergedCompleted, setMergedCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startMerge = (conflict: ConflictItem) => {
    setActiveMergeConflictId(conflict.id);
    setMergedTitle(conflict.localTask.title);
    setMergedDescription(
      `${conflict.localTask.description}\n\n--- MERGED WITH SERVER NOTES ---\n${conflict.serverTask.description}`
    );
    setMergedPriority(
      conflict.localTask.priority === 'urgent' || conflict.serverTask.priority === 'urgent'
        ? 'urgent'
        : conflict.localTask.priority
    );
    setMergedCompleted(conflict.localTask.completed || conflict.serverTask.completed);
  };

  const handleKeepLocal = async (id: string) => {
    await resolveConflictKeepLocal(id);
    setSuccessMessage('Conflict resolved successfully.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleKeepServer = async (id: string) => {
    await resolveConflictKeepServer(id);
    setSuccessMessage('Conflict resolved successfully.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleConfirmMerge = async (id: string) => {
    await resolveConflictMerge(id, {
      title: mergedTitle,
      description: mergedDescription,
      priority: mergedPriority,
      completed: mergedCompleted,
    });
    setActiveMergeConflictId(null);
    setSuccessMessage('Conflict resolved successfully.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950/60 border border-red-800 text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Conflict Resolution Room
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Multi-revision divergence management. Zero silent overwrites.
              </p>
            </div>
          </div>
        </div>

        {/* Quick simulator button */}
        <button
          onClick={() => simulateConcurrentConflict()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 font-bold text-xs shadow transition cursor-pointer"
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Simulate Revision Clash</span>
        </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Empty State */}
      {conflicts.length === 0 ? (
        <div className="rounded-2xl bg-[#090e1c] border border-dashed border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No conflicts</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            All changes are currently consistent. No revision divergence between local device mutations and remote state.
          </p>
          <button
            onClick={() => simulateConcurrentConflict()}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition cursor-pointer"
          >
            Simulate a Conflict to Test Resolution
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {conflicts.map((conflict) => {
            const isMergingThis = activeMergeConflictId === conflict.id;

            return (
              <div
                key={conflict.id}
                className="rounded-2xl bg-[#090e1c] border-2 border-red-800/80 p-5 sm:p-6 shadow-2xl relative overflow-hidden"
              >
                {/* Banner Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-sm font-extrabold font-mono tracking-wider text-red-400 uppercase">
                      CONFLICT DETECTED
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      (Task ID: {conflict.taskId})
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Detected {new Date(conflict.detectedAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Side-by-side comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Local Version Column */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                          LOCAL VERSION (v{conflict.localTask.version})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                          Your Device
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono">
                            Title
                          </span>
                          <span className="text-white font-bold text-sm">
                            {conflict.localTask.title}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono">
                            Description
                          </span>
                          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {conflict.localTask.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                          <div>
                            <span className="text-slate-500 text-[10px] block uppercase font-mono">
                              Priority
                            </span>
                            <span className="font-semibold text-slate-200 capitalize">
                              {conflict.localTask.priority}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 text-[10px] block uppercase font-mono">
                              Status
                            </span>
                            <span className="font-semibold text-slate-200">
                              {conflict.localTask.completed ? 'Completed' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => handleKeepLocal(conflict.id)}
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wider uppercase transition shadow cursor-pointer active:scale-95"
                      >
                        KEEP LOCAL
                      </button>
                    </div>
                  </div>

                  {/* Server Version Column */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-indigo-800/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <span className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-1.5 uppercase">
                          <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                          SERVER VERSION (v{conflict.serverTask.version})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                          Remote Cloud
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono">
                            Title
                          </span>
                          <span className="text-white font-bold text-sm">
                            {conflict.serverTask.title}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono">
                            Description
                          </span>
                          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {conflict.serverTask.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                          <div>
                            <span className="text-slate-500 text-[10px] block uppercase font-mono">
                              Priority
                            </span>
                            <span className="font-semibold text-slate-200 capitalize">
                              {conflict.serverTask.priority}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 text-[10px] block uppercase font-mono">
                              Status
                            </span>
                            <span className="font-semibold text-slate-200">
                              {conflict.serverTask.completed ? 'Completed' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => handleKeepServer(conflict.id)}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wider uppercase transition shadow cursor-pointer active:scale-95"
                      >
                        KEEP SERVER
                      </button>
                    </div>
                  </div>
                </div>

                {/* Third Option: MERGE */}
                {!isMergingThis ? (
                  <div className="flex justify-center">
                    <button
                      onClick={() => startMerge(conflict)}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-600 transition shadow cursor-pointer"
                    >
                      <GitMerge className="w-4 h-4 text-purple-400" />
                      <span>MERGE BOTH VERSIONS</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 p-5 rounded-xl bg-purple-950/30 border border-purple-800 text-xs space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-900/50">
                      <div className="flex items-center gap-2 font-bold text-purple-300">
                        <GitMerge className="w-4 h-4 text-purple-400" />
                        <span>Interactive Merge Workspace</span>
                      </div>
                      <button
                        onClick={() => setActiveMergeConflictId(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        Cancel Merge
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Merged Title
                      </label>
                      <input
                        type="text"
                        value={mergedTitle}
                        onChange={(e) => setMergedTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Merged Description (Combined Notes)
                      </label>
                      <textarea
                        rows={4}
                        value={mergedDescription}
                        onChange={(e) => setMergedDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Merged Priority
                        </label>
                        <select
                          value={mergedPriority}
                          onChange={(e) => setMergedPriority(e.target.value as Priority)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Merged Status
                        </label>
                        <select
                          value={mergedCompleted ? 'done' : 'active'}
                          onChange={(e) => setMergedCompleted(e.target.value === 'done')}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                        >
                          <option value="active">Active</option>
                          <option value="done">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setActiveMergeConflictId(null)}
                        className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmMerge(conflict.id)}
                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow"
                      >
                        Save & Commit Merged Version
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
