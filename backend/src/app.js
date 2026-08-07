const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const dataRoutes = require('./routes/data.routes');
const reminderRoutes = require('./routes/reminder.routes');
const channelRoutes = require('./routes/channel.routes');
const ticketRoutes = require('./routes/ticket.routes');
const adminRoutes = require('./routes/admin.routes');
const automationRoutes = require('./routes/automation.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/reminder', reminderRoutes);
app.use('/api/channel', channelRoutes);
app.use('/api/ticket', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/automation', automationRoutes);

app.use(errorHandler);

module.exports = app;