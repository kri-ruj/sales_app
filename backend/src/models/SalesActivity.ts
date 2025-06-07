import mongoose, { Document, Schema } from 'mongoose';

export interface ISalesActivity extends Document {
  _id: string;
  title: string;
  description: string;
  customerName: string;
  contactInfo: string;
  activityType: 'call' | 'meeting' | 'email' | 'voice-note' | 'demo' | 'proposal' | 'negotiation' | 'follow-up-call' | 'site-visit';
  status: 'pending' | 'completed' | 'follow-up' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Enhanced audio storage
  audioUrl?: string;
  audioFileName?: string;
  audioFileSize?: number;
  audioStoragePath?: string;
  
  // Enhanced transcription with Gemini data
  transcription?: string;
  transcriptionLanguage?: string;
  transcriptionConfidence?: number;
  transcriptionDuration?: number;
  isEnhanced?: boolean;
  customerInfo?: {
    name?: string;
    company?: string;
    position?: string;
    email?: string;
    phone?: string;
  };
  dealInfo?: {
    value?: string;
    status?: string;
    probability?: number;
    expectedCloseDate?: string;
  };
  
  // Activity categorization and scoring
  category: 'prospecting' | 'qualification' | 'presentation' | 'negotiation' | 'closing' | 'follow-up' | 'support';
  subCategory?: string;
  activityScore: number; // 0-100 based on quality and impact
  qualityMetrics?: {
    duration: number;
    engagement: number;
    outcomes: number;
    followUpCompleted: boolean;
  };
  
  // AI Classification
  aiClassification?: {
    suggestedCategory: string;
    suggestedSubCategory?: string;
    confidence: number;
    extractedData: any;
    humanConfirmed: boolean;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
  };
  
  actionItems: string[];
  tags: string[];
  assignedTo?: mongoose.Types.ObjectId;
  dueDate?: Date;
  completedDate?: Date;
  estimatedValue?: number;
  actualValue?: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SalesActivitySchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [200, 'Customer name cannot exceed 200 characters']
  },
  contactInfo: {
    type: String,
    trim: true,
    maxlength: [500, 'Contact info cannot exceed 500 characters']
  },
  activityType: {
    type: String,
    enum: ['call', 'meeting', 'email', 'voice-note', 'demo', 'proposal', 'negotiation', 'follow-up-call', 'site-visit'],
    required: [true, 'Activity type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'follow-up', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  audioUrl: {
    type: String,
    trim: true
  },
  audioFileName: {
    type: String,
    trim: true
  },
  audioFileSize: {
    type: Number,
    min: 0
  },
  audioStoragePath: {
    type: String,
    trim: true
  },
  transcription: {
    type: String,
    trim: true
  },
  transcriptionLanguage: {
    type: String,
    trim: true,
    default: 'th'
  },
  transcriptionConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  transcriptionDuration: {
    type: Number,
    min: 0
  },
  isEnhanced: {
    type: Boolean,
    default: false
  },
  customerInfo: {
    name: { type: String, trim: true },
    company: { type: String, trim: true },
    position: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  dealInfo: {
    value: { type: String, trim: true },
    status: { type: String, trim: true },
    probability: { type: Number, min: 0, max: 100 },
    expectedCloseDate: { type: String, trim: true }
  },
  category: {
    type: String,
    enum: ['prospecting', 'qualification', 'presentation', 'negotiation', 'closing', 'follow-up', 'support'],
    default: 'prospecting'
  },
  subCategory: {
    type: String,
    trim: true
  },
  activityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  qualityMetrics: {
    duration: { type: Number, min: 0, default: 0 },
    engagement: { type: Number, min: 0, max: 10, default: 5 },
    outcomes: { type: Number, min: 0, max: 10, default: 5 },
    followUpCompleted: { type: Boolean, default: false }
  },
  aiClassification: {
    suggestedCategory: { type: String, trim: true },
    suggestedSubCategory: { type: String, trim: true },
    confidence: { type: Number, min: 0, max: 1 },
    extractedData: { type: Schema.Types.Mixed },
    humanConfirmed: { type: Boolean, default: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  actionItems: [{
    type: String,
    trim: true,
    maxlength: [500, 'Action item cannot exceed 500 characters']
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  estimatedValue: {
    type: Number,
    min: 0
  },
  actualValue: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if activity is overdue
SalesActivitySchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual for calculating days until due
SalesActivitySchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const dueDate = this.dueDate as Date;
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Create indexes for better performance
SalesActivitySchema.index({ status: 1, createdAt: -1 });
SalesActivitySchema.index({ activityType: 1 });
SalesActivitySchema.index({ customerName: 'text', title: 'text', description: 'text', transcription: 'text' });
SalesActivitySchema.index({ assignedTo: 1, status: 1 });
SalesActivitySchema.index({ createdBy: 1, createdAt: -1 });
SalesActivitySchema.index({ dueDate: 1, status: 1 });
SalesActivitySchema.index({ tags: 1 });

// Pre-save middleware to auto-set completed date
SalesActivitySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

export default mongoose.model<ISalesActivity>('SalesActivity', SalesActivitySchema); 