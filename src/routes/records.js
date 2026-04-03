const express = require('express');
const router = express.Router();
const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require('../controllers/recordController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createRecordSchema, updateRecordSchema } = require('../middleware/validate');

// All record routes require authentication
router.use(authenticate);

router.route('/')
  .get(authorize('viewer', 'analyst', 'admin'), getAllRecords)
  .post(authorize('admin'), validate(createRecordSchema), createRecord);

router.route('/:id')
  .get(authorize('viewer', 'analyst', 'admin'), getRecordById)
  .put(authorize('admin'), validate(updateRecordSchema), updateRecord)
  .delete(authorize('admin'), deleteRecord);

module.exports = router;
