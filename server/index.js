const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5178'],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Make io accessible in routes
app.set('socketio', io);

// Socket.IO Events
io.on('connection', (socket) => {
    // console.log('Socket connected:', socket.id);

    socket.on('join_chat', (room) => {
        socket.join(room);
        // console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('typing', ({ room, user }) => {
        // Broadcast to everyone in the room except sender
        socket.to(room).emit('display_typing', user);
    });

    socket.on('stop_typing', ({ room }) => {
        socket.to(room).emit('hide_typing');
    });

    socket.on('disconnect', () => {
        // console.log('Socket disconnected');
    });
});

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "http://localhost:5000", "http://localhost:5173", "https:"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(mongoSanitize());
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Increased significantly for dev/admin usage
    message: { message: 'Too many requests from this IP, please try again later.' } // return JSON
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Increased from 20 to 100 to prevent lockout during dev/testing
    message: { message: 'Too many login/register attempts, please try again later.' } // return JSON for consistent error handling
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const cookieParser = require('cookie-parser');
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' })); // Limit body size
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory with absolute path
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Serving uploads from:', path.join(__dirname, 'uploads'));

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const subscriberRoutes = require('./routes/subscribers');
const chatRoutes = require('./routes/chat');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/categories', require('./routes/categories'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Test endpoint to check uploads
app.get('/api/test-uploads', (req, res) => {
    const fs = require('fs');
    const uploadsPath = path.join(__dirname, 'uploads');
    fs.readdir(uploadsPath, (err, files) => {
        if (err) {
            return res.json({ error: err.message, path: uploadsPath });
        }
        res.json({
            uploadsPath,
            fileCount: files.length,
            sampleFiles: files.slice(0, 5),
            accessUrl: `http://localhost:${PORT}/uploads/${files[0]}`
        });
    });
});

// Database Connection and server start
const seedAdmin = require('./utils/seedAdmin'); // Import seeder

async function startServer() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sizzora');
        console.log('MongoDB Connected');
        
        // Run Admin Seeder on Startup
        await seedAdmin();

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
}

startServer();
