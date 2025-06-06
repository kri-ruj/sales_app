import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICustomer extends Document {
  _id: Types.ObjectId;
  name: string; // Full name or company name if B2B
  email?: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  status: 'lead' | 'prospect' | 'active_customer' | 'inactive_customer' | 'former_customer';
  source?: string; // How was this customer acquired? (e.g., Website, Referral, Cold Call)
  tags?: string[];
  notes?: string;
  totalValue?: number; // Total value of deals won with this customer
  lastContactDate?: Date;
  assignedTo?: Types.ObjectId; // User ID of the sales person assigned
  createdBy: Types.ObjectId; // User ID of who created this customer record
  
  // Enhanced classification fields for team usage
  industry?: string; // Industry sector (e.g., Technology, Manufacturing, Healthcare)
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'; // Number of employees
  budget?: 'low' | 'medium' | 'high' | 'enterprise'; // Budget range
  priority?: 'low' | 'medium' | 'high' | 'urgent'; // Sales priority
  leadScore?: number; // Lead scoring (0-100)
  region?: string; // Geographic region
  timezone?: string; // Customer timezone
  preferredContactMethod?: 'email' | 'phone' | 'line' | 'meeting'; // How they prefer to be contacted
  decisionMaker?: boolean; // Is this person the decision maker?
  painPoints?: string[]; // Customer's main challenges
  interests?: string[]; // What they're interested in
  competitors?: string[]; // Who they're considering
  nextFollowUp?: Date; // Next scheduled follow-up date
  referredBy?: string; // Who referred this customer
  socialProfiles?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    line?: string;
  };
  customFields?: { [key: string]: any }; // Flexible custom data
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    index: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    // Consider if email should be unique per customer or if multiple contacts can share an email
    // sparse: true, // if unique and optional
    index: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
    index: true,
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  status: {
    type: String,
    enum: ['lead', 'prospect', 'active_customer', 'inactive_customer', 'former_customer'],
    default: 'lead',
    required: true,
    index: true,
  },
  source: {
    type: String,
    trim: true,
  },
  tags: [{ type: String, trim: true }],
  notes: {
    type: String,
    trim: true,
  },
  totalValue: {
    type: Number,
    default: 0,
  },
  lastContactDate: {
    type: Date,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Enhanced classification fields
  industry: {
    type: String,
    trim: true,
    index: true,
  },
  companySize: {
    type: String,
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    index: true,
  },
  budget: {
    type: String,
    enum: ['low', 'medium', 'high', 'enterprise'],
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true,
  },
  leadScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  region: {
    type: String,
    trim: true,
    index: true,
  },
  timezone: {
    type: String,
    trim: true,
  },
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone', 'line', 'meeting'],
    default: 'email',
  },
  decisionMaker: {
    type: Boolean,
    default: false,
  },
  painPoints: [{ type: String, trim: true }],
  interests: [{ type: String, trim: true }],
  competitors: [{ type: String, trim: true }],
  nextFollowUp: {
    type: Date,
    index: true,
  },
  referredBy: {
    type: String,
    trim: true,
  },
  socialProfiles: {
    linkedin: { type: String, trim: true },
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    line: { type: String, trim: true },
  },
  customFields: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Index for frequently searched fields or combinations
CustomerSchema.index({ name: 'text', company: 'text', email: 'text' }); // For text search
CustomerSchema.index({ status: 1, assignedTo: 1 });

export default mongoose.model<ICustomer>('Customer', CustomerSchema); 