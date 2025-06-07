import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskBoard extends Document {
  _id: string;
  name: string;
  description?: string;
  type: 'personal' | 'team' | 'project' | 'sales' | 'follow-up';
  
  // Board configuration
  columns: {
    id: string;
    name: string;
    color: string;
    position: number;
    wipLimit?: number; // Work in progress limit
    isDefault?: boolean;
  }[];
  
  // Access control
  owner: mongoose.Types.ObjectId;
  members: {
    userId: mongoose.Types.ObjectId;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    addedAt: Date;
    addedBy: mongoose.Types.ObjectId;
  }[];
  
  // Board settings
  settings: {
    allowMemberInvites: boolean;
    allowFileUploads: boolean;
    requireTaskApproval: boolean;
    autoArchiveCompleted: boolean;
    autoArchiveDays?: number;
    emailNotifications: boolean;
    lineNotifications: boolean;
  };
  
  // Board templates and labels
  labels: {
    id: string;
    name: string;
    color: string;
    description?: string;
  }[];
  
  // Activity tracking
  isActive: boolean;
  lastActivityAt: Date;
  taskCount: number;
  completedTaskCount: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isMember(userId: string): boolean;
  getUserRole(userId: string): string | null;
}

const TaskBoardSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Board name is required'],
    trim: true,
    maxlength: [100, 'Board name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['personal', 'team', 'project', 'sales', 'follow-up'],
    default: 'team',
    required: true,
    index: true
  },
  
  // Board configuration
  columns: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Column name cannot exceed 50 characters']
    },
    color: {
      type: String,
      required: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
    },
    position: {
      type: Number,
      required: true,
      min: 0
    },
    wipLimit: {
      type: Number,
      min: 1,
      max: 50
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  
  // Access control
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Board must have an owner'],
    index: true
  },
  members: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Board settings
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    requireTaskApproval: {
      type: Boolean,
      default: false
    },
    autoArchiveCompleted: {
      type: Boolean,
      default: false
    },
    autoArchiveDays: {
      type: Number,
      min: 1,
      max: 365,
      default: 30
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    lineNotifications: {
      type: Boolean,
      default: true
    }
  },
  
  // Board templates and labels
  labels: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Label name cannot exceed 50 characters']
    },
    color: {
      type: String,
      required: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Label description cannot exceed 200 characters']
    }
  }],
  
  // Activity tracking
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  taskCount: {
    type: Number,
    default: 0,
    min: 0
  },
  completedTaskCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
TaskBoardSchema.index({ owner: 1, isActive: 1 });
TaskBoardSchema.index({ 'members.userId': 1, isActive: 1 });
TaskBoardSchema.index({ type: 1, isActive: 1 });
TaskBoardSchema.index({ lastActivityAt: -1 });

// Virtual for completion rate
TaskBoardSchema.virtual('completionRate').get(function(this: ITaskBoard) {
  if (this.taskCount === 0) return 0;
  return Math.round((this.completedTaskCount / this.taskCount) * 100);
});

// Virtual to check if user is a member
TaskBoardSchema.methods.isMember = function(this: ITaskBoard, userId: string): boolean {
  return this.members.some((member: any) => member.userId.toString() === userId) || 
         this.owner.toString() === userId;
};

// Virtual to get user role
TaskBoardSchema.methods.getUserRole = function(this: ITaskBoard, userId: string): string | null {
  if (this.owner.toString() === userId) return 'owner';
  const member = this.members.find((member: any) => member.userId.toString() === userId);
  return member ? member.role : null;
};

// Pre-save middleware to ensure default columns exist
TaskBoardSchema.pre('save', function(this: ITaskBoard, next) {
  // Ensure board has default columns if none exist
  if (this.isNew && this.columns.length === 0) {
    this.columns = [
      {
        id: 'todo',
        name: 'To Do',
        color: '#64748B',
        position: 0,
        isDefault: true
      },
      {
        id: 'in-progress',
        name: 'In Progress',
        color: '#3B82F6',
        position: 1,
        isDefault: true
      },
      {
        id: 'review',
        name: 'Review',
        color: '#F59E0B',
        position: 2,
        isDefault: true
      },
      {
        id: 'done',
        name: 'Done',
        color: '#10B981',
        position: 3,
        isDefault: true
      }
    ];
  }
  
  // Ensure default labels exist for sales boards
  if (this.isNew && this.type === 'sales' && this.labels.length === 0) {
    this.labels = [
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
    ];
  }
  
  // Ensure owner is added to members if not already there
  if (this.isNew) {
    const ownerExists = this.members.some((member: any) => 
      member.userId.toString() === this.owner.toString()
    );
    
    if (!ownerExists) {
      this.members.push({
        userId: this.owner,
        role: 'owner',
        addedAt: new Date(),
        addedBy: this.owner
      });
    }
  }
  
  next();
});

export default mongoose.model<ITaskBoard>('TaskBoard', TaskBoardSchema);