import React, { useState, useMemo } from 'react';
import { useSyncora } from '../context/SyncoraContext';
import { Task, Priority } from '../types';
import { TaskModal } from '../components/TaskModal';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Check,
  Trash2,
  Edit3,
  Calendar,
  Tag,
  Shield,
  Layers,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { tasks, toggleTaskComplete, deleteTask, setActiveTab } = useSyncora();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, active, completed, pending, conflict
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'priority' | 'title'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const priorityOrder: Record<Priority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search query
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(q)));

        if (!matchesSearch) return false;

        // Filter priority
        if (filterPriority !== 'all' && task.priority !== filterPriority) {
          return false;
        }

        // Filter status
        if (filterStatus === 'active' && task.completed) return false;
        if (filterStatus === 'completed' && !task.completed) return false;
        if (
          filterStatus === 'pending' &&
          (task.syncState === 'SYNCED' || task.syncState === 'CONFLICT')
        ) {
          return false;
        }
        if (filterStatus === 'conflict' && task.syncState !== 'CONFLICT') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'updated') {
          diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (sortBy === 'created') {
          diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'priority') {
          diff = priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (sortBy === 'title') {
          diff = a.title.localeCompare(b.title);
        }
        return sortOrder === 'asc' ? -diff : diff;
      });
  }, [tasks, searchQuery, filterPriority, filterStatus, sortBy, sortOrder]);

  const handleEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-800">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
            Low
          </span>
        );
    }
  };

  const getSyncStateBadge = (task: Task) => {
    switch (task.syncState) {
      case 'SYNCED':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/80"
            title="Consistent with remote server replica"
          >
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Synced (v{task.version})</span>
          </span>
        );
      case 'PENDING_CREATE':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/80 text-amber-300 border border-amber-700/80"
            title="Saved locally. Waiting for server sync"
          >
            <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Outbox: New (v{task.version})</span>
          </span>
        );
      case 'PENDING_UPDATE':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-700/80"
            title="Edited locally while offline. Waiting to sync"
          >
            <Clock className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Outbox: Edited (v{task.version})</span>
          </span>
        );
      case 'PENDING_DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-950/80 text-red-300 border border-red-700">
            <Trash2 className="w-3 h-3 text-red-400" />
            <span>Pending Delete</span>
          </span>
        );
      case 'CONFLICT':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('conflicts');
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-600 hover:bg-red-900 cursor-pointer animate-pulse"
            title="Click to resolve conflict"
          >
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Conflict Detected</span>
          </button>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Layers className="w-7 h-7 text-cyan-400" />
            Task Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Persisted in browser IndexedDB. Modifiable offline with automatic differential sync.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Controls Bar: Search, Filters, Sort */}
      <div className="p-4 rounded-2xl bg-[#090e1c] border border-slate-800/80 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or tags..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center overflow-x-auto gap-1 text-xs">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
              { id: 'pending', label: 'Pending Outbox' },
              { id: 'conflict', label: 'Conflicts' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition cursor-pointer ${
                  filterStatus === f.id
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row: Priority & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Created Time</option>
              <option value="priority">Priority Level</option>
              <option value="title">Title (A-Z)</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 px-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl bg-[#090e1c] border border-dashed border-slate-800 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No tasks found</h3>
          <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'No tasks match your current filter parameters. Try clearing filters.'
              : 'Create your first task to see the offline-first sync engine in action.'}
          </p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition cursor-pointer"
          >
            Create Your First Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                task.completed
                  ? 'bg-slate-950/60 border-slate-800/60 opacity-80'
                  : task.syncState === 'CONFLICT'
                  ? 'bg-red-950/20 border-red-700/60'
                  : 'bg-[#090e1c] border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Left: Checkbox + Title + Description */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-cyan-400 transition cursor-pointer shrink-0"
                    title={task.completed ? 'Mark as active' : 'Mark as completed'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-cyan-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-sm sm:text-base font-bold text-white truncate ${
                          task.completed ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      {getPriorityBadge(task.priority)}
                      {getSyncStateBadge(task)}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata tags, dates, version */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      {task.dueDate && (
                        <span className="flex items-center gap-1 font-mono text-cyan-300/80">
                          <Calendar className="w-3 h-3 text-cyan-400" />
                          Due: {task.dueDate}
                        </span>
                      )}

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {task.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      <span className="font-mono text-slate-500">
                        Updated {new Date(task.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:self-center ml-8 sm:ml-0 shrink-0">
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Edit task"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};
