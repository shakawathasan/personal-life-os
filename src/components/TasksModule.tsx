import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  Folder,
  Trash2,
  Kanban,
  List,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { TaskItem, ProjectItem } from '../types.ts';
import { StorageService } from '../services/storage.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';

export const TasksModule: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  // New task modal/form
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskItem['priority']>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');

  // Delete confirmation
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  useEffect(() => {
    setTasks(StorageService.getTasks());
    setProjects(StorageService.getProjects());
  }, []);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const now = new Date().toISOString();
    const newTask: TaskItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      status: 'todo',
      priority: taskPriority,
      dueDate: taskDueDate || undefined,
      projectId: taskProjectId || undefined,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newTask, ...tasks];
    StorageService.saveTasks(updated);
    setTasks(updated);

    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
    setTaskProjectId('');
    setShowNewTaskModal(false);
  };

  const handleUpdateStatus = (taskId: string, newStatus: TaskItem['status']) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    StorageService.saveTasks(updated);
    setTasks(updated);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterProject !== 'all' && t.projectId !== filterProject) return false;
    return true;
  });

  const columns: { key: TaskItem['status']; title: string; color: string }[] = [
    { key: 'todo', title: 'To Do', color: 'border-stone-300' },
    { key: 'inprogress', title: 'In Progress', color: 'border-blue-400' },
    { key: 'review', title: 'Review / Revision', color: 'border-amber-400' },
    { key: 'completed', title: 'Completed', color: 'border-emerald-500' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#FAF8F3] dark:bg-[#111815]">
      
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6 border-b border-[#E9E5DC] dark:border-[#263630] bg-white/70 dark:bg-[#18221E]/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#23483F] dark:text-[#A8B8A0]" />
            <h2 className="font-editorial text-lg font-bold text-[#242823] dark:text-[#F1F3EE]">
              Tasks & Planner ({tasks.length})
            </h2>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-[#18221E] text-[#23483F] dark:text-[#F1F3EE] shadow-xs'
                  : 'text-[#777970] dark:text-[#9AA096]'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#18221E] text-[#23483F] dark:text-[#F1F3EE] shadow-xs'
                  : 'text-[#777970] dark:text-[#9AA096]'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Priority Filter & New Task Button */}
        <div className="flex items-center gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-white dark:bg-[#18221E] text-[#242823] dark:text-[#F1F3EE]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Main Board View */}
      <div className="flex-1 overflow-x-auto p-4 sm:p-6">
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[850px] h-full items-start">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter(t => t.status === col.key);
              return (
                <div
                  key={col.key}
                  className="flex flex-col max-h-full rounded-2xl bg-white/70 dark:bg-[#18221E]/70 border border-[#E9E5DC] dark:border-[#263630] p-3 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E9E5DC] dark:border-[#263630]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#F1F3EE]">
                      {col.title}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F3] dark:bg-[#111815] text-[#777970] dark:text-[#9AA096]">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                    {colTasks.length === 0 ? (
                      <div className="py-6 text-center text-[11px] text-[#777970] dark:text-[#9AA096] italic">
                        Empty
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="glass-card p-3 rounded-xl border border-[#E9E5DC] dark:border-[#263630] space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-[#242823] dark:text-[#F1F3EE] leading-snug">
                              {task.title}
                            </h4>
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                task.priority === 'urgent'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                                  : task.priority === 'high'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-[#777970] dark:text-[#9AA096] line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-[#E9E5DC]/50 dark:border-[#263630]/50 text-[10px] text-[#777970]">
                            {task.dueDate ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {task.dueDate}
                              </span>
                            ) : (
                              <span />
                            )}

                            <div className="flex items-center gap-1">
                              {/* Move Task Next Column */}
                              {col.key !== 'completed' && (
                                <button
                                  onClick={() => {
                                    const nextStatus =
                                      col.key === 'todo'
                                        ? 'inprogress'
                                        : col.key === 'inprogress'
                                        ? 'review'
                                        : 'completed';
                                    handleUpdateStatus(task.id, nextStatus);
                                  }}
                                  className="p-1 text-[#23483F] dark:text-[#A8B8A0] hover:bg-[#FAF8F3] dark:hover:bg-[#111815] rounded"
                                  title="Advance task status"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => setTaskToDelete(task)}
                                className="p-1 hover:text-red-600 rounded"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="max-w-4xl mx-auto space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#777970]">
                No tasks match your criteria. Click "New Task" to create one.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          task.id,
                          task.status === 'completed' ? 'todo' : 'completed'
                        )
                      }
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div>
                      <h4
                        className={`text-xs font-semibold text-[#242823] dark:text-[#F1F3EE] ${
                          task.status === 'completed' ? 'line-through opacity-50' : ''
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[11px] text-[#777970] dark:text-[#9AA096]">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                        task.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-[10px] text-[#777970]">
                        {task.dueDate}
                      </span>
                    )}
                    <button
                      onClick={() => setTaskToDelete(task)}
                      className="p-1 text-[#777970] hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-5 bg-white dark:bg-[#18221E] shadow-2xl rounded-2xl border border-[#E9E5DC] dark:border-[#263630]">
            <h3 className="text-base font-bold text-[#242823] dark:text-[#F1F3EE] mb-4">
              Add New Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#777970] block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#777970] block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, references, or instructions..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#777970] block mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#777970] block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-3 py-1.5 text-xs text-[#777970] rounded-xl border border-[#E9E5DC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete task "${taskToDelete?.title}"?`}
        confirmText="Delete"
        isDestructive={true}
        onConfirm={() => {
          if (!taskToDelete) return;
          const updated = tasks.filter(t => t.id !== taskToDelete.id);
          StorageService.saveTasks(updated);
          setTasks(updated);
          setTaskToDelete(null);
        }}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};
