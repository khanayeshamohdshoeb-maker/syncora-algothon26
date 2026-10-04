import React, { useState } from 'react';
import { useSyncora } from '../context/SyncoraContext';
import { PendingOperation, OperationType, OperationStatus } from '../types';
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Code,
  X,
  PlusCircle,
  Edit2,
  Trash2,
  Check,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const PendingPage: React.FC = () => {
  const { pendingOperations, synchronize, isOnline, syncSummary } = useSyncora();
  const [inspectOp, setInspectOp] = useState<PendingOperation | null>(null);

  const getOpBadge = (type: OperationType) => {
    switch (type) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/80">
            <PlusCircle className="w-3.5 h-3.5" />
            CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-700/80">
            <Edit2 className="w-3.5 h-3.5" />
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700/80">
            <Trash2 className="w-3.5 h-3.5" />
            DELETE
          </span>
        );
      case 'TOGGLE_COMPLETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700/80">
            <Check className="w-3.5 h-3.5" />
            STATUS_TOGGLE
          </span>
        );
    }
  };

  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80 animate-pulse">
            <Clock className="w-3 h-3 text-amber-400" />
            PENDING
          </span>
        );
      case 'SYNCING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-600 animate-spin">
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            SYNCING
          </span>
        );
      case 'SYNCED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            SYNCED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-950 text-red-300 border border-red-700">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            FAILED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Pending Changes Outbox
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Reliable persistent queue storing offline mutations until acknowledged by the server.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => synchronize()}
          disabled={syncSummary.isSyncing || pendingOperations.length === 0 || !isOnline}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-900/30 transition disabled:opacity-40 cursor-pointer active:scale-95"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${syncSummary.isSyncing ? 'animate-spin' : ''}`}
          />
          <span>Sync Outbox Now</span>
        </button>
      </div>

      {/* Outbox Assurance Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a1428] to-[#0c1830] border border-cyan-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white">Guaranteed At-Least-Once Delivery</div>
            <p className="text-slate-400 mt-0.5">
              Changes made offline are written synchronously to IndexedDB outbox storage. If the tab
              closes or browser crashes, operations remain preserved and resume automatically on next launch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Queue Status</span>
            <span className="text-xs font-bold text-cyan-300">
              {pendingOperations.length} queued mutations
            </span>
          </div>
        </div>
      </div>

      {/* Pending Items Table / Card List */}
      {pendingOperations.length === 0 ? (
        <div className="rounded-2xl bg-[#090e1c] border border-dashed border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No pending changes</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Everything is safely synchronized. Local storage and the remote cloud replica are completely aligned.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#090e1c] border border-slate-800/80 overflow-hidden shadow-xl">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-4">Operation Type</th>
                  <th className="py-3 px-4">Target Task</th>
                  <th className="py-3 px-4">Base Rev</th>
                  <th className="py-3 px-4">Enqueued At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingOperations.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4">{getOpBadge(op.type)}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white truncate max-w-xs">
                        {op.taskSnapshot?.title || op.taskId}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                        ID: {op.taskId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-300">
                      v{op.baseVersion}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {new Date(op.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(op.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setInspectOp(op)}
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                        title="View Raw Outbox Envelope"
                      >
                        <Code className="w-3 h-3 text-cyan-400" />
                        <span>Inspect Payload</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-800/80">
            {pendingOperations.map((op) => (
              <div key={op.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  {getOpBadge(op.type)}
                  {getStatusBadge(op.status)}
                </div>

                <div className="font-bold text-white text-sm">
                  {op.taskSnapshot?.title || op.taskId}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Base: v{op.baseVersion}</span>
                  <span>{new Date(op.timestamp).toLocaleTimeString()}</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setInspectOp(op)}
                    className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5"
                  >
                    <Code className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Inspect Envelope</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JSON Payload Inspection Modal */}
      {inspectOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  IndexedDB Outbox Payload Envelope
                </h3>
              </div>
              <button
                onClick={() => setInspectOp(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-96">
                {JSON.stringify(inspectOp, null, 2)}
              </pre>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectOp(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
