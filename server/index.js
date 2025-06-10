// File:index.js (Node.js/Express Backend)
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const haversine = require('haversine-distance');
const officeLocation = require('./config/officeLocation');
const PendingUser = require('./models/PendingUser');
const Holiday = require('./models/Holiday');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Models
const User = require('./models/User');
const Schedule = require('./models/Schedule');
const Attendance = require('./models/Attendance');

// Middleware
const authMiddleware = require('./middleware/auth');
const roleMiddleware = require('./middleware/role');

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});


const upload = multer({ storage });


app.use(cors({ origin: '*' }));




// Routes


app.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, position, company, schedule } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !position || !company) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if already exists in either collection
    const existingUser = await User.findOne({ email });
    const existingPending = await PendingUser.findOne({ email });


    if (existingUser || existingPending) {
      return res.status(400).json({ error: 'Email already in use or pending approval' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const pending = new PendingUser({
      name,
      email,
      password: hashedPassword,
      phone,
      position,
      company,
      schedule
    });

    await pending.save();

    res.status(201).json({
      message: 'Registration submitted and pending admin approval'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/admin/approve/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const pending = await PendingUser.findById(req.params.id);
    if (!pending) return res.status(404).json({ error: 'Pending user not found' });

    // Move to User collection
    const user = new User({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      phone: pending.phone,
      position: pending.position,
      company: pending.company,
      role: 'employee'
    });
    await user.save();

    // Create schedule if exists
    if (pending.schedule) {
      const userSchedule = new Schedule({
        user: user._id,
        weeklySchedule: pending.schedule
      });
      await userSchedule.save();
    }

    // Delete from pending
    await PendingUser.findByIdAndDelete(pending._id);

    res.json({ message: 'User approved and created successfully.' });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/admin/pending-users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const pendingUsers = await PendingUser.find();
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});


app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        name: user.name 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      userId: user._id,
      role: user.role,
      name: user.name
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/attendance', authMiddleware, upload.single('image'), async (req, res) => {
  const userLocation = {
    lat: parseFloat(req.body.location.split(',')[0]),
    lon: parseFloat(req.body.location.split(',')[1])
  };
  
  const officeCoords = {
    lat: officeLocation.latitude,
    lon: officeLocation.longitude
  };
  
  const distance = haversine(userLocation, officeCoords); // in meters
  const isInOffice = distance <= officeLocation.radiusMeters;
  
  const attendance = new Attendance({
    user: req.user._id,
    type: req.body.type,
    location: req.body.location,
    image: req.file.filename,
    isInOffice,
    timestamp: new Date()
  });
  await attendance.save();
  res.json({ message: 'Attendance marked' });
});

app.get('/attendance/all', authMiddleware, roleMiddleware('admin', 'user'), async (req, res) => {
  try {
    const records = await Attendance.find().populate('user', 'name email');
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//checkin or check out
app.get('/attendance/last', authMiddleware, async (req, res) => {
  try {
    const lastRecord = await Attendance.findOne({ user: req.user._id }).sort({ timestamp: -1 });
    if (!lastRecord) return res.status(200).json({ type: null });
    res.json({ type: lastRecord.type });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch last attendance' });
  }
});

// // Get all users (admin only)
// app.get('/users', async (req, res) => {
//   try {
//     const users = await User.find({}, 'name email role phone position company');
//     res.json(users);
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.get('/users', authMiddleware, async (req, res) => {
//   const users = await User.find({}, 'name email role phone position company');
//   res.json(users);
// });

// If you're using roleMiddleware somewhere else on `/users`, REMOVE IT:
app.get('/users', authMiddleware, async (req, res) => {
  const users = await User.find({}, 'name email role phone position company');
  res.json(users);
});

// GET /attendance/user/:userId/summary/:year/:month
app.get('/attendance/user/:userId/summary/:year/:month', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const { userId, year, month } = req.params;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  try {
    const allDays = new Set();
    const attendanceRecords = await Attendance.find({
      user: userId,
      timestamp: { $gte: startDate, $lte: endDate },
      type: 'check-in'
    });

    attendanceRecords.forEach(record => {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      allDays.add(dateKey);
    });

    const presentCount = allDays.size;
    const totalDays = endDate.getDate();
    const absentCount = totalDays - presentCount;

    res.json({ present: presentCount, absent: absentCount });
  } catch (error) {
    console.error('Attendance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});


// GET /attendance/user/:userId/last
app.get('/attendance/user/:userId/last', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const lastRecord = await Attendance.findOne({ user: req.params.userId })
      .sort({ timestamp: -1 })
      .select('type timestamp');

    if (!lastRecord) {
      return res.json({ type: 'None', timestamp: null });
    }

    res.json(lastRecord);
  } catch (error) {
    console.error('Last attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch last record' });
  }
});


// GET all holidays
app.get('/api/holidays', authMiddleware, async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// POST new holiday (admin only)
app.post('/api/holidays', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { date, name } = req.body;

    if (!date || !name) {
      return res.status(400).json({ error: 'Date and name are required' });
    }

    const existing = await Holiday.findOne({ date: new Date(date) });
    if (existing) {
      return res.status(409).json({ error: 'Holiday already exists for this date' });
    }

    const holiday = new Holiday({ date, name });
    await holiday.save();
    res.status(201).json(holiday);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add holiday' });
  }
});


// Get single user
app.get('/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Exclude password for safety

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      position: user.position,
      company: user.company,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Get all attendance records for a user
app.get('/attendance/user/:userId', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.params.userId }).populate('user', 'name email');
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});   

// Get all attendance records for the logged-in user
app.get('/attendance/me', authMiddleware, async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.user._id }).populate('user', 'name email');
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Get all attendance records for a specific date
app.get('/attendance/date/:date', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const records = await Attendance.find({
      timestamp: {
        $gte: new Date(date.setHours(0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59))
      }
    }).populate('user', 'name email');
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Get user's schedule
app.get('/schedules/user/:userId', authMiddleware, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ user: req.params.userId });
    res.json(schedule || {});
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this to your backend routes
app.get('/users/me', authMiddleware, async (req, res) => {
  try {
    // Get user ID from the authenticated request (added by authMiddleware)
    const userId = req.user._id;
    
    // Find user by ID and exclude the password field
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
app.put('/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, position, company, schedule } = req.body;
    const updateData = { name, email, phone, position, company };

    // Only update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update or create schedule
    if (schedule) {
      await Schedule.findOneAndUpdate(
        { user: req.params.id },
        { weeklySchedule: schedule },
        { upsert: true, new: true }
      );
    }

    res.json({ 
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        position: user.position,
        company: user.company,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/admin/summary', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.find({
      timestamp: { $gte: todayStart, $lte: todayEnd },
      type: 'check-in'
    }).distinct('user'); // unique check-ins

    const presentToday = todayAttendance.length;
    const absentToday = totalEmployees - presentToday;

    res.json({
      totalEmployees,
      presentToday,
      absentToday
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/admin/recent-attendance', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const logs = await Attendance.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user', 'name email');

    const formatted = logs.map(log => ({
      employeeName: log.user.name,
      type: log.type,
      timestamp: log.timestamp
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT: Update salary for a user (admin only)
app.put('/users/:id/salary', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { salary } = req.body;

    if (!salary || isNaN(salary)) {
      return res.status(400).json({ error: 'Invalid salary value' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { salary },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Salary updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating salary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



async function setupAdmin() {
  const existing = await User.findOne({ email: 'admin@urbancode.in' });
  if (!existing) {
    const hashed = await bcrypt.hash('12345678', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@urbancode.in',
      password: hashed,
      role: 'admin',
      phone: '6374129515',       // ← required
      position: 'Admin',         // ← required
      company: 'Urbancode'       // ← required
    });
    console.log('Admin created: admin@urbancode.in / 12345678');
  }
}

setupAdmin();

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    app.listen(5000, () => console.log('Server running on port 5000'));
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

startServer();
