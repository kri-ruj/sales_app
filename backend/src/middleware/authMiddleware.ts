import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

// Extend Express Request type to include user
export interface ProtectedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const protect = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ message: 'Server error: JWT_SECRET not configured' });
        return;
      }
      const decoded = jwt.verify(token, secret) as DecodedToken;
      console.log('Decoded token:', decoded);

      // Handle mock user case first
      if (decoded.id === '654321654321654321654321') {
        req.user = {
          id: decoded.id,
          role: decoded.role
        };
        next();
        return;
      }

      // Validate ObjectId format before querying
      if (!decoded.id || decoded.id.length !== 24) {
        console.log('Invalid user ID format:', decoded.id);
        res.status(401).json({ message: 'Not authorized, invalid user ID' });
        return;
      }

      // Get user from the token (excluding password)
      const userFromToken = await User.findById(decoded.id).select('-password');
      console.log('User from token:', userFromToken);

      if (!userFromToken || !userFromToken.isActive) {
        res.status(401).json({ message: 'Not authorized, user not found or inactive' });
        return;
      }

      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  } else {
    // Moved the no token check here to ensure it's always checked if the above block doesn't run or fails early
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
  // This part is unreachable if token is processed or if no token is found, due to returns in blocks above.
  // However, to satisfy some interpretations of control flow where `next()` is not guaranteed:
  // if (!token && !(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))) {
  //   res.status(401).json({ message: 'Not authorized, no token (fallback check)' });
  //   return;
  // }
};

// Middleware to restrict access based on roles
export const authorize = (...roles: string[]) => {
  return (req: ProtectedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(401).json({ message: 'Not authorized, user role not available' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
      return;
    }
    next();
  };
}; 