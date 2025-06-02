const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const { errorMiddleware } = require("./utils/ExpressError.js");
const cookieParser = require("cookie-parser");

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const jobRoutes = require('./routes/jobRoutes');
// const applicants = require('./routes/application');

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cookieParser());
app.use(express.json());
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());
app.use(cors({
  origin: 'http://localhost:8081', // Allow requests from your React Native app
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // can be comment Serve uploaded files statically

// MongoDB connection using local instance
// const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Atlas connected'))
  .catch((err) => console.log('MongoDB connection error:', err));
;

// Comment out MongoDB Atlas connection for later use
// mongoose.connect('mongodb+srv://balmukundoptico:lets12help@job-connector.exb7v.mongodb.net', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log('MongoDB Atlas connected'))
//   .catch((err) => console.log('MongoDB Atlas connection error:', err));

// Root route
app.get('/', (req, res) => {
  res.send('Job Connector Backend is running');
});

// Import and mount routes


app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
// app.use('/api/application', applicants);


// Global error handler middleware
app.use((err, req, res, next) => {
    // Log error for debugging

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});


app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// working code dont chnage