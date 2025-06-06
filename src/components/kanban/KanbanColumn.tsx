import React from 'react';
import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, AlertTriangle, Clock, CheckCircle, Users } from 'lucide-react';
import KanbanCard from './KanbanCard';

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

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  saving: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onEditTask,
  onDeleteTask,
  saving
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = tasks.map(task => task._id);

  // Calculate column stats
  const overLimit = column.wipLimit && tasks.length > column.wipLimit;
  const urgentTasks = tasks.filter(task => task.priority === 'urgent').length;
  const overdueTasks = tasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date()
  ).length;

  // Get column icon based on status
  const getColumnIcon = () => {
    switch (column.id) {
      case 'todo':
        return <Clock className="w-4 h-4" />;
      case 'in-progress':
        return <Users className="w-4 h-4" />;
      case 'review':
        return <AlertTriangle className="w-4 h-4" />;
      case 'done':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Get column header gradient based on status
  const getColumnGradient = () => {
    switch (column.id) {
      case 'todo':
        return 'from-gray-500 to-gray-600';
      case 'in-progress':
        return 'from-blue-500 to-blue-600';
      case 'review':
        return 'from-orange-500 to-orange-600';
      case 'done':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-80 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Column Header */}
      <div className={`bg-gradient-to-r ${getColumnGradient()} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getColumnIcon()}
            <h3 className="font-semibold text-lg">{column.name}</h3>
            <motion.div
              key={tasks.length}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm font-medium"
            >
              {tasks.length}
            </motion.div>
          </div>
          
          {/* WIP Limit indicator */}
          {column.wipLimit && (
            <motion.div
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                overLimit
                  ? 'bg-red-500 text-white'
                  : 'bg-white bg-opacity-20 text-white'
              }`}
              animate={{
                scale: overLimit ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: overLimit ? Infinity : 0,
                repeatType: 'reverse',
              }}
            >
              {tasks.length}/{column.wipLimit}
            </motion.div>
          )}
        </div>

        {/* Column stats */}
        {(urgentTasks > 0 || overdueTasks > 0) && (
          <div className="flex items-center space-x-3 mt-2 text-sm">
            {urgentTasks > 0 && (
              <div className="flex items-center space-x-1 bg-red-500 bg-opacity-20 px-2 py-1 rounded">
                <AlertTriangle className="w-3 h-3" />
                <span>{urgentTasks} urgent</span>
              </div>
            )}
            {overdueTasks > 0 && (
              <div className="flex items-center space-x-1 bg-orange-500 bg-opacity-20 px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                <span>{overdueTasks} overdue</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 transition-all duration-200 ${
          isOver
            ? 'bg-blue-50 border-2 border-blue-300 border-dashed'
            : 'bg-gray-50'
        }`}
        style={{ minHeight: '200px' }}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <motion.div
                key={task._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.05,
                }}
              >
                <KanbanCard
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  isDragging={false}
                />
              </motion.div>
            ))}
          </div>
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-32 text-gray-400"
          >
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-sm">Drop tasks here</p>
            </motion.div>
          </motion.div>
        )}

        {/* WIP limit warning */}
        {overLimit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Work in progress limit exceeded!</span>
            </div>
          </motion.div>
        )}

        {/* Loading indicator */}
        {saving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center"
          >
            <motion.div
              className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default KanbanColumn;