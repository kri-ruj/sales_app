import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  Clock,
  Edit3,
  Trash2,
  AlertCircle,
  Star,
  TrendingUp,
  DollarSign,
  Target,
  Zap,
  MoreHorizontal,
} from 'lucide-react';

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

interface KanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isDragging: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  onEdit,
  onDelete,
  isDragging,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Priority styles and icons
  const getPriorityStyles = () => {
    switch (task.priority) {
      case 'urgent':
        return {
          border: 'border-l-4 border-l-red-500',
          bg: 'bg-red-50',
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
          text: 'text-red-700',
          label: '🔴 Urgent',
        };
      case 'high':
        return {
          border: 'border-l-4 border-l-orange-500',
          bg: 'bg-orange-50',
          icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
          text: 'text-orange-700',
          label: '🟠 High',
        };
      case 'medium':
        return {
          border: 'border-l-4 border-l-yellow-500',
          bg: 'bg-yellow-50',
          icon: <Target className="w-4 h-4 text-yellow-600" />,
          text: 'text-yellow-700',
          label: '🟡 Medium',
        };
      case 'low':
        return {
          border: 'border-l-4 border-l-green-500',
          bg: 'bg-green-50',
          icon: <Star className="w-4 h-4 text-green-500" />,
          text: 'text-green-700',
          label: '🟢 Low',
        };
      default:
        return {
          border: 'border-l-4 border-l-gray-300',
          bg: 'bg-gray-50',
          icon: <Star className="w-4 h-4 text-gray-400" />,
          text: 'text-gray-600',
          label: 'Normal',
        };
    }
  };

  const priorityStyles = getPriorityStyles();

  // Check if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  
  // Calculate days until due date
  const getDaysUntilDue = () => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get score color and icon
  const getScoreDisplay = () => {
    if (!task.score && task.score !== 0) return null;
    
    let color = 'text-gray-500';
    let bgColor = 'bg-gray-100';
    let icon = <Star className="w-3 h-3" />;
    
    if (task.score >= 80) {
      color = 'text-green-600';
      bgColor = 'bg-green-100';
      icon = <Zap className="w-3 h-3" />;
    } else if (task.score >= 60) {
      color = 'text-blue-600';
      bgColor = 'bg-blue-100';
      icon = <TrendingUp className="w-3 h-3" />;
    } else if (task.score >= 40) {
      color = 'text-yellow-600';
      bgColor = 'bg-yellow-100';
      icon = <Target className="w-3 h-3" />;
    }

    return { color, bgColor, icon };
  };

  const scoreDisplay = getScoreDisplay();

  const cardVariants = {
    idle: {
      scale: 1,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 },
    },
    hover: {
      scale: 1.02,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      transition: { duration: 0.2 },
    },
    dragging: {
      scale: 1.05,
      rotate: 5,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      variants={cardVariants}
      initial="idle"
      animate={
        sortableIsDragging || isDragging
          ? 'dragging'
          : isHovered
          ? 'hover'
          : 'idle'
      }
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative bg-white rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing 
        ${priorityStyles.border} ${sortableIsDragging ? 'opacity-50' : ''}
      `}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight pr-2 flex-1">
            {task.title}
          </h4>
          
          {/* Actions menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task._id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {task.labels.slice(0, 3).map((label) => (
              <motion.span
                key={label.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ backgroundColor: label.color }}
                className="px-2 py-1 rounded-full text-xs font-medium text-white text-opacity-90"
              >
                {label.name}
              </motion.span>
            ))}
            {task.labels.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                +{task.labels.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Priority indicator */}
            <div className={`flex items-center space-x-1 ${priorityStyles.text}`}>
              {priorityStyles.icon}
            </div>

            {/* Score */}
            {scoreDisplay && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${scoreDisplay.color} ${scoreDisplay.bgColor}`}
              >
                {scoreDisplay.icon}
                <span>{task.score}</span>
              </motion.div>
            )}

            {/* Deal indicator */}
            {task.dealId && (
              <div className="flex items-center space-x-1 text-green-600">
                <DollarSign className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Due date */}
          {task.dueDate && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center space-x-1 text-xs ${
                isOverdue
                  ? 'text-red-600 bg-red-50 px-2 py-1 rounded-full'
                  : daysUntilDue && daysUntilDue <= 3
                  ? 'text-orange-600 bg-orange-50 px-2 py-1 rounded-full'
                  : 'text-gray-500'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
              {isOverdue && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
            </motion.div>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-3">
          {/* Assignee */}
          {task.assignee && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2"
            >
              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {task.assignee.firstName.charAt(0)}{task.assignee.lastName.charAt(0)}
              </div>
              <span className="text-xs text-gray-600 truncate max-w-[100px]">
                {task.assignee.firstName} {task.assignee.lastName}
              </span>
            </motion.div>
          )}

          {/* Time tracking */}
          {(task.estimatedHours || task.actualHours) && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                {task.actualHours || 0}h
                {task.estimatedHours && ` / ${task.estimatedHours}h`}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar for time tracking */}
        {task.estimatedHours && task.actualHours && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-1 rounded-full ${
                  task.actualHours > task.estimatedHours
                    ? 'bg-red-500'
                    : task.actualHours >= task.estimatedHours * 0.8
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <AnimatePresence>
        {isHovered && !sortableIsDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-5 rounded-lg pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Dragging overlay */}
      {sortableIsDragging && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-50 rounded-lg" />
      )}
    </motion.div>
  );
};

export default KanbanCard;