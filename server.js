// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const Education = require('./models/Education');
const Tester = require('./models/Tester');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create an express app
const app = express();
const secretKey =process.env.SECRET_KEY;  // This is the key you use to verify the token later


// Middleware
app.use(cors());
app.use(bodyParser.json());  // For parsing application/json

// MongoDB connection (Replace with your MongoDB connection string)
mongoose.connect('mongodb+srv://indukin:cqTmerndIyqHw8rY@cluster0.dkb1w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema and model
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from header

  if (!token) return res.sendStatus(403); // Forbidden if no token is found

  jwt.verify(token,secretKey,(err, decode) => {
  
    if (err) {
      if (err.name === 'TokenExpiredError') {
        console.error('Token has expired');
        return res.status(403).json({ message: 'Token has expired' });
      } else if (err.name === 'JsonWebTokenError') {
        console.error('Invalid signature');
        return res.status(403).json({ message: 'Invalid token signature' });
      } else {
        console.error('Error verifying token', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
    } else {
      console.log('Decoded payload:', decode);
      // Proceed with your application logic (e.g., attach user data to request)
      req.user = decode;
      next(); // Pass to the next middleware or route handler
    }

  });
  
};

// API endpoint for registering a new user
app.post('/register', async (req, res) => {
  const { username,email,password } = req.body;

  // Check if username already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'email already exists' });
  }

  // Hash password before saving it
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user and save to the database
  const newUser = new User({ username,email,password: hashedPassword });
  await newUser.save();

  res.status(201).json({ message: 'User registered successfully' });
});

// API endpoint for logging in
app.post('/login', async (req, res) => {
  console.log("login went");

  const { email, password } = req.body;

  // Find the user by username
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  console.log(password);
    
  console.log(user.password);

  // Check if password is correct
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log(isPasswordValid);
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const payload = {
    username: user.username,
  };

  // Create a JWT token
  const token = jwt.sign(payload,secretKey, {
    expiresIn: '1h', // Token expiration time
  });

  res.status(200).json({ token });
});

app.get('/education', authenticateJWT, async (req, res) => {
  try {
    // Fetch education details for the authenticated user (based on userId)
    const educationDetails = await Education.find({ username:req.user.username }).populate('username');
    if (!educationDetails || educationDetails.length === 0) {
      return res.status(404).json({ message: 'No education details found' });
    }

    // Send the education details along with the username
    res.status(200).json({
      educationDetails
    });
  } catch (err) {
    console.error('Error fetching education details:', err);
    res.status(500).json({ message: 'Error fetching education details', error: err.message });
  }
});


// POST /education - Add new education details (requires authentication)
app.post('/education', authenticateJWT, async (req, res) => {
  const { username,degree, institution, graduationYear } = req.body;

  // Check if all fields are provided
  if (!degree || !institution || !graduationYear) {
    return res.status(400).send('Missing required fields');
  }
 const newEducation = new Education({username,degree, institution, graduationYear });
 await newEducation.save();

 

  res.status(201).send({ message: 'Education details saved successfully', newEducation });
});


app.post('/submit-form', async (req, res) => {
  const { name, email } = req.body;

  // Check if username already exists
  const existingTester = await Tester.findOne({ name });
  if (existingTester) {
    return res.status(400).json({ message: 'name already exists' });
  }

 // Create a new user and save to the database
  const newTester = new Tester({ name, email });
  await newTester.save();

  res.status(201).json({ message: 'Tester registered successfully' });
});


// MongoDB Schema
const DataSchema = new mongoose.Schema({
  name: String,
  age: Number,
});

const Data = mongoose.model('Data', DataSchema);

// Setup Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Route to upload Excel file
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    // Parse the Excel file
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const workbook = XLSX.readFile(filePath);

    // Assuming the first sheet and its data structure (adjust as needed)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Insert data into MongoDB
    Data.insertMany(data)
        .then((result) => {
            console.log(result);
            res.status(200).send('Data imported successfully');
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error importing data');
        });
});




// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

