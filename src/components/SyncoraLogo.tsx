import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const SyncoraLogo: React.FC<LogoProps> = ({
  className = '',
  size = 32,
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl bg-slate-900 border border-cyan-500/30 p-1.5 shadow-lg shadow-cyan-500/10 group cursor-pointer"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform transition-transform group-hover:rotate-180 duration-700 ease-in-out"
        >
          <defs>
            <linearGradient id="logoCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="logoIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>

          {/* Upper continuous orbit arc */}
          <path
            d="M 30 65 C 20 52 22 36 34 26 C 48 14 70 18 80 32"
            stroke="url(#logoCyan)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Lower continuous orbit arc */}
          <path
            d="M 70 35 C 80 48 78 64 66 74 C 52 86 30 82 20 68"
            stroke="url(#logoIndigo)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Data Transfer Synchronous Nodes */}
          <circle cx="80" cy="32" r="6" fill="#38bdf8" />
          <circle cx="20" cy="68" r="6" fill="#818cf8" />

          {/* Safe Center Anchor (Reliability & Persistence Core) */}
          <circle cx="50" cy="50" r="8" fill="#030712" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="50" cy="50" r="3" fill="#38bdf8" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-wider text-white text-lg font-mono">
              SYNC<span className="text-cyan-400">ORA</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400/80 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded">
              v2.4
            </span>
          </div>
          <span className="text-[10px] text-slate-400 tracking-tight font-medium hidden sm:block">
            Work offline. Sync safely.
          </span>
        </div>
      )}
    </div>
  );
};
