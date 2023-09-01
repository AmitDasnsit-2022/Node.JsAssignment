const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD,  //Used .env file to store password of the mysql connection
  database: 'crmdb',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to the database');
  }
});

// Secret key for JWT
const jwtSecret = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
const token = req.header('Authorization').split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Token not provided' });
  console.log('Token', token);
  console.log('KEy',jwtSecret);
  jwt.verify(token, jwtSecret, (err, decoded) => {
    console.error('>>>Errror',err); 
    if (err) return res.status(401).json({ message: 'Amit token' });
    req.userId = decoded.userId; // Change req.user to req.userId
    next();
  });
};

app.get('/', (req, res) => {
    res.send('Welcome to the CRM System API');
  });

// // Employee registration API
app.post('/api/register', (req, res) => {
  const { email, password, name } = req.body;
  const query = 'INSERT INTO employees (email, password, name) VALUES (?, ?, ?)';
  db.query(query, [email, password,name], (err, result) => {
    if (err) {
      console.error('Error registering employee:', err);
      res.status(500).json({ message: 'Internal server error while register user' });
    } else {
      res.status(201).json({ message: 'Employee registered successfully' });
    }
  });
});

// // Employee login API
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT id FROM employees WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ message: 'Internal server error during login' });
    } else {
      if (results.length > 0) {
        const userId = results[0].id;
        const token = jwt.sign({ userId}, jwtSecret, { expiresIn: '1h' });
        console.log(token);
        res.status(200).json({ message: 'Login successful', token });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    }
  });
});

// // API to submit public enquiry
app.post('/api/public-enquiry', (req, res) => {
  const { name, email, courseInterest } = req.body;
  const query = 'INSERT INTO public_enquiries (name, email, course_interest) VALUES (?, ?, ?)';
  db.query(query, [name, email, courseInterest], (err, result) => {
    if (err) {
      console.error('Error submitting enquiry:', err);
      res.status(500).json({ message: 'Internal server error during public enquires' });
    } else {
      res.status(201).json({ message: 'Enquiry submitted successfully' });
    }
  });
});

// // API to fetch unclaimed leads
app.get('/api/unclaimed-leads', (req, res) => {
  const query = 'SELECT * FROM public_enquiries WHERE claimed_by IS NULL';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching unclaimed leads:', err);
      res.status(500).json({ message: 'Internal server error during unclaimed-leads' });
    } else {
      res.status(200).json(results);
    }
  });
});

// // API to claim a lead
app.put('/api/claim-lead/:enquiryId', verifyToken, (req, res) => {
  const { enquiryId } = req.params;
  console.log("Enquiry id : ",enquiryId);
  const query = 'UPDATE public_enquiries SET claimed_by = ? WHERE id = ?';
  db.query(query, [req.userId, enquiryId], (err, result) => {
    if (err) {
      console.error('Error claiming lead:', err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Lead claimed successfully' });
    }
  });
});

// // API to fetch leads claimed by the logged-in user
app.get('/api/claimed-leads', verifyToken, (req, res) => {
  const query = 'SELECT * FROM public_enquiries WHERE claimed_by = ?';
  db.query(query, [req.userId], (err, results) => {
    if (err) {
      console.error('Error fetching claimed leads:', err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json(results);
    }
  });
});
// // ...

// // Middleware to handle errors
app.use((err, req, res, next) => {
    console.error('Error:', err);
  
    // Handle known errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
  
    // Handle other errors
    res.status(500).json({ message: 'Internal server error' });
  });
  
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});