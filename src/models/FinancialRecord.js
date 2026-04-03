const mongoose = require('mongoose');

const RECORD_TYPES = ['income', 'expense'];

// Predefined categories — assumptions documented in README
const CATEGORIES = [
  'salary', 'freelance', 'investment', 'business',       // income
  'food', 'rent', 'utilities', 'transport', 'health',    // expense
  'entertainment', 'education', 'shopping', 'other',
];

const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: RECORD_TYPES,
      required: [true, 'Type is required (income or expense)'],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Track which user created the record
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Soft delete support
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for common query patterns
financialRecordSchema.index({ type: 1, date: -1 });
financialRecordSchema.index({ category: 1 });
financialRecordSchema.index({ date: -1 });

// Exclude soft-deleted records from all queries by default
financialRecordSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
  next();
});

financialRecordSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);

module.exports = { FinancialRecord, RECORD_TYPES, CATEGORIES };
