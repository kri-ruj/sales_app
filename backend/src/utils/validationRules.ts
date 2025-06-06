import { body, param } from 'express-validator';

export const registrationRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'sales', 'user']).withMessage('Invalid role')
];

export const loginRules = [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Validation rules for Customer
export const customerIdParamRules = [
  param('id').isMongoId().withMessage('Invalid Customer ID format')
];

export const createCustomerRules = [
  body('name').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 200 }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format').normalizeEmail().isLength({ max: 100 }),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('company').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('status').optional().isIn(['lead', 'prospect', 'active_customer', 'inactive_customer', 'former_customer']).withMessage('Invalid status'),
  body('source').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().isString().trim().isLength({ max: 50 }),
  body('notes').optional({ checkFalsy: true }).trim(),
  body('address.street').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('address.city').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('address.state').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('address.postalCode').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body('address.country').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('assignedTo').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid User ID for assignedTo'),
  
  // Enhanced classification fields
  body('industry').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('companySize').optional().isIn(['startup', 'small', 'medium', 'large', 'enterprise']).withMessage('Invalid company size'),
  body('budget').optional().isIn(['low', 'medium', 'high', 'enterprise']).withMessage('Invalid budget range'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('leadScore').optional().isInt({ min: 0, max: 100 }).withMessage('Lead score must be between 0 and 100'),
  body('region').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('timezone').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('preferredContactMethod').optional().isIn(['email', 'phone', 'line', 'meeting']).withMessage('Invalid contact method'),
  body('decisionMaker').optional().isBoolean().withMessage('Decision maker must be true or false'),
  body('painPoints').optional().isArray().withMessage('Pain points must be an array'),
  body('painPoints.*').optional().isString().trim().isLength({ max: 200 }),
  body('interests').optional().isArray().withMessage('Interests must be an array'),
  body('interests.*').optional().isString().trim().isLength({ max: 200 }),
  body('competitors').optional().isArray().withMessage('Competitors must be an array'),
  body('competitors.*').optional().isString().trim().isLength({ max: 200 }),
  body('referredBy').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('socialProfiles.linkedin').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('socialProfiles.facebook').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('socialProfiles.twitter').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('socialProfiles.line').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('customFields').optional().isObject().withMessage('Custom fields must be an object')
];

export const updateCustomerRules = [
  body('name').optional().trim().notEmpty().withMessage('Customer name cannot be empty if provided').isLength({ max: 200 }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format').normalizeEmail().isLength({ max: 100 }),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('company').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('status').optional().isIn(['lead', 'prospect', 'active_customer', 'inactive_customer', 'former_customer']).withMessage('Invalid status'),
  body('source').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().isString().trim().isLength({ max: 50 }),
  body('notes').optional({ checkFalsy: true }).trim(),
  body('address.street').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('address.city').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('address.state').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('address.postalCode').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body('address.country').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('assignedTo').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid User ID for assignedTo'),
  
  // Enhanced classification fields  
  body('industry').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('companySize').optional().isIn(['startup', 'small', 'medium', 'large', 'enterprise']).withMessage('Invalid company size'),
  body('budget').optional().isIn(['low', 'medium', 'high', 'enterprise']).withMessage('Invalid budget range'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('leadScore').optional().isInt({ min: 0, max: 100 }).withMessage('Lead score must be between 0 and 100'),
  body('region').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('timezone').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('preferredContactMethod').optional().isIn(['email', 'phone', 'line', 'meeting']).withMessage('Invalid contact method'),
  body('decisionMaker').optional().isBoolean().withMessage('Decision maker must be true or false'),
  body('painPoints').optional().isArray().withMessage('Pain points must be an array'),
  body('painPoints.*').optional().isString().trim().isLength({ max: 200 }),
  body('interests').optional().isArray().withMessage('Interests must be an array'),
  body('interests.*').optional().isString().trim().isLength({ max: 200 }),
  body('competitors').optional().isArray().withMessage('Competitors must be an array'),
  body('competitors.*').optional().isString().trim().isLength({ max: 200 }),
  body('referredBy').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('socialProfiles.linkedin').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('socialProfiles.facebook').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('socialProfiles.twitter').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('socialProfiles.line').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('customFields').optional().isObject().withMessage('Custom fields must be an object')
  // Cannot update createdBy
]; 