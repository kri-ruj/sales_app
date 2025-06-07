import mongoose, { Document, Schema } from 'mongoose';

export type DealStage = 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
export type DealSource = 'cold-call' | 'referral' | 'website' | 'social-media' | 'email' | 'other';
export type CurrencyCode = 'THB' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'SGD';

export interface IDeal extends Document {
  _id: string;
  dealName: string;
  companyName: string;
  contactPerson: string;
  contactEmail?: string;
  contactPhone?: string;
  dealValue: number;
  currency: CurrencyCode;
  dealStage: DealStage;
  probability: number; // 0-100
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  source: DealSource;
  description?: string;
  notes?: string;
  tags: string[];
  nextActions: string[];
  lastContactDate?: Date;
  assignedTo?: mongoose.Types.ObjectId | string;
  createdBy: mongoose.Types.ObjectId | string;
  
  // Voice recording related
  relatedActivities: (mongoose.Types.ObjectId | string)[];
  lastRecordingTranscription?: string;
  lastRecordingDate?: Date;
  
  // Auto-fill and summarization suggestions
  aiSuggestions?: {
    suggestedFields: Record<string, any>;
    confidence: number;
    extractedAt: Date;
    approved: boolean;
    summary?: string;
    summaryKeywords?: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;

  // Virtuals (won't be in DB, but available on document)
  stageColor?: string;
  progressPercentage?: number;
  isOverdue?: boolean;
  daysUntilClose?: number | null;
}

const DealSchema: Schema<IDeal> = new Schema({
  dealName: {
    type: String,
    required: [true, 'Deal name is required'],
    trim: true,
    maxlength: [200, 'Deal name cannot exceed 200 characters']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required'],
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  contactPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  dealValue: {
    type: Number,
    required: [true, 'Deal value is required'],
    min: [0, 'Deal value cannot be negative']
  },
  currency: {
    type: String,
    default: 'THB',
    enum: ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD'] as CurrencyCode[]
  },
  dealStage: {
    type: String,
    enum: ['prospect', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'] as DealStage[],
    default: 'prospect'
  },
  probability: {
    type: Number,
    min: [0, 'Probability cannot be less than 0'],
    max: [100, 'Probability cannot be more than 100'],
    default: 10
  },
  expectedCloseDate: {
    type: Date
  },
  actualCloseDate: {
    type: Date
  },
  source: {
    type: String,
    enum: ['cold-call', 'referral', 'website', 'social-media', 'email', 'other'] as DealSource[],
    default: 'other'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [5000, 'Notes cannot exceed 5000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  nextActions: [{
    type: String,
    trim: true,
    maxlength: [500, 'Next action cannot exceed 500 characters']
  }],
  lastContactDate: {
    type: Date
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  },
  relatedActivities: [{
    type: Schema.Types.ObjectId,
    ref: 'SalesActivity'
  }],
  lastRecordingTranscription: {
    type: String,
    trim: true
  },
  lastRecordingDate: {
    type: Date
  },
  aiSuggestions: {
    suggestedFields: {
      type: Schema.Types.Mixed,
      default: {}
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    extractedAt: {
      type: Date
    },
    approved: {
      type: Boolean,
      default: false
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [5000, 'Summary cannot exceed 5000 characters']
    },
    summaryKeywords: [{
      type: String,
      trim: true,
      maxlength: [100, 'Keyword cannot exceed 100 characters']
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for deal status color
DealSchema.virtual('stageColor').get(function(this: IDeal) {
  const stageColors: Record<DealStage, string> = {
    'prospect': '#6B7280',
    'qualified': '#3B82F6',
    'proposal': '#F59E0B',
    'negotiation': '#EF4444',
    'closed-won': '#10B981',
    'closed-lost': '#6B7280'
  };
  return stageColors[this.dealStage] || '#6B7280';
});

// Virtual for deal progress percentage
DealSchema.virtual('progressPercentage').get(function(this: IDeal) {
  const stageProgress: Record<DealStage, number> = {
    'prospect': 10,
    'qualified': 25,
    'proposal': 50,
    'negotiation': 75,
    'closed-won': 100,
    'closed-lost': 0
  };
  return stageProgress[this.dealStage] || 0;
});

// Virtual for checking if deal is overdue
DealSchema.virtual('isOverdue').get(function(this: IDeal) {
  if (!this.expectedCloseDate || this.dealStage === 'closed-won' || this.dealStage === 'closed-lost') {
    return false;
  }
  return new Date() > this.expectedCloseDate;
});

// Virtual for days until close
DealSchema.virtual('daysUntilClose').get(function(this: IDeal) {
  if (!this.expectedCloseDate) return null;
  const now = new Date();
  const closeDate = this.expectedCloseDate as Date;
  const diffTime = closeDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Create indexes for better performance
DealSchema.index({ dealStage: 1, createdAt: -1 });
DealSchema.index({ assignedTo: 1, dealStage: 1 });
DealSchema.index({ createdBy: 1, createdAt: -1 });
DealSchema.index({ expectedCloseDate: 1, dealStage: 1 });
DealSchema.index({ dealValue: -1 });
DealSchema.index({ dealName: 'text', companyName: 'text', contactPerson: 'text', description: 'text' });

// Pre-save middleware
DealSchema.pre('save', function(this: IDeal, next) {
  if (this.isModified('dealStage')) {
    if ((this.dealStage === 'closed-won' || this.dealStage === 'closed-lost') && !this.actualCloseDate) {
      this.actualCloseDate = new Date();
    }
  }
  if (this.isModified() && !this.isNew) {
    this.lastContactDate = new Date();
  }
  if (!this.aiSuggestions) { // Ensure aiSuggestions object exists
    this.aiSuggestions = { suggestedFields: {}, confidence: 0, extractedAt: new Date(), approved: false };
  } else {
    if (!this.aiSuggestions.suggestedFields) {
        this.aiSuggestions.suggestedFields = {};
    }
    // Ensure other new fields exist with defaults if aiSuggestions itself exists
    if (this.aiSuggestions.summary === undefined) this.aiSuggestions.summary = undefined;
    if (this.aiSuggestions.summaryKeywords === undefined) this.aiSuggestions.summaryKeywords = [];
  }
  next();
});

export default mongoose.model<IDeal>('Deal', DealSchema); 