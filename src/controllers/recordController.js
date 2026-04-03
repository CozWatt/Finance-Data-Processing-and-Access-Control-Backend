const recordService = require('../services/recordService');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');

/**
 * POST /api/records — Admin only
 */
const createRecord = async (req, res, next) => {
  try {
    const record = await recordService.createRecord(req.body, req.user._id);
    return sendCreated(res, record, 'Record created');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/records — All roles
 * Supports query params: type, category, startDate, endDate, search, page, limit, sortBy, order
 */
const getAllRecords = async (req, res, next) => {
  try {
    const { records, meta } = await recordService.getAllRecords(req.query);
    return sendSuccess(res, records, 'Records fetched', 200, meta);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/records/:id — All roles
 */
const getRecordById = async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(req.params.id);
    return sendSuccess(res, record, 'Record fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/records/:id — Admin only
 */
const updateRecord = async (req, res, next) => {
  try {
    const record = await recordService.updateRecord(req.params.id, req.body);
    return sendSuccess(res, record, 'Record updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/records/:id — Admin only (soft delete)
 */
const deleteRecord = async (req, res, next) => {
  try {
    await recordService.deleteRecord(req.params.id);
    return sendSuccess(res, null, 'Record deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { createRecord, getAllRecords, getRecordById, updateRecord, deleteRecord };
