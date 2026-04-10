/**
 * Web Server Module
 * Express server with full HTML dashboard for WhatsApp Bot
 */

const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const config = require('./config');
const logger = require('./lib/logger');
const { getStatus } = require('./lib/connection');
const { formatDuration, formatBytes } = require('./lib/utils');

// Initialize Express app
const app = express();
const PORT = config.web.port;
const HOST = config.web.host;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: config.security.allowedOrigins
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.security.rateLimitWindow,
    max: config.security.maxRequests,
    message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.redirect('/login');
    }
    
    jwt.verify(token, config.web.jwtSecret, (err, user) => {
        if (err) {
            return res.redirect('/login');
        }
        req.user = user;
        next();
    });
};

// Generate JWT token
const generateToken = (username) => {
    return jwt.sign({ username }, config.web.jwtSecret, { expiresIn: '24h' });
};

// ============ HTML ROUTES ============

// Login page
app.get('/login', (req, res) => {
    res.render('login', { 
        title: 'Login - ' + config.web.title,
        error: null 
    });
});

// Login POST
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === config.web.adminUsername && password === config.web.adminPassword) {
        const token = generateToken(username);
        res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.redirect('/');
    } else {
        res.render('login', { 
            title: 'Login - ' + config.web.title,
            error: 'Invalid credentials' 
        });
    }
});

// Logout
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Main dashboard
app.get('/', authenticateToken, (req, res) => {
    const status = getStatus();
    
    res.render('dashboard', {
        title: config.web.title,
        bot: config.bot,
        status: {
            ...status,
            uptime: formatDuration(status.uptime),
            messages: global.botState.messageCount,
            commands: global.botState.commandCount,
            users: global.botState.userCount.size,
            plugins: global.botState.plugins.size
        },
        user: req.user
    });
});

// QR Code page
app.get('/qr', authenticateToken, async (req, res) => {
    let qrDataUrl = null;
    
    if (global.botState.qrCode) {
        try {
            qrDataUrl = await QRCode.toDataURL(global.botState.qrCode);
        } catch (error) {
            logger.error('Error generating QR:', error);
        }
    }
    
    res.render('qr', {
        title: 'QR Code - ' + config.web.title,
        qrCode: qrDataUrl,
        isConnected: global.botState.isConnected,
        user: req.user
    });
});

// Messages page
app.get('/messages', authenticateToken, (req, res) => {
    res.render('messages', {
        title: 'Messages - ' + config.web.title,
        user: req.user
    });
});

// Plugins page
app.get('/plugins', authenticateToken, (req, res) => {
    const plugins = Array.from(global.botState.plugins.entries()).map(([name, plugin]) => ({
        name,
        version: plugin.version || '1.0.0',
        description: plugin.description || 'No description',
        author: plugin.author || 'Unknown',
        commands: plugin.commands ? plugin.commands.length : 0
    }));
    
    res.render('plugins', {
        title: 'Plugins - ' + config.web.title,
        plugins,
        user: req.user
    });
});

// Settings page
app.get('/settings', authenticateToken, (req, res) => {
    res.render('settings', {
        title: 'Settings - ' + config.web.title,
        config,
        user: req.user
    });
});

// Logs page
app.get('/logs', authenticateToken, (req, res) => {
    const logFiles = fs.readdirSync(config.logging.folder)
        .filter(f => f.endsWith('.log'))
        .sort()
        .reverse();
    
    res.render('logs', {
        title: 'Logs - ' + config.web.title,
        logFiles,
        user: req.user
    });
});

// Terminal page
app.get('/terminal', authenticateToken, (req, res) => {
    res.render('terminal', {
        title: 'Terminal - ' + config.web.title,
        user: req.user
    });
});

// ============ API ROUTES ============

// Get bot status
app.get('/api/status', (req, res) => {
    const status = getStatus();
    res.json({
        success: true,
        data: {
            ...status,
            uptime: formatDuration(status.uptime),
            messages: global.botState.messageCount,
            commands: global.botState.commandCount,
            users: global.botState.userCount.size,
            plugins: global.botState.plugins.size,
            memory: formatBytes(process.memoryUsage().heapUsed)
        }
    });
});

// Get QR code
app.get('/api/qr', async (req, res) => {
    if (!global.botState.qrCode) {
        return res.json({
            success: false,
            message: global.botState.isConnected ? 'Already connected' : 'QR code not available'
        });
    }
    
    try {
        const qrDataUrl = await QRCode.toDataURL(global.botState.qrCode);
        res.json({
            success: true,
            data: { qrCode: qrDataUrl }
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Get plugins
app.get('/api/plugins', (req, res) => {
    const plugins = Array.from(global.botState.plugins.entries()).map(([name, plugin]) => ({
        name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        commands: plugin.commands ? plugin.commands.map(c => c.name) : []
    }));
    
    res.json({ success: true, data: plugins });
});

// Reload plugins
app.post('/api/plugins/reload', authenticateToken, async (req, res) => {
    try {
        const { reloadAllPlugins } = require('./lib/pluginLoader');
        await reloadAllPlugins();
        res.json({ success: true, message: 'Plugins reloaded successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// Get logs
app.get('/api/logs/:filename', authenticateToken, (req, res) => {
    const filename = req.params.filename;
    const logPath = path.join(config.logging.folder, filename);
    
    if (!fs.existsSync(logPath)) {
        return res.json({ success: false, message: 'Log file not found' });
    }
    
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim()).slice(-100);
    
    res.json({ success: true, data: lines });
});

// Send message
app.post('/api/send', authenticateToken, async (req, res) => {
    const { number, message } = req.body;
    
    if (!number || !message) {
        return res.json({ success: false, message: 'Number and message are required' });
    }
    
    if (!global.sock || !global.botState.isConnected) {
        return res.json({ success: false, message: 'Bot not connected' });
    }
    
    try {
        const jid = number.includes('@') ? number : number + '@s.whatsapp.net';
        await global.sock.sendMessage(jid, { text: message });
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// Restart bot
app.post('/api/restart', authenticateToken, async (req, res) => {
    try {
        const { reconnect } = require('./lib/connection');
        await reconnect();
        res.json({ success: true, message: 'Bot restarted successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// Get groups
app.get('/api/groups', authenticateToken, async (req, res) => {
    if (!global.sock || !global.botState.isConnected) {
        return res.json({ success: false, message: 'Bot not connected' });
    }
    
    try {
        const groups = await global.sock.groupFetchAllParticipating();
        const groupList = Object.values(groups).map(g => ({
            id: g.id,
            name: g.subject,
            participants: g.participants.length,
            isAdmin: g.participants.some(p => p.id === global.sock.user.id && p.admin)
        }));
        
        res.json({ success: true, data: groupList });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// WebSocket upgrade handler (for real-time updates)
const WebSocket = require('ws');

function startWebServer() {
    const server = app.listen(PORT, HOST, () => {
        logger.success(`Web server running on http://${HOST}:${PORT}`);
    });
    
    // WebSocket server for real-time updates
    const wss = new WebSocket.Server({ server });
    
    wss.on('connection', (ws) => {
        logger.info('WebSocket client connected');
        
        // Send initial status
        ws.send(JSON.stringify({
            type: 'status',
            data: getStatus()
        }));
        
        ws.on('close', () => {
            logger.info('WebSocket client disconnected');
        });
    });
    
    // Broadcast updates to all connected clients
    global.broadcastUpdate = (type, data) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type, data }));
            }
        });
    };
    
    return server;
}

// Start server if this file is run directly
if (require.main === module) {
    startWebServer();
}

module.exports = { startWebServer, app };
