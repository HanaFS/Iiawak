/**
 * Request Validator Middleware
 * Validates and sanitizes incoming requests
 */

const { body, query, param, validationResult } = require('express-validator');
const logger = require('../../core/Logger/logger');
const AppError = require('../../core/Exceptions/AppError');

/**
 * Validation error handler
 */
const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.param,
      value: error.value,
      message: error.msg,
    }));

    logger.warn(`[Validation] Request validation failed: ${JSON.stringify(formattedErrors)}`);

    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: formattedErrors,
    });
  }
  next();
};

/**
 * Authentication Validators
 */
const authValidators = {
  register: [
    body('email')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email must be less than 255 characters'),

    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),

    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscore, and dash'),

    body('fullName')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Full name must be less than 100 characters')
      .trim(),

    body('phone')
      .optional()
      .matches(/^[0-9]{10,15}$/)
      .withMessage('Invalid phone number format'),

    validationErrorHandler,
  ],

  login: [
    body('email')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),

    body('password')
      .notEmpty()
      .withMessage('Password is required'),

    validationErrorHandler,
  ],

  resetPassword: [
    body('email')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),

    validationErrorHandler,
  ],

  updatePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),

    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain uppercase, lowercase, and number'),

    body('confirmPassword')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords do not match'),

    validationErrorHandler,
  ],
};

/**
 * User Validators
 */
const userValidators = {
  updateProfile: [
    body('fullName')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Full name must be less than 100 characters')
      .trim(),

    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters')
      .trim(),

    body('phone')
      .optional()
      .matches(/^[0-9]{10,15}$/)
      .withMessage('Invalid phone number format'),

    body('location')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Location must be less than 100 characters')
      .trim(),

    validationErrorHandler,
  ],

  updatePreferences: [
    body('emailNotifications')
      .optional()
      .isBoolean()
      .withMessage('emailNotifications must be boolean'),

    body('pushNotifications')
      .optional()
      .isBoolean()
      .withMessage('pushNotifications must be boolean'),

    body('inAppNotifications')
      .optional()
      .isBoolean()
      .withMessage('inAppNotifications must be boolean'),

    validationErrorHandler,
  ],
};

/**
 * Payment Validators
 */
const paymentValidators = {
  createPayment: [
    body('packageId')
      .notEmpty()
      .withMessage('packageId is required')
      .isMongoId()
      .withMessage('Invalid package ID format'),

    body('amount')
      .isInt({ min: 1000, max: 50000000 })
      .withMessage('Amount must be between 1,000 and 50,000,000'),

    validationErrorHandler,
  ],

  refundTransaction: [
    body('reason')
      .notEmpty()
      .withMessage('Refund reason is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be 10-500 characters')
      .trim(),

    validationErrorHandler,
  ],
};

/**
 * Post/Comment Validators
 */
const contentValidators = {
  createPost: [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be 5-200 characters')
      .trim(),

    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Content must be 10-5000 characters')
      .trim(),

    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
      .custom((value) => {
        if (value.length > 10) {
          throw new Error('Maximum 10 tags allowed');
        }
        return true;
      }),

    validationErrorHandler,
  ],

  createComment: [
    body('content')
      .notEmpty()
      .withMessage('Comment is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be 1-1000 characters')
      .trim(),

    validationErrorHandler,
  ],
};

/**
 * Search Validators
 */
const searchValidators = {
  search: [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Query must be 2-100 characters')
      .trim(),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),

    query('type')
      .optional()
      .isIn(['user', 'post', 'character', 'all'])
      .withMessage('Type must be one of: user, post, character, all'),

    validationErrorHandler,
  ],
};

/**
 * ID Validators (for URL parameters)
 */
const idValidators = {
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format'),

    validationErrorHandler,
  ],

  userId: [
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID format'),

    validationErrorHandler,
  ],

  postId: [
    param('postId')
      .isMongoId()
      .withMessage('Invalid post ID format'),

    validationErrorHandler,
  ],
};

/**
 * Pagination Validators
 */
const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('sort')
    .optional()
    .matches(/^-?[a-zA-Z_]+$/)
    .withMessage('Invalid sort format'),

  validationErrorHandler,
];

/**
 * Sanitize middleware - general purpose
 */
const sanitizeMiddleware = (req, res, next) => {
  // Sanitize query strings
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    }
  }

  // Sanitize body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }

  next();
};

/**
 * Prevent SQL/NoSQL injection patterns
 */
const preventInjectionMiddleware = (req, res, next) => {
  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    const suspiciousPatterns = [
      /(\$where|\$ne|\$gt|\$lt|\$or|\$and)/i, // NoSQL injection
      /(;|--|\/\*|\*\/|xp_|sp_|exec|execute)/i, // SQL injection
      /(<script|javascript:|onerror=|onload=)/i, // XSS
    ];
    return suspiciousPatterns.some((pattern) => pattern.test(str));
  };

  // Check body
  if (req.body) {
    for (const key in req.body) {
      if (checkString(req.body[key])) {
        logger.warn(`[Security] Potential injection attempt in body.${key}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid input detected',
        });
      }
    }
  }

  // Check query
  if (req.query) {
    for (const key in req.query) {
      if (checkString(req.query[key])) {
        logger.warn(`[Security] Potential injection attempt in query.${key}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid input detected',
        });
      }
    }
  }

  next();
};

module.exports = {
  authValidators,
  userValidators,
  paymentValidators,
  contentValidators,
  searchValidators,
  idValidators,
  paginationValidators,
  sanitizeMiddleware,
  preventInjectionMiddleware,
  validationErrorHandler,
};
