/**
 * Service Manager Web - Entry Point
 * --------------------------------------------------------------------------
 * Main application server configuration.
 * Handles middleware, routing, session management, and global error handling.
 */

require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

// --- ROUTE IMPORTS ---
const authRoutes = require('./routes/auth');
const osRoutes = require('./routes/os');
const dashboardRoutes = require('./routes/dashboard');
const healthRoutes = require('./routes/health'); // DevOps/Monitoring route

// --- MIDDLEWARE IMPORTS ---
const authMiddleware = require('./middleware/auth'); 

const app = express();
const PORT = process.env.PORT || 3000;

// =======================================================
// 1. APP CONFIGURATION & MIDDLEWARE
// =======================================================

// View Engine Setup (EJS + Layouts)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); // Default layout file (views/layout.ejs)

// Static Assets (CSS, Images, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Request Parsing
// High limit (50mb) is required to handle Base64 image uploads from the frontend
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Session Management
app.use(session({
    name: 'sid_service_manager',
    secret: process.env.SESSION_SECRET || 'dev_secret_key_change_in_prod',
    resave: false,
    saveUninitialized: false, 
    cookie: { 
        httpOnly: true, // Security: Prevents JS access to cookies
        secure: process.env.NODE_ENV === 'production', // Secure in Prod
        maxAge: 24 * 60 * 60 * 1000 // 24 Hours
    }
}));

// =======================================================
// 2. ROUTING
// =======================================================

// A. Public Routes
app.use('/health', healthRoutes); // System status (No auth required)
app.use('/auth', authRoutes);     // Login/Logout

// B. Security Barrier (Middleware)
// All routes defined below this line require authentication
app.use(authMiddleware); 

// C. Protected Routes
app.use('/dashboard', dashboardRoutes);
app.use('/os', osRoutes);

// Root Redirect
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// =======================================================
// 3. GLOBAL ERROR HANDLING
// =======================================================

// 404 - Not Found Handler
app.use((req, res, next) => {
    console.warn(`[404] Route not found: ${req.originalUrl}`);
    res.status(404).render('layout', { 
        body: '<div style="text-align:center; padding:50px;"><h1>404</h1><p>Page not found.</p><a href="/dashboard">Go Back</a></div>' 
    });
});

// 500 - Internal Server Error Handler
app.use((err, req, res, next) => {
    console.error('[500] Internal Server Error:', err.stack);
    res.status(500).send('Internal Server Error. Please contact support.');
});

// =======================================================
// 4. SERVER START
// =======================================================
app.listen(PORT, () => {
    console.log(`\n🚀 Service Manager is running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'Development'}\n`);
});