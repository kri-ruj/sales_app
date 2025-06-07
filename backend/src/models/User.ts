import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import PasswordValidator, { PasswordValidationResult } from '../utils/passwordValidator';

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'sales' | 'user';
  isActive: boolean;
  lastLogin?: Date;
  lineUserId?: string;
  lineDisplayName?: string;
  teamLineGroupId?: string;
  
  // MFA fields
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  mfaVerified: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  validatePassword(password: string): PasswordValidationResult;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    index: { 
      unique: true, 
      partialFilterExpression: { email: { $type: "string" } } 
    },
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    validate: {
      validator: function(this: IUser, password: string) {
        // Skip validation for LINE OAuth users (they don't have passwords)
        if (!password) return true;
        
        const validator = new PasswordValidator();
        const personalInfo = [this.username, this.email, this.firstName, this.lastName];
        const result = validator.validate(password, personalInfo);
        
        if (!result.isValid) {
          // Add validation errors to the validation error
          const error = new Error(result.errors.join('. '));
          throw error;
        }
        return true;
      },
      message: 'Password does not meet security requirements'
    }
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'sales', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  lineUserId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  lineDisplayName: {
    type: String,
    sparse: true,
    maxlength: [100, 'LINE display name cannot exceed 100 characters']
  },
  teamLineGroupId: {
    type: String,
    sparse: true,
    index: true,
    maxlength: [100, 'Team LINE group ID cannot exceed 100 characters']
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: {
    type: String,
    sparse: true,
  },
  mfaBackupCodes: {
    type: [String],
    sparse: true,
  },
  mfaVerified: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Hash password before saving - only if password is provided and modified
UserSchema.pre('save', async function(this: IUser, next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    // Increase salt rounds to 14 for enhanced security
    const salt = await bcrypt.genSalt(14);
    if (typeof this.password === 'string') {
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method - only if password exists
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name method
UserSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Validate password method for checking password strength
UserSchema.methods.validatePassword = function(password: string): PasswordValidationResult {
  const validator = new PasswordValidator();
  const personalInfo = [this.username, this.email, this.firstName, this.lastName];
  return validator.validate(password, personalInfo);
};

UserSchema.index({ role: 1, isActive: 1 });

export default mongoose.model<IUser>('User', UserSchema); 