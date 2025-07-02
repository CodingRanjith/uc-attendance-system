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
const LeaveRequest = require('./models/LeaveRequest');
const Task = require('./models/Task');

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


app.get('/api/report/daily-summary', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const selectedDate = new Date(date);
    const start = new Date(selectedDate.setHours(0, 0, 0, 0));
    const end = new Date(selectedDate.setHours(23, 59, 59, 999));

    const users = await User.find({});
    const attendanceRecords = await Attendance.find({
      timestamp: { $gte: start, $lte: end }
    }).populate('user', 'name');

    const leaveRecords = await LeaveRequest.find({
      fromDate: { $lte: end },
      toDate: { $gte: start }
    }).populate('user', 'name');

    const report = {
      date,
      present: [],
      absent: [],
      checkInOut: [],
      workTypes: [],
      leaveStatus: [],
      workTime: []
    };

    users.forEach(user => {
      const userAttendance = attendanceRecords.filter(a => a.user._id.equals(user._id));
      const leave = leaveRecords.find(l => l.user._id.equals(user._id));

      if (userAttendance.length > 0) {
        // Sort timestamps for proper check-in/out analysis
        const sorted = userAttendance.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const checkIn = sorted[0]?.timestamp;
        const checkOut = sorted[sorted.length - 1]?.timestamp;

        const diffMinutes = Math.round((new Date(checkOut) - new Date(checkIn)) / 60000);

        report.present.push(user.name);
        report.checkInOut.push({
          name: user.name,
          checkIn: new Date(checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          checkOut: new Date(checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        const location = sorted[0]?.location || 'Office';
        report.workTypes.push({ name: user.name, type: location });

        report.workTime.push({ name: user.name, minutes: diffMinutes });
      } else {
        report.absent.push(user.name);
      }

      report.leaveStatus.push({
        name: user.name,
        status: leave ? 'Leave Applied' : 'Not Applied'
      });
    });

    res.json(report);
  } catch (err) {
    console.error('Daily Summary Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



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


// -------------------------------------------
// 📝 Daily Task APIs
// -------------------------------------------

// ✅ GET tasks by date (e.g., /api/tasks/2025-06-11)
app.get('/api/tasks/:date', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      date: req.params.date,
    }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Fetch task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ POST new task
app.post('/api/tasks', authMiddleware, async (req, res) => {
  const { task, date } = req.body;
  if (!task || !date) return res.status(400).json({ error: 'Task and date are required' });

  try {
    const newTask = new Task({ user: req.user._id, task, date });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ PATCH update task status
app.patch('/api/tasks/:id', authMiddleware, async (req, res) => {
  const { done } = req.body;
  try {
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { done },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ DELETE /api/tasks/:id - Delete a task
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  const { task, date } = req.body;
  if (!task || !date) return res.status(400).json({ error: 'Task and date are required' });

  try {
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { task, date },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (error) {
    console.error('Update full task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

 

app.get('/api/tasks/month/:year/:month', authMiddleware, async (req, res) => {
  try {
    const { year, month } = req.params;
    const start = new Date(`${year}-${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const tasks = await Task.find({
      user: req.user._id,
      date: { $gte: start.toISOString().split('T')[0], $lt: end.toISOString().split('T')[0] },
    });

    res.json(tasks);
  } catch (err) {
    console.error('Fetch monthly tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Updated summary endpoint to support filtering by date
app.get('/api/tasks/summary', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { user: req.user._id };

    if (date) {
      filter.date = date; // e.g., 2025-06-11
    }

    const total = await Task.countDocuments(filter);
    const done = await Task.countDocuments({ ...filter, done: true });
    const pending = total - done;

    res.json({ total, done, pending });
  } catch (error) {
    console.error('Summary error:', error);
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


app.post('/api/leaves/apply', authMiddleware, async (req, res) => {
  try {
    const { fromDate, toDate, reason, leaveType } = req.body;
    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const leave = new LeaveRequest({
      user: req.user._id,
      fromDate,
      toDate,
      reason,
      leaveType
    });

    await leave.save();
    res.status(201).json({ message: 'Leave request submitted successfully', leave });
  } catch (err) {
    console.error('Leave apply error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/leaves/all', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const requests = await LeaveRequest.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    res.json(requests);
  } catch (err) {
    console.error('Fetch leave requests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.patch('/api/leaves/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!updated) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json({
      message: `Leave ${status.toLowerCase()}`,
      request: updated
    });
  } catch (err) {
    console.error('Update leave error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/leaves/me', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const [leaves, total] = await Promise.all([
      LeaveRequest.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LeaveRequest.countDocuments({ user: req.user._id }),
    ]);

    res.json({ leaves, total });
  } catch (err) {
    console.error('Fetch my leaves error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /api/leaves/:id - Admin can delete a leave request
app.delete('/api/leaves/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const leave = await LeaveRequest.findByIdAndDelete(req.params.id);

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json({ message: 'Leave request deleted successfully' });
  } catch (err) {
    console.error('Delete leave error:', err);
    res.status(500).json({ error: 'Internal server error' });
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
  try {
    const { location, type } = req.body;

    if (!location || typeof location !== 'string') {
      return res.status(400).json({ error: 'Location is required as "lat,lon"' });
    }

    const [latStr, lonStr] = location.split(',');
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const userLocation = { latitude: lat, longitude: lon };
    let isInOffice = false;
    let matchedOfficeName = 'Outside Office';

    for (const office of officeLocation) {
      const officeCoords = {
        latitude: office.latitude,
        longitude: office.longitude
      };
      const distance = haversine(userLocation, officeCoords);
      if (distance <= office.radiusMeters) {
        isInOffice = true;
        matchedOfficeName = office.name;
        break;
      }
    }

    const attendance = new Attendance({
      user: req.user._id,
      type,
      location,
      image: req.file?.filename || null,
      isInOffice,
      officeName: matchedOfficeName,
      timestamp: new Date()
    });

    await attendance.save();

    res.json({
      message: 'Attendance marked successfully',
      isInOffice,
      office: matchedOfficeName
    });

  } catch (error) {
    console.error('Attendance Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
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