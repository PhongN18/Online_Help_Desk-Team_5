// src/app.js
const express = require('express');
require('dotenv').config()
const connectDB = require('./config/db'); // File config/db.js để kết nối MongoDB
const cors = require('cors'); // Import cors
const { initializeMaxIds } = require('./utils/initMaxIds')
const { seedData } = require('./utils/seedData')

// Import các route
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const PORT = 3000;

// Kết nối MongoDB
connectDB();

// Enable CORS middleware to allow cross-origin requests
app.use(cors()); // This will allow all origins by default

// Middleware để parse JSON
app.use(express.json());

// Route gốc ("/") để tránh lỗi "Cannot GET /"
app.get('/', (req, res) => {
  res.send('Welcome to OHD API!');
});

// Đăng ký các route
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/requests', requestRoutes);
app.use('/facilities', facilityRoutes);
app.use('/messages', messageRoutes);

// Lắng nghe trên cổng PORT
app.listen(PORT, () => {
  seedData()
  initializeMaxIds(); // Initialize max IDs when the server starts
  console.log(`Server is running at http://localhost:${PORT}`);
});
