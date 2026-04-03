const { FinancialRecord } = require('../models/FinancialRecord');

/**
 * Build a MongoDB filter object from query params.
 * Supports: type, category, startDate, endDate, search (notes)
 */
const buildFilter = ({ type, category, startDate, endDate, search } = {}) => {
  const filter = {};

  if (type) filter.type = type;
  if (category) filter.category = category;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (search) {
    filter.notes = { $regex: search, $options: 'i' };
  }

  return filter;
};

/**
 * Create a financial record.
 */
const createRecord = async (data, userId) => {
  const record = await FinancialRecord.create({ ...data, createdBy: userId });
  return record;
};

/**
 * Get all records with filtering and pagination.
 */
const getAllRecords = async (queryParams = {}) => {
  const { page = 1, limit = 10, sortBy = 'date', order = 'desc', ...filterParams } = queryParams;

  const filter = buildFilter(filterParams);
  const skip = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 1 : -1;

  const [records, total] = await Promise.all([
    FinancialRecord.find(filter)
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    FinancialRecord.countDocuments(filter),
  ]);

  return {
    records,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single record by ID.
 */
const getRecordById = async (id) => {
  const record = await FinancialRecord.findById(id).populate('createdBy', 'name email');
  if (!record) {
    throw Object.assign(new Error('Record not found'), { statusCode: 404 });
  }
  return record;
};

/**
 * Update a record. Only provided fields are changed.
 */
const updateRecord = async (id, updates) => {
  const record = await FinancialRecord.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'name email');

  if (!record) {
    throw Object.assign(new Error('Record not found'), { statusCode: 404 });
  }
  return record;
};

/**
 * Soft delete a record.
 */
const deleteRecord = async (id) => {
  const record = await FinancialRecord.findByIdAndUpdate(
    id,
    { deletedAt: new Date() },
    { new: true }
  );
  if (!record) {
    throw Object.assign(new Error('Record not found'), { statusCode: 404 });
  }
  return record;
};

module.exports = { createRecord, getAllRecords, getRecordById, updateRecord, deleteRecord };
