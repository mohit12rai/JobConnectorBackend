// O:\JobConnector\backend\models\JobSeeker.js
const mongoose = require('mongoose');

// Define a separate sub-schema for profiles
const profileSchema = new mongoose.Schema({
  fullName: String,
  whatsappNumber: Number,
  skillType: String,
  skills: [String],
  experience: Number,
  location: String,
  currentCTC: Number,
  expectedCTC: Number,
  noticePeriod: String,
  lastWorkingDate: String,
  resume: String,
  bio: String,
  createdAt: { type: Date, default: Date.now }
});

// Main JobSeeker schema
const jobSeekerSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String }, // Can be null or optional for OTP-only auth
  profiles: {
    type: [profileSchema],
    validate: [arrayLimit, '{PATH} exceeds the limit of 5'] // Optional validation
  },
  appliedJobs: [{ jobId: String, title: String, status: String }]
}, { timestamps: true });

// Optional validator to enforce max 5 profiles at DB level
function arrayLimit(val) {
  return val.length <= 5;
}

module.exports = mongoose.model('JobSeeker', jobSeekerSchema);
