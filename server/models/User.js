const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String,
    required: true,
    unique: true,
    lowercase: true // ✅ Ensures consistent email casing
  },
  password: { 
    type: String, 
    required: true 
  },
  phone: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    default: 0 // ✅ Salary field added for payroll
  },
  role: { 
    type: String, 
    enum: ['employee', 'admin'], 
    default: 'employee' 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
