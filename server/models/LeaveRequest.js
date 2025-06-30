// models/LeaveRequest.js
const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fromDate: {
      type: Date,
      required: true
    },
    toDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    leaveType: {
      type: String,
      enum: ['Casual', 'Sick', 'Emergency'],
      default: 'Casual'
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
