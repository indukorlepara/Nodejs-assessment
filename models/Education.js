// models/Education.js
const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  username: { type: String, required: true },
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  graduationYear: { type: String, required: true },
});

const Education = mongoose.model('Education', educationSchema);

module.exports = Education;
