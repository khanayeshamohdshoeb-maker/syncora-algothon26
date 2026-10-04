/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SyncoraProvider, useSyncora } from './context/SyncoraContext';
import { NetworkBanner } from './components/NetworkBanner';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { PendingPage } from './pages/PendingPage';
import { ConflictsPage } from './pages/ConflictsPage';
import { JudgeDemoPage } from './pages/JudgeDemoPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { SyncoraLogo } from './components/SyncoraLogo';
import { Wifi, WifiOff, HardDrive, ShieldCheck, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, isOnline, syncSummary } = useSyncora();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TasksPage />;
      case 'pending':
        return <PendingPage />;
      case 'conflicts':
        return <ConflictsPage />;
      case 'judge-demo':
        return <JudgeDemoPage />;
      case 'activity':
        return <ActivityPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Network & Outbox Alert Strip */}
      <NetworkBanner />

      {/* Main App Navigation */}
      <Navbar />

      {/* Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderActivePage()}
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-900 bg-[#060911] text-xs text-slate-400 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SyncoraLogo size={24} showText={false} />
            <div>
              <span className="font-bold text-white font-mono text-sm">SYNCORA</span>
              <span className="text-slate-500 mx-2">|</span>
              <span className="text-slate-400">Work offline. Sync safely.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>IndexedDB Cache</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Version Vector CRDT</span>
            </div>

            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <span className="text-cyan-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> ONLINE
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> OFFLINE
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
          <span>Engineered for International Hackathon — Offline-First Problem Statement</span>
          <span>Zero Silent Overwrites · Guaranteed At-Least-Once Delivery</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SyncoraProvider>
      <AppContent />
    </SyncoraProvider>
  );
}
