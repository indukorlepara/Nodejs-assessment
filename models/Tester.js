// models/Tester.js
const mongoose = require('mongoose');

const testerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
});

const Tester = mongoose.model('Tester', testerSchema);

module.exports = Tester;
