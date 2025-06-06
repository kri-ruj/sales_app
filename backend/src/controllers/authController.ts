import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { matchedData, validationResult } from 'express-validator';
import axios from 'axios';
import crypto from 'crypto';
import PasswordValidator from '../utils/passwordValidator';
import MFAService from '../services/mfaService';
import LogService from '../services/logService';

// Generate JWT
const generateToken = (userId: string, role: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables. Please set it in your .env file.');
  }
  
  const expiresInSetting: string = process.env.JWT_EXPIRES_IN || '30d';

  const signOptions: SignOptions = {
    expiresIn: expiresInSetting as any,
  };

  return jwt.sign({ id: userId, role }, secret, signOptions);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { username, email, password, firstName, lastName, role } = matchedData(req);

  try {
    // Validate password strength before attempting to create user
    const validator = new PasswordValidator();
    const personalInfo = [username, email, firstName, lastName];
    const passwordValidation = validator.validate(password, personalInfo);
    
    if (!passwordValidation.isValid) {
      res.status(400).json({ 
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
        passwordScore: passwordValidation.score,
        strengthLabel: validator.getStrengthLabel(passwordValidation.score)
      });
      return;
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email or username' 
      });
      return;
    }

    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'sales', // Default to sales if not provided
    });

    if (user) {
      // Log successful user registration
      await LogService.info(
        'USER_REGISTERED',
        `New user registered: ${user.username} (${user.email})`,
        {
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          passwordScore: passwordValidation.score,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        user._id.toString()
      );
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          token: generateToken(user._id, user.role),
        },
        passwordStrength: {
          score: passwordValidation.score,
          label: validator.getStrengthLabel(passwordValidation.score)
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Register error:', error);
    
    // Handle validation errors from mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validationErrors 
      });
      return;
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server Error' 
    });
  }
};

// @desc    Validate password strength (utility endpoint)
// @route   POST /api/auth/validate-password
// @access  Public
export const validatePassword = async (req: Request, res: Response): Promise<void> => {
  const { password, personalInfo = [] } = req.body;
  
  if (!password) {
    res.status(400).json({
      success: false,
      message: 'Password is required'
    });
    return;
  }

  try {
    const validator = new PasswordValidator();
    const result = validator.validate(password, personalInfo);
    
    res.json({
      success: true,
      data: {
        isValid: result.isValid,
        errors: result.errors,
        score: result.score,
        strengthLabel: validator.getStrengthLabel(result.score),
        requirements: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          minUniqueChars: 8
        }
      }
    });
  } catch (error: any) {
    console.error('Password validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating password'
    });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = matchedData(req);

  try {
    // Mock login for testing
    if (email === 'test@test.com' && password === 'test123') {
      const mockUser = {
        _id: '654321654321654321654321', // Valid MongoDB ObjectId format
        username: 'testuser',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'sales',
        lastLogin: new Date(),
        mfaEnabled: false,
      };

      // Log mock login
      await LogService.info(
        'USER_LOGIN_MOCK',
        `Mock user login: ${mockUser.email}`,
        {
          userId: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          mfaEnabled: mockUser.mfaEnabled,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        mockUser._id
      );

      res.json({
        success: true,
        data: {
          _id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          token: generateToken(mockUser._id, mockUser.role),
          mfaRequired: false,
        }
      });
      return;
    }

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // Check if MFA is enabled
      if (user.mfaEnabled && user.mfaVerified) {
        // Log MFA required login attempt
        await LogService.info(
          'USER_LOGIN_MFA_REQUIRED',
          `User login with MFA required: ${user.email}`,
          {
            userId: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            mfaEnabled: true,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          },
          user._id.toString()
        );
        
        // Don't provide token yet - require MFA verification
        res.json({
          success: true,
          message: 'Password verified. MFA required.',
          data: {
            mfaRequired: true,
            email: user.email,
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        });
        return;
      }

      // No MFA required - provide token immediately
      user.lastLogin = new Date();
      await user.save();
      
      // Log successful login
      await LogService.info(
        'USER_LOGIN_SUCCESS',
        `User login successful: ${user.email}`,
        {
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          lastLogin: user.lastLogin,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        user._id.toString()
      );
      
      res.json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          token: generateToken(user._id, user.role),
          mfaRequired: false,
          mfaEnabled: user.mfaEnabled,
        }
      });
    } else {
      // Log failed login attempt
      await LogService.warning(
        'USER_LOGIN_FAILED',
        `Failed login attempt for email: ${email}`,
        {
          email,
          userExists: !!user,
          timestamp: new Date(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get current user data
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
  // req.user is set by the auth middleware
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Not authorized, no user ID' });
    return;
  }

  try {
    // Handle mock user case first
    if (userId === '654321654321654321654321') {
      res.json({
        _id: '654321654321654321654321',
        username: 'testuser',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'sales',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return;
    }

    const user = await User.findById(userId).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Redirect to LINE authorization page
// @route   GET /api/auth/line
// @access  Public
export const redirectToLineAuth = (req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString('hex');
  // Store state in session or a temporary store to verify later
  // For simplicity, if using server-side sessions like express-session:
  // (req.session as any).lineLoginState = state;
  // If not using sessions, you might need a temporary DB store or signed state.
  // For this example, we'll assume you might handle state verification differently or skip for local dev.
  console.log(`Generated LINE login state: ${state}`); // Log for now
  // Temporary: Storing state in a global object (NOT FOR PRODUCTION)
  (global as any).lineLoginState = state;


  const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code` +
    `&client_id=${process.env.LINE_LOGIN_CHANNEL_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.LINE_LOGIN_CALLBACK_URL || '')}` +
    `&state=${state}` +
    `&scope=profile%20openid%20email` +
    `&bot_prompt=aggressive`; // Optional: To encourage adding Official Account as friend

  res.redirect(lineAuthUrl);
};

// @desc    Handle LINE callback, exchange code for token, get user info
// @route   GET /api/auth/line/callback
// @access  Public
export const handleLineCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query;
  const storedState = (global as any).lineLoginState; 
  delete (global as any).lineLoginState; 

  const frontendCallbackUrl = process.env.FRONTEND_URL || 'http://localhost:3999';
  const lineAuthCallbackPath = '/auth/line-callback'; // Path in your frontend app

  if (!code || typeof code !== 'string') {
    // res.status(400).json({ message: 'Authorization code is missing or invalid' });
    res.redirect(`${frontendCallbackUrl}${lineAuthCallbackPath}?status=error&message=Authorization+code+is+missing`);
    return;
  }
  if (!state || state !== storedState) {
    console.error('LINE Login state mismatch. Stored:', storedState, 'Received:', state);
    // res.status(400).json({ message: 'Invalid state parameter. Possible CSRF attack.' });
    res.redirect(`${frontendCallbackUrl}${lineAuthCallbackPath}?status=error&message=Invalid+state+parameter`);
    return;
  }

  try {
    const tokenResponse = await axios.post(
      'https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.LINE_LOGIN_CALLBACK_URL || '',
        client_id: process.env.LINE_LOGIN_CHANNEL_ID || '',
        client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET || '',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, id_token } = tokenResponse.data;

    if (!id_token) {
      // res.status(400).json({ message: 'ID token not found in LINE response' });
      res.redirect(`${frontendCallbackUrl}${lineAuthCallbackPath}?status=error&message=ID+token+not+found`);
      return;
    }

    let lineProfile;
    try {
        const decodedIdToken: any = jwt.decode(id_token);
        if (!decodedIdToken || !decodedIdToken.sub) {
            throw new Error('Invalid ID token or missing sub (LINE User ID).');
        }
        // IMPORTANT: Verify ID token signature in production!
        lineProfile = {
            userId: decodedIdToken.sub,
            displayName: decodedIdToken.name,
            pictureUrl: decodedIdToken.picture,
            email: decodedIdToken.email 
        };
    } catch (err) {
        console.error("Error decoding/verifying ID token: ", err);
        const profileResponse = await axios.get('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        lineProfile = profileResponse.data;
    }
    
    if (!lineProfile || !lineProfile.userId) {
      // res.status(500).json({ message: 'Failed to get LINE user profile' });
      res.redirect(`${frontendCallbackUrl}${lineAuthCallbackPath}?status=error&message=Failed+to+get+LINE+user+profile`);
      return;
    }

    let user = await User.findOne({ lineUserId: lineProfile.userId });

    if (!user) {
      if (lineProfile.email) {
        user = await User.findOne({ email: lineProfile.email });
        if (user) {
          user.lineUserId = lineProfile.userId;
        } 
      }
      if (!user) { 
        let newUsername = (lineProfile.displayName?.replace(/\s+/g, '').toLowerCase() || `lineuser_${crypto.randomBytes(4).toString('hex')}`);
        let usernameExists = await User.findOne({ username: newUsername });
        let attempt = 0;
        while(usernameExists && attempt < 5) {
            newUsername = `${lineProfile.displayName?.replace(/\s+/g, '').toLowerCase()}${crypto.randomBytes(2).toString('hex')}`;
            usernameExists = await User.findOne({ username: newUsername });
            attempt++;
        }
        if (usernameExists) {
            res.redirect(`${frontendCallbackUrl}${lineAuthCallbackPath}?status=error&message=Could+not+create+unique+username`);
            return;
        }
        user = await User.create({
          lineUserId: lineProfile.userId,
          username: newUsername, 
          email: lineProfile.email, 
          firstName: lineProfile.displayName?.split(' ')[0] || 'LINE',
          lastName: lineProfile.displayName?.split(' ').slice(1).join(' ') || 'User',
          role: 'sales', 
          isActive: true,
        });
      }
    } else {
      user.lastLogin = new Date();
    }

    await user.save();
    const appToken = generateToken(user._id, user.role);

    // Redirect to frontend with the app token
    res.redirect(`${frontendCallbackUrl}${lineAuthCallbackPath}?token=${appToken}&status=success`);

  } catch (error: any) {
    console.error('LINE Callback Error:', error.response?.data || error.message || error);
    // res.status(500).json({ message: 'LINE login process failed.', details: error.response?.data || error.message });
    res.redirect(`${frontendCallbackUrl}${lineAuthCallbackPath}?status=error&message=LINE+login+process+failed`);
  }
};

// @desc    Setup MFA for a user
// @route   POST /api/auth/mfa/setup
// @access  Private
export const setupMFA = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.mfaEnabled) {
      res.status(400).json({ success: false, message: 'MFA is already enabled for this user' });
      return;
    }

    // Generate MFA setup data
    const mfaSetup = MFAService.generateMFASetup(user.email, user.getFullName());
    const qrCodeDataUrl = await MFAService.generateQRCodeDataURL(mfaSetup.qrCodeUrl);

    // Store secret temporarily (not yet enabled)
    user.mfaSecret = mfaSetup.secret;
    user.mfaBackupCodes = mfaSetup.backupCodes;
    await user.save();

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        manualEntryKey: mfaSetup.manualEntryKey,
        backupCodes: mfaSetup.backupCodes,
        message: 'Scan the QR code with your authenticator app, then verify with a 6-digit code to complete setup'
      }
    });
  } catch (error: any) {
    console.error('MFA Setup error:', error);
    res.status(500).json({ success: false, message: 'Failed to setup MFA' });
  }
};

// @desc    Verify and enable MFA
// @route   POST /api/auth/mfa/verify-setup
// @access  Private
export const verifyMFASetup = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  const { token } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }

  if (!token) {
    res.status(400).json({ success: false, message: 'MFA token is required' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.mfaSecret) {
      res.status(400).json({ success: false, message: 'MFA setup not initiated' });
      return;
    }

    // Verify the token
    const verification = MFAService.validateMFASetup(token, user.mfaSecret);
    
    if (!verification.isValid) {
      res.status(400).json({ 
        success: false, 
        message: verification.message 
      });
      return;
    }

    // Enable MFA
    user.mfaEnabled = true;
    user.mfaVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'MFA enabled successfully',
      data: {
        mfaEnabled: true,
        backupCodesCount: user.mfaBackupCodes?.length || 0
      }
    });
  } catch (error: any) {
    console.error('MFA Verify Setup error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify MFA setup' });
  }
};

// @desc    Verify MFA token during login
// @route   POST /api/auth/mfa/verify
// @access  Public (but requires valid user context)
export const verifyMFA = async (req: Request, res: Response): Promise<void> => {
  const { email, token, isBackupCode } = req.body;

  if (!email || !token) {
    res.status(400).json({ success: false, message: 'Email and token are required' });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      res.status(400).json({ success: false, message: 'MFA not enabled for this user' });
      return;
    }

    let verification;
    
    if (isBackupCode) {
      // Verify backup code
      const backupVerification = MFAService.verifyBackupCode(token, user.mfaBackupCodes || []);
      if (backupVerification.isValid) {
        // Update remaining backup codes
        user.mfaBackupCodes = backupVerification.remainingCodes;
        await user.save();
        
        verification = { isValid: true, message: 'Backup code verified' };
        
        // Warn if running low on backup codes
        if (!MFAService.hasEnoughBackupCodes(backupVerification.remainingCodes)) {
          // Could send notification or email here
          console.warn(`User ${user.email} has few backup codes remaining: ${backupVerification.remainingCodes.length}`);
        }
      } else {
        verification = { isValid: false, message: 'Invalid backup code' };
      }
    } else {
      // Verify TOTP token
      verification = MFAService.verifyTOTP(token, user.mfaSecret);
    }

    if (!verification.isValid) {
      res.status(400).json({ 
        success: false, 
        message: verification.message 
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const authToken = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'MFA verification successful',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token: authToken,
        mfaEnabled: user.mfaEnabled,
        backupCodesRemaining: user.mfaBackupCodes?.length || 0
      }
    });
  } catch (error: any) {
    console.error('MFA Verify error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify MFA' });
  }
};

// @desc    Disable MFA for a user
// @route   POST /api/auth/mfa/disable
// @access  Private
export const disableMFA = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  const { password, token } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }

  if (!password || !token) {
    res.status(400).json({ success: false, message: 'Password and MFA token are required' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(400).json({ success: false, message: 'Invalid password' });
      return;
    }

    // Verify MFA token
    if (user.mfaEnabled && user.mfaSecret) {
      const verification = MFAService.verifyTOTP(token, user.mfaSecret);
      if (!verification.isValid) {
        res.status(400).json({ success: false, message: verification.message });
        return;
      }
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.mfaBackupCodes = undefined;
    user.mfaVerified = false;
    await user.save();

    res.json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error: any) {
    console.error('MFA Disable error:', error);
    res.status(500).json({ success: false, message: 'Failed to disable MFA' });
  }
};

// @desc    Regenerate backup codes
// @route   POST /api/auth/mfa/regenerate-codes
// @access  Private
export const regenerateBackupCodes = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  const { password } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }

  if (!password) {
    res.status(400).json({ success: false, message: 'Password is required' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (!user.mfaEnabled) {
      res.status(400).json({ success: false, message: 'MFA is not enabled' });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(400).json({ success: false, message: 'Invalid password' });
      return;
    }

    // Generate new backup codes
    const newBackupCodes = MFAService.regenerateBackupCodes();
    user.mfaBackupCodes = newBackupCodes;
    await user.save();

    res.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes: newBackupCodes
      }
    });
  } catch (error: any) {
    console.error('Regenerate backup codes error:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate backup codes' });
  }
};

// @desc    Get MFA status
// @route   GET /api/auth/mfa/status
// @access  Private
export const getMFAStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        mfaEnabled: user.mfaEnabled,
        mfaVerified: user.mfaVerified,
        backupCodesCount: user.mfaBackupCodes?.length || 0,
        hasLowBackupCodes: !MFAService.hasEnoughBackupCodes(user.mfaBackupCodes || [])
      }
    });
  } catch (error: any) {
    console.error('Get MFA Status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get MFA status' });
  }
}; 