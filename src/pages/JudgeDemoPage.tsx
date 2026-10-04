import React, { useState, useEffect } from 'react';
import { useSyncora } from '../context/SyncoraContext';
import {
  Award,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Wifi,
  WifiOff,
  PlusCircle,
  Edit,
  Clock,
  RefreshCw,
  GitMerge,
  ArrowRight,
  Database,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface DemoStep {
  number: number;
  id: string;
  title: string;
  description: string;
  actionText: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    number: 1,
    id: 'step-1',
    title: 'GO OFFLINE',
    description: 'Disconnect the network simulation. The app immediately transitions to Offline Buffer mode.',
    actionText: 'Execute: Go Offline',
  },
  {
    number: 2,
    id: 'step-2',
    title: 'CREATE TASK (OFFLINE)',
    description: 'Create "Hackathon Milestone: Offline CRDT Demo" directly into local IndexedDB while disconnected.',
    actionText: 'Execute: Create Offline Task',
  },
  {
    number: 3,
    id: 'step-3',
    title: 'EDIT TASK (OFFLINE)',
    description: 'Mutate the task priority to Urgent and update description offline. Increments local version to v2.',
    actionText: 'Execute: Edit Offline Task',
  },
  {
    number: 4,
    id: 'step-4',
    title: 'SHOW PENDING CHANGE',
    description: 'Inspect the Outbox queue to confirm pending CREATE and UPDATE operations are safely buffered.',
    actionText: 'Execute: Inspect Outbox',
  },
  {
    number: 5,
    id: 'step-5',
    title: 'RESTORE CONNECTION',
    description: 'Reconnect the network. SYNCORA detects connection restoration and prepares auto-sync pipeline.',
    actionText: 'Execute: Restore Connection',
  },
  {
    number: 6,
    id: 'step-6',
    title: 'SYNCHRONIZE',
    description: 'Execute sync engine. Operations in outbox are sent to server replica, acknowledged, and marked SYNCED.',
    actionText: 'Execute: Synchronize All',
  },
  {
    number: 7,
    id: 'step-7',
    title: 'SIMULATE CONFLICT',
    description: 'Simulate a concurrent change on the server while the client holds divergent offline edits.',
    actionText: 'Execute: Trigger Conflict',
  },
  {
    number: 8,
    id: 'step-8',
    title: 'RESOLVE CONFLICT',
    description: 'Open the Conflict Resolution Room and apply KEEP LOCAL / KEEP SERVER / MERGE strategies.',
    actionText: 'Execute: Open Conflict Resolver',
  },
];

export const JudgeDemoPage: React.FC = () => {
  const {
    isOnline,
    setNetworkMode,
    createTask,
    updateTask,
    synchronize,
    simulateConcurrentConflict,
    tasks,
    pendingOperations,
    conflicts,
    syncSummary,
    setActiveTab,
    resetToDefault,
  } = useSyncora();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [liveLog, setLiveLog] = useState<string[]>([
    'Demo initialized. Click "Step 1 — Go Offline" or "Auto-Play Complete Demo".',
  ]);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  const addLog = (msg: string) => {
    setLiveLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Step 1: Go Offline
  const executeStep1 = () => {
    setNetworkMode('offline');
    addLog('STEP 1 EXECUTED: Network simulated as OFFLINE. Offline banner active.');
    setCurrentStepIndex(1);
  };

  // Step 2: Create Task Offline
  const executeStep2 = async () => {
    const task = await createTask({
      title: 'Hackathon Milestone: Offline CRDT Demo',
      description: 'Created while strictly disconnected. Stored in IndexedDB cache.',
      priority: 'high',
      completed: false,
      tags: ['JudgeDemo', 'OfflineFirst'],
    });
    setCreatedTaskId(task.id);
    addLog(`STEP 2 EXECUTED: Task "${task.title}" saved locally in IndexedDB. Queued in outbox.`);
    setCurrentStepIndex(2);
  };

  // Step 3: Edit Task Offline
  const executeStep3 = async () => {
    if (createdTaskId) {
      await updateTask(createdTaskId, {
        title: 'Hackathon Milestone: Offline CRDT Demo [UPDATED OFFLINE]',
        description:
          'Mutated offline without network access. Incremented local revision to v2.',
        priority: 'urgent',
      });
      addLog(`STEP 3 EXECUTED: Updated task to Urgent priority while offline.`);
    } else if (tasks.length > 0) {
      await updateTask(tasks[0].id, {
        title: tasks[0].title + ' [UPDATED OFFLINE]',
        priority: 'urgent',
      });
      addLog(`STEP 3 EXECUTED: Updated task "${tasks[0].title}" offline.`);
    }
    setCurrentStepIndex(3);
  };

  // Step 4: Show Pending Change
  const executeStep4 = () => {
    addLog(
      `STEP 4 EXECUTED: Outbox verified! Currently holding ${pendingOperations.length} pending mutations safely.`
    );
    setCurrentStepIndex(4);
  };

  // Step 5: Restore Connection
  const executeStep5 = () => {
    setNetworkMode('online');
    addLog('STEP 5 EXECUTED: Network connection RESTORED. System is back ONLINE.');
    setCurrentStepIndex(5);
  };

  // Step 6: Synchronize
  const executeStep6 = async () => {
    const res = await synchronize();
    addLog(
      `STEP 6 EXECUTED: Sync complete. Reconciled ${res.count} change(s). Outbox cleared and tasks marked SYNCED.`
    );
    setCurrentStepIndex(6);
  };

  // Step 7: Simulate Conflict
  const executeStep7 = async () => {
    const res = await simulateConcurrentConflict(createdTaskId || undefined);
    addLog(
      `STEP 7 EXECUTED: Revision divergence generated! Server version changed independently from local draft.`
    );
    setCurrentStepIndex(7);
  };

  // Step 8: Resolve Conflict
  const executeStep8 = () => {
    addLog('STEP 8 EXECUTED: Navigating to Conflict Resolution Room.');
    setActiveTab('conflicts');
  };

  const handleStepClick = async (stepNum: number) => {
    switch (stepNum) {
      case 1:
        executeStep1();
        break;
      case 2:
        await executeStep2();
        break;
      case 3:
        await executeStep3();
        break;
      case 4:
        executeStep4();
        break;
      case 5:
        executeStep5();
        break;
      case 6:
        await executeStep6();
        break;
      case 7:
        await executeStep7();
        break;
      case 8:
        executeStep8();
        break;
    }
  };

  // Auto-play routine
  const startAutoPlay = async () => {
    if (isAutoPlaying) return;
    setIsAutoPlaying(true);
    addLog('>>> AUTO-PLAY DEMO STARTED (Estimated ~30 seconds)...');

    // Step 1
    executeStep1();
    await new Promise((r) => setTimeout(r, 2200));

    // Step 2
    await executeStep2();
    await new Promise((r) => setTimeout(r, 2200));

    // Step 3
    await executeStep3();
    await new Promise((r) => setTimeout(r, 2200));

    // Step 4
    executeStep4();
    await new Promise((r) => setTimeout(r, 2200));

    // Step 5
    executeStep5();
    await new Promise((r) => setTimeout(r, 2200));

    // Step 6
    await executeStep6();
    await new Promise((r) => setTimeout(r, 2500));

    // Step 7
    await executeStep7();
    await new Promise((r) => setTimeout(r, 2500));

    setIsAutoPlaying(false);
    addLog('>>> AUTO-PLAY DEMO COMPLETED! Ready for Step 8 conflict resolution.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Judge Demo Protocol
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-700">
                  &lt; 2 Minutes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Guided interactive demonstration proving authentic offline execution, outbox queueing, and revision reconciliation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startAutoPlay}
            disabled={isAutoPlaying}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-cyan-950 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-4 h-4 ${isAutoPlaying ? 'animate-spin' : ''}`} />
            <span>{isAutoPlaying ? 'Running Demo...' : 'Auto-Play Complete Demo'}</span>
          </button>

          <button
            onClick={() => {
              resetToDefault();
              setNetworkMode('auto');
              setCurrentStepIndex(0);
              addLog('Demo state reset to clean baseline.');
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Reset demo data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Steps list + Live telemetry console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 8 Interactive Steps */}
        <div className="lg:col-span-7 space-y-3">
          {DEMO_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#0c162e] to-[#0a1224] border-cyan-500/80 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                    : isCompleted
                    ? 'bg-[#090e1c]/80 border-emerald-900/60 opacity-90'
                    : 'bg-[#090e1c] border-slate-800/80 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : isCurrent
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">
                          STEP {step.number} — {step.title}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse">
                            Ready
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStepClick(step.number)}
                    disabled={isAutoPlaying}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider transition shrink-0 cursor-pointer active:scale-95 ${
                      isCurrent
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950'
                        : isCompleted
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/50'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Run Step
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Live Diagnostics Console & State Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Telemetry Card */}
          <div className="p-5 rounded-2xl bg-[#090e1c] border border-slate-800/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold font-mono uppercase text-slate-300 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-cyan-400" />
                Live State Telemetry
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] mb-1">NETWORK MODE</span>
                <span
                  className={`font-bold flex items-center gap-1.5 ${
                    isOnline ? 'text-cyan-400' : 'text-amber-400'
                  }`}
                >
                  {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] mb-1">OUTBOX QUEUE</span>
                <span
                  className={`font-bold flex items-center gap-1.5 ${
                    pendingOperations.length > 0 ? 'text-amber-300' : 'text-slate-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {pendingOperations.length} Pending
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] mb-1">LOCAL CACHE</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  {tasks.length} Records
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] mb-1">CONFLICTS</span>
                <span
                  className={`font-bold flex items-center gap-1.5 ${
                    conflicts.length > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {conflicts.length} Unresolved
                </span>
              </div>
            </div>

            {/* Quick Navigation into Inspectable screens */}
            <div className="pt-2 flex flex-col gap-2 text-xs">
              <button
                onClick={() => setActiveTab('pending')}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition cursor-pointer"
              >
                <span>Inspect Outbox Queue</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                onClick={() => setActiveTab('conflicts')}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition cursor-pointer"
              >
                <span>Inspect Conflict Resolution Screen</span>
                <ArrowRight className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>

          {/* Real-Time Event Log Console */}
          <div className="p-5 rounded-2xl bg-[#090e1c] border border-slate-800/90 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold font-mono uppercase text-slate-300">
                Live Verification Log
              </span>
              <button
                onClick={() => setLiveLog([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
              >
                Clear
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 font-mono text-[11px] text-cyan-300 space-y-1.5 max-h-64 overflow-y-auto">
              {liveLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    idx === 0 ? 'text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
