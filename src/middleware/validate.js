const Joi = require('joi');
const { sendError } = require('../utils/apiResponse');
const { ROLES } = require('../models/User');
const { RECORD_TYPES, CATEGORIES } = require('../models/FinancialRecord');

/**
 * Generic validation middleware factory.
 * Validates req.body against the given Joi schema.
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((d) => d.message.replace(/"/g, "'"));
    return sendError(res, 'Validation failed', 400, errors);
  }

  next();
};

// ─── Auth Schemas ────────────────────────────────────────────────────────────

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ─── User Schemas ─────────────────────────────────────────────────────────────

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...ROLES).default('viewer'),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  role: Joi.string().valid(...ROLES),
  status: Joi.string().valid('active', 'inactive'),
}).min(1); // At least one field required

// ─── Financial Record Schemas ─────────────────────────────────────────────────

const createRecordSchema = Joi.object({
  amount: Joi.number().positive().required(),
  type: Joi.string().valid(...RECORD_TYPES).required(),
  category: Joi.string().valid(...CATEGORIES).required(),
  date: Joi.date().iso().default(() => new Date()),
  notes: Joi.string().max(500).allow('', null),
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().positive(),
  type: Joi.string().valid(...RECORD_TYPES),
  category: Joi.string().valid(...CATEGORIES),
  date: Joi.date().iso(),
  notes: Joi.string().max(500).allow('', null),
}).min(1);

module.exports = {
  validate,
  loginSchema,
  createUserSchema,
  updateUserSchema,
  createRecordSchema,
  updateRecordSchema,
};
