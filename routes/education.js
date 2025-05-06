// server.js (or routes/education.js)
const express = require('express');
const jwt = require('jsonwebtoken');
const Education = require('./models/Education'); // Import the Education model
const authenticateToken = require('./middleware/authenticateToken'); // Middleware to verify JWT

const router = express.Router();

// API endpoint for adding education details
router.post('/education', authenticateToken, async (req, res) => {
  const { degree, institution, graduationYear } = req.body;
  const username = req.user.username; // Extract the username from the token

  try {
    const newEducation = new Education({
      username,
      degree,
      institution,
      graduationYear,
    });

    await newEducation.save();
    res.status(200).json({ message: 'Education details saved successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save education details.' });
  }
});

module.exports = router;
