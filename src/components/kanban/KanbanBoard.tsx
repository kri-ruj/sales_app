import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { Plus, Filter, Search, Settings, AlertCircle } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import TaskModal from './TaskModal';
import BoardSettings from './BoardSettings';
import ApiService from '../../services/apiService';
import { useToast } from '../../hooks/useToast';

// Types
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  dealId?: string;
  customerId?: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: string;
  name: string;
  color: string;
  position: number;
  wipLimit?: number;
}

interface Board {
  _id: string;
  name: string;
  description?: string;
  type: 'sales' | 'follow-up' | 'team' | 'project' | 'personal';
  columns: Column[];
  labels: Array<{
    id: string;
    name: string;
    color: string;
    description?: string;
  }>;
  taskCount: number;
  completedTaskCount: number;
  settings: {
    allowMemberInvites: boolean;
    allowFileUploads: boolean;
    requireTaskApproval: boolean;
    autoArchiveCompleted: boolean;
    autoArchiveDays?: number;
    emailNotifications: boolean;
    lineNotifications: boolean;
  };
}

const KanbanBoard: React.FC = () => {
  const { success, error: showError } = useToast();
  
  // State
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterLabel, setFilterLabel] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load data
  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (currentBoard) {
      loadTasks(currentBoard._id);
    }
  }, [currentBoard]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getBoards();
      if (response.success) {
        const salesBoards = response.data
          .filter((board: any) => 
            board.type === 'sales' || board.type === 'follow-up'
          )
          .map((board: any): Board => ({
            ...board,
            taskCount: board.taskCount || 0,
            completedTaskCount: board.completedTaskCount || 0,
            settings: board.settings || {
              allowMemberInvites: true,
              allowFileUploads: true,
              requireTaskApproval: false,
              autoArchiveCompleted: false,
              emailNotifications: true,
              lineNotifications: false,
            },
          }));
        setBoards(salesBoards);
        if (salesBoards.length > 0 && !currentBoard) {
          setCurrentBoard(salesBoards[0]);
        }
      }
    } catch (error) {
      showError('Failed to load boards');
      console.error('Error loading boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (boardId: string) => {
    try {
      const response = await ApiService.getTasks({ boardId });
      if (response.success) {
        setTasks(response.data);
      }
    } catch (error) {
      showError('Failed to load tasks');
      console.error('Error loading tasks:', error);
    }
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Assignee filter
    if (filterAssignee !== 'all') {
      filtered = filtered.filter(task => task.assignee?._id === filterAssignee);
    }

    // Label filter
    if (filterLabel !== 'all') {
      filtered = filtered.filter(task =>
        task.labels.some(label => label.id === filterLabel)
      );
    }

    return filtered;
  }, [tasks, searchTerm, filterPriority, filterAssignee, filterLabel]);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    currentBoard?.columns.forEach(column => {
      grouped[column.id] = filteredTasks.filter(task => task.status === column.id);
    });
    return grouped;
  }, [filteredTasks, currentBoard]);

  // Get unique assignees for filter
  const uniqueAssignees = useMemo(() => {
    const assignees = tasks
      .filter(task => task.assignee)
      .map(task => task.assignee!)
      .filter((assignee, index, self) =>
        index === self.findIndex(a => a._id === assignee._id)
      );
    return assignees;
  }, [tasks]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(task => task._id === active.id);
    if (!activeTask) return;

    const overColumn = currentBoard?.columns.find(col => col.id === over.id);
    if (overColumn && activeTask.status !== overColumn.id) {
      // Update task status optimistically
      setTasks(prev => prev.map(task =>
        task._id === active.id
          ? { ...task, status: overColumn.id as Task['status'] }
          : task
      ));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find(task => task._id === active.id);
    if (!activeTask) return;

    const overColumn = currentBoard?.columns.find(col => col.id === over.id);
    if (overColumn && activeTask.status !== overColumn.id) {
      try {
        setSaving(true);
        await ApiService.updateTask(activeTask._id, {
          status: overColumn.id
        });
        
        success(`Task moved to ${overColumn.name}`);
        
        // Refresh tasks to get latest data
        loadTasks(currentBoard!._id);
      } catch (error) {
        showError('Failed to update task');
        // Revert optimistic update
        loadTasks(currentBoard!._id);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSaved = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    if (currentBoard) {
      loadTasks(currentBoard._id);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await ApiService.deleteTask(taskId);
      success('Task deleted successfully');
      if (currentBoard) {
        loadTasks(currentBoard._id);
      }
    } catch (error) {
      showError('Failed to delete task');
    }
  };

  const handleCreateFirstBoard = async () => {
    try {
      setSaving(true);
      const response = await ApiService.initDefaultBoard();
      if (response.success) {
        success('Sales board created successfully!');
        await loadBoards();
      }
    } catch (error) {
      showError('Failed to create board');
      console.error('Error creating board:', error);
    } finally {
      setSaving(false);
    }
  };

  const getActiveTask = () => {
    return tasks.find(task => task._id === activeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-8 h-8 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-lg text-gray-600">Loading boards...</span>
        </motion.div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Sales Boards Found</h3>
          <p className="text-gray-500 mb-6">Create your first sales board to get started</p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateFirstBoard}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg hover:from-primary-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Sales Board</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const completionRate = currentBoard.taskCount > 0 
    ? Math.round((currentBoard.completedTaskCount / currentBoard.taskCount) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-primary-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentBoard.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {currentBoard.taskCount} tasks • {completionRate}% complete
              </p>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-primary-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">{completionRate}%</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Board selector */}
            <select
              value={currentBoard._id}
              onChange={(e) => {
                const board = boards.find(b => b._id === e.target.value);
                setCurrentBoard(board || null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {boards.map(board => (
                <option key={board._id} value={board._id}>
                  {board.name}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBoardSettings(true)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            {/* Add task */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateTask}
              className="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg hover:from-primary-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Add Task
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 rounded-lg border"
            >
              <div className="grid grid-cols-3 gap-4">
                {/* Priority filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>

                {/* Assignee filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Assignees</option>
                    {uniqueAssignees.map(assignee => (
                      <option key={assignee._id} value={assignee._id}>
                        {assignee.firstName} {assignee.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Label filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                  <select
                    value={filterLabel}
                    onChange={(e) => setFilterLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Labels</option>
                    {currentBoard.labels.map(label => (
                      <option key={label.id} value={label.id}>
                        {label.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Board content */}
      <div className="flex-1 p-6 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-6 h-full overflow-x-auto pb-6">
            {currentBoard.columns
              .sort((a, b) => a.position - b.position)
              .map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={tasksByColumn[column.id] || []}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  saving={saving}
                />
              ))}
          </div>

          <DragOverlay>
            {activeId ? (
              <KanbanCard
                task={getActiveTask()!}
                isDragging={true}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showTaskModal && (
          <TaskModal
            task={editingTask}
            board={currentBoard}
            onSave={handleTaskSaved}
            onClose={() => setShowTaskModal(false)}
          />
        )}
        
        {showBoardSettings && (
          <BoardSettings
            board={currentBoard}
            onSave={(updatedBoard) => {
              // Ensure the updated board has all required properties
              const completeBoard: Board = {
                ...updatedBoard,
                taskCount: currentBoard?.taskCount || 0,
                completedTaskCount: currentBoard?.completedTaskCount || 0,
              };
              setCurrentBoard(completeBoard);
              setShowBoardSettings(false);
              loadBoards();
            }}
            onClose={() => setShowBoardSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 shadow-xl"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span className="text-lg font-medium">Saving changes...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanbanBoard;