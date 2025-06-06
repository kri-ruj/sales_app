import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import Task, { ITask } from '../models/Task';
import TaskBoard from '../models/TaskBoard';
import User from '../models/User';
import SalesActivity from '../models/SalesActivity';
import { protect } from '../middleware/authMiddleware';
import LogService from '../services/logService';
import { NotificationHelper } from '../utils/notificationHelper';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/tasks');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}-${timestamp}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// Get all tasks for a specific board
router.get('/board/:boardId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { status, assignedTo, priority, includeArchived = 'false' } = req.query;
    
    // Check if user has access to board
    const board = await TaskBoard.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found'
      });
      return;
    }
    
    // Build filter
    const filter: any = { boardId };
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;
    if (includeArchived === 'false') {
      filter.archivedAt = { $exists: false };
    }
    
    const tasks = await Task
      .find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('activityId', 'title description customerName')
      .populate('dealId', 'title value status')
      .populate('customerId', 'name company')
      .sort({ status: 1, position: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: tasks
    });
    
  } catch (error) {
    console.error('Failed to fetch board tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch board tasks'
    });
  }
});

// Get single task with full details
router.get('/:taskId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    
    const task = await Task
      .findById(taskId)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('activityId', 'title description customerName activityType')
      .populate('dealId', 'title value status probability')
      .populate('customerId', 'name company email phone')
      .populate('boardId', 'name type')
      .populate('comments.createdBy', 'firstName lastName email')
      .populate('attachments.uploadedBy', 'firstName lastName email');
    
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: task
    });
    
  } catch (error) {
    console.error('Failed to fetch task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
});

// Create new task
router.post('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      boardId,
      assignedTo,
      priority = 'medium',
      status = 'todo',
      dueDate,
      estimatedHours,
      tags = [],
      isFollowUp = false,
      followUpType,
      followUpDate,
      customerContact,
      activityId,
      dealId,
      customerId,
      checklist = []
    } = req.body;
    
    if (!title || !boardId || !assignedTo) {
      res.status(400).json({
        success: false,
        message: 'Title, board ID, and assigned user are required'
      });
      return;
    }
    
    // Verify board exists and user has access
    const board = await TaskBoard.findById(boardId);
    if (!board) {
      res.status(404).json({
        success: false,
        message: 'Board not found'
      });
      return;
    }
    
    // Get current user ID from request
    const currentUserId = (req as any).user?.id;
    if (!currentUserId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    // Get position for new task (add to end of column)
    const maxPosition = await Task
      .findOne({ boardId, status })
      .sort({ position: -1 })
      .select('position');
    
    const position = maxPosition ? maxPosition.position + 1 : 0;
    
    // Process checklist items
    const processedChecklist = checklist.map((item: any) => ({
      id: uuidv4(),
      text: item.text,
      completed: false
    }));
    
    const newTask = new Task({
      title,
      description,
      boardId,
      assignedTo,
      createdBy: currentUserId,
      priority,
      status,
      position,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours,
      tags,
      isFollowUp,
      followUpType: isFollowUp ? followUpType : undefined,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      customerContact: isFollowUp ? customerContact : undefined,
      activityId: activityId || undefined,
      dealId: dealId || undefined,
      customerId: customerId || undefined,
      checklist: processedChecklist,
      comments: [],
      attachments: []
    });
    
    const savedTask = await newTask.save();
    
    // Update board task count
    await TaskBoard.findByIdAndUpdate(boardId, {
      $inc: { taskCount: 1 },
      lastActivityAt: new Date()
    });
    
    // Log task creation
    await LogService.info(
      'TASK_CREATED',
      `New task created: ${savedTask.title}`,
      {
        taskId: savedTask._id,
        boardId: savedTask.boardId,
        assignedTo: savedTask.assignedTo,
        priority: savedTask.priority,
        isFollowUp: savedTask.isFollowUp,
        linkedActivity: savedTask.activityId ? savedTask.activityId.toString() : null,
        linkedDeal: savedTask.dealId ? savedTask.dealId.toString() : null
      },
      currentUserId
    );
    
    // Send notifications if enabled
    if (board.settings.lineNotifications && savedTask.assignedTo.toString() !== currentUserId) {
      // Notify assigned user about new task
      // Implementation depends on your notification setup
    }
    
    // Populate and return the created task
    const populatedTask = await Task
      .findById(savedTask._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('activityId', 'title description customerName')
      .populate('dealId', 'title value status')
      .populate('customerId', 'name company');
    
    res.status(201).json({
      success: true,
      data: populatedTask,
      message: 'Task created successfully'
    });
    
  } catch (error) {
    console.error('Failed to create task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// Update task
router.put('/:taskId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const currentUserId = (req as any).user?.id;
    
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    // Track what changed for notifications
    const oldStatus = task.status;
    const oldAssignedTo = task.assignedTo.toString();
    
    // Update task
    const updatedTask = await Task
      .findByIdAndUpdate(taskId, req.body, { 
        new: true, 
        runValidators: true 
      })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('activityId', 'title description customerName')
      .populate('dealId', 'title value status')
      .populate('customerId', 'name company');
    
    if (!updatedTask) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    // Update board counts if status changed
    if (oldStatus !== updatedTask.status) {
      if (updatedTask.status === 'done') {
        await TaskBoard.findByIdAndUpdate(task.boardId, {
          $inc: { completedTaskCount: 1 },
          lastActivityAt: new Date()
        });
      } else if (oldStatus === 'done') {
        await TaskBoard.findByIdAndUpdate(task.boardId, {
          $inc: { completedTaskCount: -1 },
          lastActivityAt: new Date()
        });
      }
    }
    
    // Log task update
    await LogService.info(
      'TASK_UPDATED',
      `Task updated: ${updatedTask.title}`,
      {
        taskId: updatedTask._id,
        changedFields: Object.keys(req.body),
        statusChanged: oldStatus !== updatedTask.status,
        assigneeChanged: oldAssignedTo !== updatedTask.assignedTo.toString()
      },
      currentUserId
    );
    
    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
    
  } catch (error) {
    console.error('Failed to update task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// Move task (change status/position)
router.put('/:taskId/move', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { status, position, boardId } = req.body;
    const currentUserId = (req as any).user?.id;
    
    if (!status || position === undefined) {
      res.status(400).json({
        success: false,
        message: 'Status and position are required'
      });
      return;
    }
    
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    const oldStatus = task.status;
    const oldBoardId = task.boardId.toString();
    
    // Update positions of other tasks
    if (status !== oldStatus || (boardId && boardId !== oldBoardId)) {
      // Remove task from old position
      await Task.updateMany(
        { 
          boardId: oldBoardId, 
          status: oldStatus, 
          position: { $gt: task.position } 
        },
        { $inc: { position: -1 } }
      );
      
      // Make space in new position
      const targetBoardId = boardId || oldBoardId;
      await Task.updateMany(
        { 
          boardId: targetBoardId, 
          status, 
          position: { $gte: position } 
        },
        { $inc: { position: 1 } }
      );
    } else {
      // Moving within same column
      if (position > task.position) {
        // Moving down
        await Task.updateMany(
          { 
            boardId: task.boardId, 
            status, 
            position: { $gt: task.position, $lte: position } 
          },
          { $inc: { position: -1 } }
        );
      } else if (position < task.position) {
        // Moving up
        await Task.updateMany(
          { 
            boardId: task.boardId, 
            status, 
            position: { $gte: position, $lt: task.position } 
          },
          { $inc: { position: 1 } }
        );
      }
    }
    
    // Update the task itself
    const updateData: any = { status, position };
    if (boardId && boardId !== oldBoardId) {
      updateData.boardId = boardId;
    }
    
    const updatedTask = await Task
      .findByIdAndUpdate(taskId, updateData, { new: true })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');
    
    // Update board statistics
    if (oldStatus !== status) {
      if (status === 'done') {
        await TaskBoard.findByIdAndUpdate(task.boardId, {
          $inc: { completedTaskCount: 1 },
          lastActivityAt: new Date()
        });
      } else if (oldStatus === 'done') {
        await TaskBoard.findByIdAndUpdate(task.boardId, {
          $inc: { completedTaskCount: -1 },
          lastActivityAt: new Date()
        });
      }
    }
    
    // Log task move
    await LogService.info(
      'TASK_MOVED',
      `Task moved: ${updatedTask!.title}`,
      {
        taskId: updatedTask!._id,
        fromStatus: oldStatus,
        toStatus: status,
        newPosition: position,
        boardChanged: boardId && boardId !== oldBoardId
      },
      currentUserId
    );
    
    res.json({
      success: true,
      data: updatedTask,
      message: 'Task moved successfully'
    });
    
  } catch (error) {
    console.error('Failed to move task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move task'
    });
  }
});

// Add comment to task
router.post('/:taskId/comments', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const currentUserId = (req as any).user?.id;
    
    if (!text || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
      return;
    }
    
    const comment = {
      id: uuidv4(),
      text: text.trim(),
      createdBy: currentUserId,
      createdAt: new Date(),
      edited: false
    };
    
    const updatedTask = await Task
      .findByIdAndUpdate(
        taskId,
        { $push: { comments: comment } },
        { new: true }
      )
      .populate('comments.createdBy', 'firstName lastName email');
    
    if (!updatedTask) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    // Log comment addition
    await LogService.info(
      'TASK_COMMENT_ADDED',
      `Comment added to task: ${updatedTask.title}`,
      {
        taskId: updatedTask._id,
        commentId: comment.id,
        commentLength: text.length
      },
      currentUserId
    );
    
    res.json({
      success: true,
      data: updatedTask.comments[updatedTask.comments.length - 1],
      message: 'Comment added successfully'
    });
    
  } catch (error) {
    console.error('Failed to add comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

// Upload files to task
router.post('/:taskId/attachments', protect, upload.array('files', 5), async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const currentUserId = (req as any).user?.id;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
      return;
    }
    
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    // Process uploaded files
    const attachments = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadPath: file.path,
      uploadedBy: currentUserId,
      uploadedAt: new Date()
    }));
    
    // Add attachments to task
    const updatedTask = await Task
      .findByIdAndUpdate(
        taskId,
        { $push: { attachments: { $each: attachments } } },
        { new: true }
      )
      .populate('attachments.uploadedBy', 'firstName lastName email');
    
    // Log file upload
    await LogService.info(
      'TASK_FILES_UPLOADED',
      `${files.length} file(s) uploaded to task: ${updatedTask!.title}`,
      {
        taskId: updatedTask!._id,
        fileCount: files.length,
        fileNames: files.map(f => f.originalname),
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
      },
      currentUserId
    );
    
    res.json({
      success: true,
      data: attachments,
      message: `${files.length} file(s) uploaded successfully`
    });
    
  } catch (error) {
    console.error('Failed to upload files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files'
    });
  }
});

// Delete task
router.delete('/:taskId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const currentUserId = (req as any).user?.id;
    
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    // Delete associated files
    for (const attachment of task.attachments) {
      try {
        await fs.remove(attachment.uploadPath);
      } catch (error) {
        console.warn('Failed to delete file:', attachment.uploadPath);
      }
    }
    
    // Delete task
    await Task.findByIdAndDelete(taskId);
    
    // Update board counts
    await TaskBoard.findByIdAndUpdate(task.boardId, {
      $inc: { 
        taskCount: -1,
        completedTaskCount: task.status === 'done' ? -1 : 0
      },
      lastActivityAt: new Date()
    });
    
    // Update positions of remaining tasks
    await Task.updateMany(
      { 
        boardId: task.boardId, 
        status: task.status, 
        position: { $gt: task.position } 
      },
      { $inc: { position: -1 } }
    );
    
    // Log task deletion
    await LogService.info(
      'TASK_DELETED',
      `Task deleted: ${task.title}`,
      {
        taskId: task._id,
        boardId: task.boardId,
        hadAttachments: task.attachments.length > 0
      },
      currentUserId
    );
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
    
  } catch (error) {
    console.error('Failed to delete task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

// Archive/unarchive task
router.put('/:taskId/archive', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { archive = true } = req.body;
    const currentUserId = (req as any).user?.id;
    
    const updateData = archive 
      ? { archivedAt: new Date() }
      : { $unset: { archivedAt: 1 } };
    
    const updatedTask = await Task
      .findByIdAndUpdate(taskId, updateData, { new: true })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');
    
    if (!updatedTask) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    // Log archival
    await LogService.info(
      archive ? 'TASK_ARCHIVED' : 'TASK_UNARCHIVED',
      `Task ${archive ? 'archived' : 'unarchived'}: ${updatedTask.title}`,
      {
        taskId: updatedTask._id,
        boardId: updatedTask.boardId
      },
      currentUserId
    );
    
    res.json({
      success: true,
      data: updatedTask,
      message: `Task ${archive ? 'archived' : 'unarchived'} successfully`
    });
    
  } catch (error) {
    console.error('Failed to archive/unarchive task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive/unarchive task'
    });
  }
});

// Get tasks assigned to current user
router.get('/my-tasks', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).user?.id;
    const { status, priority, limit = 50, includeCompleted = 'false' } = req.query;
    
    const filter: any = { assignedTo: currentUserId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (includeCompleted === 'false') {
      filter.status = { $ne: 'done' };
    }
    filter.archivedAt = { $exists: false };
    
    const tasks = await Task
      .find(filter)
      .populate('boardId', 'name type')
      .populate('activityId', 'title customerName')
      .populate('dealId', 'title value')
      .populate('customerId', 'name company')
      .sort({ priority: 1, dueDate: 1, createdAt: -1 })
      .limit(Number(limit));
    
    res.json({
      success: true,
      data: tasks
    });
    
  } catch (error) {
    console.error('Failed to fetch user tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user tasks'
    });
  }
});

export default router;