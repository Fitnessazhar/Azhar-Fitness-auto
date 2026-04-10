/**
 * WhatsApp Bot - Main Entry Point
 * Advanced WhatsApp Bot with Full HTML Support
 * 
 * @author WhatsApp Bot Developer
 * @version 1.0.0
 */

const { connectToWhatsApp } = require('./lib/connection');
const { loadPlugins } = require('./lib/pluginLoader');
const { messageHandler } = require('./lib/messageHandler');
const config = require('./config');
const logger = require('./lib/logger');
const path = require('path');
const fs = require('fs-extra');

// Ensure required directories exist
const requiredDirs = ['data', 'media', 'temp', 'logs'];
requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`Created directory: ${dir}`);
    }
});

// Global bot state
global.botState = {
    isConnected: false,
    isReady: false,
    startTime: Date.now(),
    messageCount: 0,
    commandCount: 0,
    userCount: new Set(),
    plugins: new Map(),
    config: config
};

// Initialize bot
async function initializeBot() {
    try {
        logger.banner('WhatsApp Bot Starting...');
        logger.info('Initializing WhatsApp Bot...');

        // Load plugins
        logger.info('Loading plugins...');
        const plugins = await loadPlugins();
        global.botState.plugins = plugins;
        logger.success(`Loaded ${plugins.size} plugins`);

        // Connect to WhatsApp
        logger.info('Connecting to WhatsApp...');
        const sock = await connectToWhatsApp();

        // Set up message handler
        sock.ev.on('messages.upsert', async (m) => {
            await messageHandler(sock, m);
        });

        // Handle connection updates
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                logger.info('QR Code received - Scan with WhatsApp');
                global.botState.qrCode = qr;
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                logger.error('Connection closed', lastDisconnect?.error);
                global.botState.isConnected = false;
                global.botState.isReady = false;
                
                if (shouldReconnect) {
                    logger.info('Reconnecting...');
                    setTimeout(initializeBot, 5000);
                }
            } else if (connection === 'open') {
                logger.success('WhatsApp Connected Successfully!');
                global.botState.isConnected = true;
                global.botState.isReady = true;
                global.botState.qrCode = null;
            }
        });

        // Handle credentials update
        sock.ev.on('creds.update', (creds) => {
            logger.debug('Credentials updated');
        });

        global.sock = sock;
        
        logger.success('Bot initialized successfully!');
        
    } catch (error) {
        logger.error('Failed to initialize bot:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('\nShutting down gracefully...');
    if (global.sock) {
        await global.sock.end();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('\nShutting down gracefully...');
    if (global.sock) {
        await global.sock.end();
    }
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bot
initializeBot();
