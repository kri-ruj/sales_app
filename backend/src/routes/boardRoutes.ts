import express, { Request, Response } from 'express';
import TaskBoard, { ITaskBoard } from '../models/TaskBoard';
import Task from '../models/Task';
import User from '../models/User';
import { protect } from '../middleware/authMiddleware';
import LogService from '../services/logService';

const router = express.Router();

// Initialize default sales board (utility route)
router.post('/init-default', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).user?.id;
    
    // Check if any sales boards exist for this user
    const existingBoard = await TaskBoard.findOne({
      $or: [
        { owner: currentUserId },
        { 'members.userId': currentUserId }
      ],
      type: { $in: ['sales', 'follow-up'] }
    });
    
    if (existingBoard) {
      res.json({
        success: true,
        data: existingBoard,
        message: 'Sales board already exists'
      });
      return;
    }
    
    // Create default sales board
    const defaultBoard = new TaskBoard({
      name: 'Sales Pipeline',
      description: 'Main sales pipeline and task management board',
      type: 'sales',
      owner: currentUserId,
      members: [
        {
          userId: currentUserId,
          role: 'owner',
          addedAt: new Date(),
          addedBy: currentUserId
        }
      ],
      columns: [
        {
          id: 'todo',
          name: 'To Do',
          color: '#6B7280',
          position: 1,
          wipLimit: 10,
          isDefault: true
        },
        {
          id: 'in-progress',
          name: 'In Progress',
          color: '#3B82F6',
          position: 2,
          wipLimit: 5,
          isDefault: true
        },
        {
          id: 'review',
          name: 'Review',
          color: '#F59E0B',
          position: 3,
          wipLimit: 3,
          isDefault: true
        },
        {
          id: 'done',
          name: 'Done',
          color: '#10B981',
          position: 4,
          isDefault: true
        }
      ],
      labels: [
        {
          id: 'hot-lead',
          name: 'Hot Lead',
          color: '#EF4444',
          description: 'High priority prospect'
        },
        {
          id: 'qualified',
          name: 'Qualified',
          color: '#10B981',
          description: 'Qualified prospect'
        },
        {
          id: 'follow-up',
          name: 'Follow-up',
          color: '#F59E0B',
          description: 'Requires follow-up'
        },
        {
          id: 'proposal',
          name: 'Proposal',
          color: '#8B5CF6',
          description: 'Proposal sent'
        }
      ],
      settings: {
        allowMemberInvites: true,
        allowFileUploads: true,
        requireTaskApproval: false,
        autoArchiveCompleted: false,
        emailNotifications: true,
        lineNotifications: false,
      },
      isActive: true,
      lastActivityAt: new Date(),
      taskCount: 0,
      completedTaskCount: 0
    });
    
    await defaultBoard.save();
    
    res.json({
      success: true,
      data: defaultBoard,
      message: 'Default sales board created successfully'
    });
    
  } catch (error) {
    console.error('Failed to initialize default board:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize default board'
    });
  }
});

// Get all boards for current user
router.get('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).user?.id;
    const { type, includeInactive = 'false' } = req.query;
    
    // Build filter
    const filter: any = {
      $or: [
        { owner: currentUserId },
        { 'members.userId': currentUserId }
      ]
    };
    
    if (type) filter.type = type;
    if (includeInactive === 'false') {
      filter.isActive = true;
    }
    
    const boards = await TaskBoard
      .find(filter)
      .populate('owner', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email')
      .sort({ lastActivityAt: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: boards
    });
    
  } catch (error) {
    console.error('Failed to fetch boards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch boards'
    });
  }
});

// Get single board with details
router.get('/:boardId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const currentUserId = (req as any).user?.id;
    
    const board = await TaskBoard
      .findById(boardId)
      .populate('owner', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email')
      .populate('members.addedBy', 'firstName lastName email');
    
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found'
      });
      return;
    }
    
    // Check if user has access to board
    if (!board.isMember(currentUserId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this board'
      });
      return;
    }
    
    res.json({
      success: true,
      data: board
    });
    
  } catch (error) {
    console.error('Failed to fetch board:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch board'
    });
  }
});

// Create new board
router.post('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      type = 'team',
      columns,
      labels,
      settings
    } = req.body;
    
    const currentUserId = (req as any).user?.id;
    
    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Board name is required'
      });
      return;
    }
    
    const newBoard = new TaskBoard({
      name: name.trim(),
      description: description?.trim(),
      type,
      owner: currentUserId,
      columns: columns || [], // Will be set by pre-save middleware if empty
      labels: labels || [], // Will be set by pre-save middleware for sales boards
      settings: {
        allowMemberInvites: true,
        allowFileUploads: true,
        requireTaskApproval: false,
        autoArchiveCompleted: false,
        autoArchiveDays: 30,
        emailNotifications: true,
        lineNotifications: true,
        ...settings
      },
      members: [], // Owner will be added by pre-save middleware
      isActive: true,
      lastActivityAt: new Date(),
      taskCount: 0,
      completedTaskCount: 0
    });
    
    const savedBoard = await newBoard.save();
    
    // Log board creation
    await LogService.info(
      'BOARD_CREATED',
      `New board created: ${savedBoard.name}`,
      {
        boardId: savedBoard._id,
        boardType: savedBoard.type,
        columnsCount: savedBoard.columns.length,
        labelsCount: savedBoard.labels.length
      },
      currentUserId
    );
    
    // Populate and return the created board
    const populatedBoard = await TaskBoard
      .findById(savedBoard._id)
      .populate('owner', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: populatedBoard,
      message: 'Board created successfully'
    });
    
  } catch (error) {
    console.error('Failed to create board:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create board'
    });
  }
});

// Update board
router.put('/:boardId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const currentUserId = (req as any).user?.id;
    
    const board = await TaskBoard.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found'
      });
      return;
    }
    
    // Check if user has admin rights
    const userRole = board.getUserRole(currentUserId);
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update board'
      });
      return;
    }
    
    const updatedBoard = await TaskBoard
      .findByIdAndUpdate(
        boardId,
        { 
          ...req.body,
          lastActivityAt: new Date()
        },
        { new: true, runValidators: true }
      )
      .populate('owner', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email');
    
    // Log board update
    await LogService.info(
      'BOARD_UPDATED',
      `Board updated: ${updatedBoard!.name}`,
      {
        boardId: updatedBoard!._id,
        updatedFields: Object.keys(req.body)
      },
      currentUserId
    );
    
    res.json({
      success: true,
      data: updatedBoard,
      message: 'Board updated successfully'
    });
    
  } catch (error) {
    console.error('Failed to update board:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update board'
    });
  }
});

// Add member to board
router.post('/:boardId/members', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { userId, role = 'member' } = req.body;
    const currentUserId = (req as any).user?.id;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }
    
    const board = await TaskBoard.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found'
      });
      return;
    }
    
    // Check permissions
    const userRole = board.getUserRole(currentUserId);
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      if (!board.settings.allowMemberInvites || userRole !== 'member') {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to add members'
        });
        return;
      }
    }
    
    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Check if user is already a member
    if (board.isMember(userId)) {
      res.status(400).json({
        success: false,
        message: 'User is already a member of this board'
      });
      return;
    }
    
    // Add member
    const newMember = {
      userId,
      role: role as 'admin' | 'member' | 'viewer',
      addedAt: new Date(),
      addedBy: currentUserId
    };
    
    const updatedBoard = await TaskBoard
      .findByIdAndUpdate(
        boardId,
        { 
          $push: { members: newMember },
          lastActivityAt: new Date()
        },
        { new: true }
      )
      .populate('members.userId', 'firstName lastName email')
      .populate('members.addedBy', 'firstName lastName email');
    
    // Log member addition
    await LogService.info(
      'BOARD_MEMBER_ADDED',
      `Member added to board: ${updatedBoard!.name}`,
      {
        boardId: updatedBoard!._id,
        newMemberId: userId,
        newMemberRole: role,
        addedBy: currentUserId
      },
      currentUserId
    );
    
    res.json({
      success: true,
      data: updatedBoard!.members[updatedBoard!.members.length - 1],
      message: 'Member added successfully'
    });
    
  } catch (error) {
    console.error('Failed to add member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add member'
    });
  }
});

// Remove member from board
router.delete('/:boardId/members/:userId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId, userId } = req.params;
    const currentUserId = (req as any).user?.id;
    
    const board = await TaskBoard.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found'
      });
      return;
    }
    
    // Check permissions (owner, admin, or removing self)
    const userRole = board.getUserRole(currentUserId);
    if (!userRole || (!['owner', 'admin'].includes(userRole) && currentUserId !== userId)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to remove member'
      });
      return;
    }
    
    // Cannot remove owner
    if (board.owner.toString() === userId) {
      res.status(400).json({
        success: false,
        message: 'Cannot remove board owner'
      });
      return;
    }
    
    // Remove member
    const updatedBoard = await TaskBoard
      .findByIdAndUpdate(
        boardId,
        { 
          $pull: { members: { userId } },
          lastActivityAt: new Date()
        },
        { new: true }
      );
    
    // Reassign tasks if user had any
    await Task.updateMany(
      { boardId, assignedTo: userId },
      { assignedTo: board.owner }
    );
    
    // Log member removal
    await LogService.info(
      'BOARD_MEMBER_REMOVED',
      `Member removed from board: ${updatedBoard!.name}`,
      {
        boardId: updatedBoard!._id,
        removedMemberId: userId,
        removedBy: currentUserId
      },
      currentUserId
    );
    
    res.json({
      success: true,
      message: 'Member removed successfully'
    });
    
  } catch (error) {
    console.error('Failed to remove member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
});

// Update board columns
router.put('/:boardId/columns', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { columns } = req.body;
    const currentUserId = (req as any).user?.id;
    
    if (!columns || !Array.isArray(columns)) {
      res.status(400).json({
        success: false,
        message: 'Columns array is required'
      });
      return;
    }
    
    const board = await TaskBoard.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found'
      });
      return;
    }
    
    // Check permissions
    const userRole = board.getUserRole(currentUserId);
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update columns'
      });
      return;
    }
    
    const updatedBoard = await TaskBoard
      .findByIdAndUpdate(
        boardId,
        { 
          columns,
          lastActivityAt: new Date()
        },
        { new: true, runValidators: true }
      );
    
    // Log column update
    await LogService.info(
      'BOARD_COLUMNS_UPDATED',
      `Columns updated for board: ${updatedBoard!.name}`,
      {
        boardId: updatedBoard!._id,
        columnCount: columns.length,
        columnNames: columns.map((col: any) => col.name)
      },
      currentUserId
    );
    
    res.json({
      success: true,
      data: updatedBoard!.columns,
      message: 'Columns updated successfully'
    });
    
  } catch (error) {
    console.error('Failed to update columns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update columns'
    });
  }
});

// Get board statistics
router.get('/:boardId/stats', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const currentUserId = (req as any).user?.id;
    const { period = '30' } = req.query; // days
    
    const board = await TaskBoard.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found'
      });
      return;
    }
    
    // Check access
    if (!board.isMember(currentUserId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this board'
      });
      return;
    }
    
    const periodDays = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    // Get tasks statistics
    const totalTasks = await Task.countDocuments({ boardId });
    const completedTasks = await Task.countDocuments({ boardId, status: 'done' });
    const overdueTasks = await Task.countDocuments({
      boardId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' }
    });
    
    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: { boardId: board._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Tasks by priority
    const tasksByPriority = await Task.aggregate([
      { $match: { boardId: board._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    // Tasks by assignee
    const tasksByAssignee = await Task.aggregate([
      { $match: { boardId: board._id } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, count: 1 } }
    ]);
    
    // Recent activity (tasks created in period)
    const recentTasks = await Task.countDocuments({
      boardId,
      createdAt: { $gte: startDate }
    });
    
    // Completion rate trend
    const completionTrend = await Task.aggregate([
      {
        $match: {
          boardId: board._id,
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalTasks,
          completedTasks,
          overdueTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          recentTasks
        },
        distribution: {
          byStatus: tasksByStatus,
          byPriority: tasksByPriority,
          byAssignee: tasksByAssignee
        },
        trends: {
          completionTrend,
          period: periodDays
        }
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch board stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch board statistics'
    });
  }
});

// Archive/unarchive board
router.put('/:boardId/archive', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { archive = true } = req.body;
    const currentUserId = (req as any).user?.id;
    
    const board = await TaskBoard.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found'
      });
      return;
    }
    
    // Check permissions
    const userRole = board.getUserRole(currentUserId);
    if (!userRole || userRole !== 'owner') {
      res.status(403).json({
        success: false,
        message: 'Only board owner can archive/unarchive boards'
      });
      return;
    }
    
    const updatedBoard = await TaskBoard
      .findByIdAndUpdate(
        boardId,
        { isActive: !archive },
        { new: true }
      );
    
    // Log board archival
    await LogService.info(
      archive ? 'BOARD_ARCHIVED' : 'BOARD_UNARCHIVED',
      `Board ${archive ? 'archived' : 'unarchived'}: ${updatedBoard!.name}`,
      {
        boardId: updatedBoard!._id
      },
      currentUserId
    );
    
    res.json({
      success: true,
      data: updatedBoard,
      message: `Board ${archive ? 'archived' : 'unarchived'} successfully`
    });
    
  } catch (error) {
    console.error('Failed to archive/unarchive board:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive/unarchive board'
    });
  }
});

export default router;