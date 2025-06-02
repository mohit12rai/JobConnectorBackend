// O:\JobConnector\backend\models\JobProvider.js
const mongoose = require('mongoose');

const jobProviderSchema = new mongoose.Schema({
  companyName: { type: String },
  hrName: { type: String },
  hrWhatsappNumber: { type: String },
  // mode: { type: String, enum: ['message', 'call', 'both'], required: true },
  email: { type: String },
  password: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('JobProvider', jobProviderSchema);