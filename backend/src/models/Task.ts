import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Relationships
  assignedTo: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  activityId?: mongoose.Types.ObjectId; // Link to SalesActivity
  dealId?: mongoose.Types.ObjectId; // Link to Deal
  customerId?: mongoose.Types.ObjectId; // Link to Customer
  boardId: mongoose.Types.ObjectId; // Link to TaskBoard
  
  // Task details
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  position: number; // For ordering within status column
  
  // Follow-up specific fields
  isFollowUp: boolean;
  followUpType?: 'call' | 'email' | 'meeting' | 'proposal' | 'demo' | 'other';
  followUpDate?: Date;
  customerContact?: {
    name: string;
    email?: string;
    phone?: string;
    position?: string;
  };
  
  // File attachments
  attachments: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadPath: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }[];
  
  // Progress tracking
  checklist: {
    id: string;
    text: string;
    completed: boolean;
    completedBy?: mongoose.Types.ObjectId;
    completedAt?: Date;
  }[];
  
  // Comments and updates
  comments: {
    id: string;
    text: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    edited?: boolean;
    editedAt?: Date;
  }[];
  
  // Metadata
  completedAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'done', 'blocked'],
    default: 'todo',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true
  },
  
  // Relationships
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to someone']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must have a creator']
  },
  activityId: {
    type: Schema.Types.ObjectId,
    ref: 'SalesActivity',
    sparse: true,
    index: true
  },
  dealId: {
    type: Schema.Types.ObjectId,
    ref: 'Deal',
    sparse: true,
    index: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    sparse: true,
    index: true
  },
  boardId: {
    type: Schema.Types.ObjectId,
    ref: 'TaskBoard',
    required: [true, 'Task must belong to a board'],
    index: true
  },
  
  // Task details
  dueDate: {
    type: Date,
    index: true
  },
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours cannot be negative'],
    max: [1000, 'Estimated hours cannot exceed 1000']
  },
  actualHours: {
    type: Number,
    min: [0, 'Actual hours cannot be negative'],
    max: [1000, 'Actual hours cannot exceed 1000']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  position: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Follow-up specific fields
  isFollowUp: {
    type: Boolean,
    default: false,
    index: true
  },
  followUpType: {
    type: String,
    enum: ['call', 'email', 'meeting', 'proposal', 'demo', 'other'],
    sparse: true
  },
  followUpDate: {
    type: Date,
    index: true
  },
  customerContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact name cannot exceed 100 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone cannot exceed 20 characters']
    },
    position: {
      type: String,
      trim: true,
      maxlength: [100, 'Position cannot exceed 100 characters']
    }
  },
  
  // File attachments
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    uploadPath: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      required: true
    }
  }],
  
  // Progress tracking
  checklist: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Checklist item cannot exceed 500 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date
    }
  }],
  
  // Comments and updates
  comments: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    }
  }],
  
  // Metadata
  completedAt: {
    type: Date,
    index: true
  },
  archivedAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
TaskSchema.index({ boardId: 1, status: 1, position: 1 });
TaskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
TaskSchema.index({ createdBy: 1, createdAt: -1 });
TaskSchema.index({ isFollowUp: 1, followUpDate: 1 });
TaskSchema.index({ tags: 1 });
TaskSchema.index({ priority: 1, dueDate: 1 });

// Virtual for overdue status
TaskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'done') return false;
  return new Date() > this.dueDate;
});

// Virtual for progress percentage
TaskSchema.virtual('progressPercentage').get(function(this: ITask) {
  if (this.checklist.length === 0) {
    return this.status === 'done' ? 100 : 0;
  }
  const completed = this.checklist.filter((item: any) => item.completed).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// Virtual for time tracking
TaskSchema.virtual('timeVariance').get(function(this: ITask) {
  if (!this.estimatedHours || !this.actualHours) return null;
  return (this.actualHours as number) - (this.estimatedHours as number);
});

// Pre-save middleware
TaskSchema.pre('save', function(next) {
  // Auto-set completedAt when status changes to done
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'done') {
      this.completedAt = undefined;
    }
  }
  
  // Validate follow-up fields
  if (this.isFollowUp && !this.followUpType) {
    return next(new Error('Follow-up type is required for follow-up tasks'));
  }
  
  next();
});

export default mongoose.model<ITask>('Task', TaskSchema);