import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

export interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  isValid: boolean;
  message: string;
}

export class MFAService {
  private static readonly SERVICE_NAME = 'Bright Sales CRM';
  private static readonly BACKUP_CODE_LENGTH = 8;
  private static readonly BACKUP_CODE_COUNT = 10;

  /**
   * Generate a new MFA secret and setup data for a user
   */
  static generateMFASetup(userEmail: string, userName: string): MFASetupData {
    // Generate a secret
    const secret = speakeasy.generateSecret({
      name: `${userName} (${userEmail})`,
      issuer: this.SERVICE_NAME,
      length: 32,
    });

    if (!secret.otpauth_url) {
      throw new Error('Failed to generate OTP auth URL');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.ascii,
      qrCodeUrl: secret.otpauth_url,
      manualEntryKey: secret.base32,
      backupCodes,
    };
  }

  /**
   * Generate QR code data URL for the given OTP auth URL
   */
  static async generateQRCodeDataURL(otpAuthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpAuthUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }

  /**
   * Verify a TOTP token against a secret
   */
  static verifyTOTP(token: string, secret: string, window?: number): MFAVerificationResult {
    if (!token || !secret) {
      return { isValid: false, message: 'Token and secret are required' };
    }

    // Remove any spaces and ensure it's exactly 6 digits
    const cleanToken = token.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanToken)) {
      return { isValid: false, message: 'Invalid token format. Must be 6 digits.' };
    }

    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'ascii',
        token: cleanToken,
        step: 30, // 30-second window
        window: window || 2, // Allow ±2 time steps (±60 seconds tolerance)
      });

      return {
        isValid: verified,
        message: verified ? 'Token verified successfully' : 'Invalid or expired token'
      };
    } catch (error) {
      return { isValid: false, message: 'Token verification failed' };
    }
  }

  /**
   * Verify a backup code
   */
  static verifyBackupCode(inputCode: string, storedCodes: string[]): { isValid: boolean; remainingCodes: string[] } {
    if (!inputCode || !storedCodes) {
      return { isValid: false, remainingCodes: storedCodes || [] };
    }

    const cleanCode = inputCode.replace(/\s+/g, '').toUpperCase();
    const codeIndex = storedCodes.indexOf(cleanCode);

    if (codeIndex === -1) {
      return { isValid: false, remainingCodes: storedCodes };
    }

    // Remove the used backup code
    const remainingCodes = [...storedCodes];
    remainingCodes.splice(codeIndex, 1);

    return { isValid: true, remainingCodes };
  }

  /**
   * Generate backup codes for account recovery
   */
  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = crypto.randomBytes(this.BACKUP_CODE_LENGTH / 2).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate a new set of backup codes (for regeneration)
   */
  static regenerateBackupCodes(): string[] {
    return this.generateBackupCodes();
  }

  /**
   * Validate MFA setup by requiring the user to verify their first token
   */
  static validateMFASetup(token: string, secret: string): MFAVerificationResult {
    // Use a smaller window for setup verification to ensure clock sync
    return this.verifyTOTP(token, secret, 1);
  }

  /**
   * Check if a user has sufficient backup codes remaining
   */
  static hasEnoughBackupCodes(backupCodes: string[], threshold: number = 3): boolean {
    return backupCodes.length >= threshold;
  }

  /**
   * Generate current TOTP for testing/demonstration (NEVER use in production auth flow)
   */
  static generateCurrentTOTP(secret: string): string {
    return speakeasy.totp({
      secret: secret,
      encoding: 'ascii',
      step: 30
    });
  }
}

export default MFAService; 