// O:\JobConnector\backend\models\Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  fullName: { type: String},
  whatsappNumber: { type: String },
  email: { type: String },
  password: { type: String },
  // mode: { type: String, enum: ['message', 'call', 'both'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);