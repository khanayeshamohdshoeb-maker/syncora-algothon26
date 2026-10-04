import React, { useState } from 'react';
import { useSyncora, NavTab } from '../context/SyncoraContext';
import { SyncoraLogo } from './SyncoraLogo';
import { PWAInstallButton } from './PWAInstallButton';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Activity,
  AlertCircle,
  Award,
  Settings,
  Menu,
  X,
  RefreshCw,
  HardDrive,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, syncSummary, isOnline, synchronize } = useSyncora();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: syncSummary.totalTasks },
    {
      id: 'pending',
      label: 'Pending Changes',
      icon: Clock,
      badge: syncSummary.pendingCount > 0 ? syncSummary.pendingCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    { id: 'activity', label: 'Sync Activity', icon: Activity },
    {
      id: 'conflicts',
      label: 'Conflicts',
      icon: AlertCircle,
      badge: syncSummary.conflictsCount > 0 ? syncSummary.conflictsCount : undefined,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse',
    },
    {
      id: 'judge-demo',
      label: 'Judge Demo',
      icon: Award,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="text-left focus:outline-none"
            >
              <SyncoraLogo size={36} />
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isDemo = item.id === 'judge-demo';

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                        : isDemo
                        ? 'text-cyan-400 bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-800/40 hover:text-cyan-200'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-cyan-400' : isDemo ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>

                    {/* Badge counts */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                          item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isDemo && !item.badge && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-extrabold tracking-wider">
                        2 min
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* PWA Install Button */}
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>

            {/* Quick Sync Button */}
            <button
              onClick={() => synchronize()}
              disabled={syncSummary.isSyncing || !isOnline}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition disabled:opacity-40 cursor-pointer"
              title="Manual Trigger Sync"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-cyan-400 ${
                  syncSummary.isSyncing ? 'animate-spin' : ''
                }`}
              />
              <span className="font-mono text-cyan-300">
                {syncSummary.isSyncing ? 'Syncing...' : 'Sync'}
              </span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-[#070b14] px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
          <div className="py-2 border-b border-slate-800/60 mb-2">
            <PWAInstallButton />
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};
