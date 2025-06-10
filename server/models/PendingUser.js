const mongoose = require('mongoose');

const PendingUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  position: String,
  company: String,
  schedule: Object,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PendingUser', PendingUserSchema);
