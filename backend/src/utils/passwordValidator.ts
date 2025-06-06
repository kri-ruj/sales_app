export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-10 strength score
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minUniqueChars: number;
  prohibitCommonPasswords: boolean;
  prohibitPersonalInfo?: string[]; // email, username, name parts
}

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minUniqueChars: 8,
  prohibitCommonPasswords: true,
};

// Common weak passwords list (partial)
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '123456789', 'qwerty', 'abc123',
  'password1', 'admin', 'letmein', 'welcome', 'monkey', '1234567890',
  'Password1', 'Password123', 'admin123', 'root', 'toor', 'pass', 'test',
  'guest', 'info', 'adm', 'mysql', 'user', 'administrator', 'oracle',
  'ftp', 'pi', 'puppet', 'ansible', 'ec2-user', 'vagrant', 'azureuser'
]);

export class PasswordValidator {
  private policy: PasswordPolicy;

  constructor(policy: Partial<PasswordPolicy> = {}) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
  }

  validate(password: string, personalInfo: string[] = []): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Length validation
    if (password.length < this.policy.minLength) {
      errors.push(`Password must be at least ${this.policy.minLength} characters long`);
    } else {
      score += Math.min(password.length / this.policy.minLength, 2);
    }

    if (password.length > this.policy.maxLength) {
      errors.push(`Password cannot exceed ${this.policy.maxLength} characters`);
    }

    // Character type requirements
    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 1;
    }

    if (this.policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 1;
    }

    if (this.policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      score += 1;
    }

    // Unique characters check
    const uniqueChars = new Set(password.toLowerCase()).size;
    if (uniqueChars < this.policy.minUniqueChars) {
      errors.push(`Password must contain at least ${this.policy.minUniqueChars} unique characters`);
    } else {
      score += Math.min(uniqueChars / this.policy.minUniqueChars, 2);
    }

    // Common password check
    if (this.policy.prohibitCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
    }

    // Personal information check
    if (personalInfo.length > 0) {
      const lowerPassword = password.toLowerCase();
      for (const info of personalInfo) {
        if (info && info.length >= 3 && lowerPassword.includes(info.toLowerCase())) {
          errors.push('Password cannot contain personal information (name, email, username)');
          break;
        }
      }
    }

    // Additional complexity scoring
    if (password.length >= 16) score += 1;
    if (password.length >= 20) score += 1;
    if (/[A-Z].*[A-Z]/.test(password)) score += 0.5; // Multiple uppercase
    if (/[a-z].*[a-z]/.test(password)) score += 0.5; // Multiple lowercase  
    if (/\d.*\d/.test(password)) score += 0.5; // Multiple numbers
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) score += 0.5; // Multiple special chars

    // Cap the score at 10
    score = Math.min(Math.round(score * 100) / 100, 10);

    return {
      isValid: errors.length === 0,
      errors,
      score
    };
  }

  getStrengthLabel(score: number): string {
    if (score < 3) return 'Very Weak';
    if (score < 5) return 'Weak';
    if (score < 7) return 'Fair';
    if (score < 8.5) return 'Strong';
    return 'Very Strong';
  }

  static getDefaultPolicy(): PasswordPolicy {
    return { ...DEFAULT_POLICY };
  }
}

export default PasswordValidator; 