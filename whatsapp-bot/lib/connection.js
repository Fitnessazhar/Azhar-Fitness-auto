/**
 * WhatsApp Connection Module
 * Handles connection to WhatsApp using Baileys library
 */

const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const config = require('../config');
const logger = require('./logger');
const path = require('path');
const fs = require('fs-extra');

// Ensure auth folder exists
const authFolder = path.resolve(config.whatsapp.authFolder);
fs.ensureDirSync(authFolder);

/**
 * Connect to WhatsApp
 * @returns {Promise<Object>} WhatsApp socket connection
 */
async function connectToWhatsApp() {
    try {
        // Fetch latest Baileys version
        const { version, isLatest } = await fetchLatestBaileysVersion();
        logger.info(`Using Baileys version: ${version.join('.')} (Latest: ${isLatest})`);

        // Load authentication state
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);

        // Create WhatsApp socket
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: config.advanced.printQRInTerminal,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
            },
            browser: Browsers.appropriate(config.bot.name),
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            keepAliveIntervalMs: config.advanced.keepAliveIntervalMs,
            connectTimeoutMs: config.advanced.connectTimeoutMs,
            defaultQueryTimeoutMs: 20000,
            retryRequestDelayMs: 250,
            maxMsgRetryCount: 5,
            msgRetryCounterMap: {},
            shouldIgnoreJid: (jid) => {
                // Ignore status broadcasts and newsletters
                return jid?.endsWith('@broadcast') || jid?.endsWith('@newsletter');
            },
            getMessage: async (key) => {
                // Return message for retry purposes
                return {
                    conversation: 'Hello'
                };
            }
        });

        // Handle credentials update
        sock.ev.on('creds.update', saveCreds);

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info('QR Code generated - Please scan with WhatsApp');
                if (config.advanced.printQRInTerminal) {
                    qrcode.generate(qr, { small: true });
                }
                global.botState.qrCode = qr;
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut && 
                                       statusCode !== DisconnectReason.badSession;
                
                logger.error(`Connection closed. Status code: ${statusCode}`);
                global.botState.isConnected = false;
                global.botState.isReady = false;

                if (shouldReconnect) {
                    logger.info('Attempting to reconnect...');
                    setTimeout(connectToWhatsApp, 5000);
                } else {
                    logger.error('Connection closed permanently. Please re-authenticate.');
                    // Clear auth folder for fresh start
                    if (statusCode === DisconnectReason.loggedOut) {
                        fs.removeSync(authFolder);
                        logger.info('Auth folder cleared. Please restart and scan QR code again.');
                    }
                }
            } else if (connection === 'connecting') {
                logger.info('Connecting to WhatsApp...');
            } else if (connection === 'open') {
                logger.success('WhatsApp connection established!');
                global.botState.isConnected = true;
                global.botState.isReady = true;
                global.botState.qrCode = null;
                
                // Get bot info
                const botInfo = sock.user;
                logger.info(`Bot Name: ${botInfo.name}`);
                logger.info(`Bot Number: ${botInfo.id.split(':')[0]}`);
            }
        });

        // Handle messages
        sock.ev.on('messages.upsert', async (m) => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe && config.whatsapp.autoRead) {
                        await sock.readMessages([msg.key]);
                    }
                }
            }
        });

        // Handle presence updates
        sock.ev.on('presence.update', (update) => {
            logger.debug('Presence update:', update);
        });

        // Handle groups update
        sock.ev.on('groups.update', (update) => {
            logger.debug('Groups update:', update);
        });

        // Handle group participants update
        sock.ev.on('group-participants.update', async (update) => {
            logger.debug('Group participants update:', update);
            
            const { id, participants, action } = update;
            
            if (action === 'add' && config.features.welcomeMessage) {
                for (const participant of participants) {
                    const welcomeMsg = `👋 Welcome @${participant.split('@')[0]} to the group!`;
                    await sock.sendMessage(id, { 
                        text: welcomeMsg,
                        mentions: [participant]
                    });
                }
            }
            
            if (action === 'remove' && config.features.goodbyeMessage) {
                for (const participant of participants) {
                    const goodbyeMsg = `👋 Goodbye @${participant.split('@')[0]}!`;
                    await sock.sendMessage(id, { 
                        text: goodbyeMsg,
                        mentions: [participant]
                    });
                }
            }
        });

        return sock;

    } catch (error) {
        logger.error('Error connecting to WhatsApp:', error);
        throw error;
    }
}

/**
 * Reconnect to WhatsApp
 */
async function reconnect() {
    logger.info('Reconnecting to WhatsApp...');
    try {
        if (global.sock) {
            await global.sock.end();
        }
        return await connectToWhatsApp();
    } catch (error) {
        logger.error('Reconnection failed:', error);
        throw error;
    }
}

/**
 * Disconnect from WhatsApp
 */
async function disconnect() {
    logger.info('Disconnecting from WhatsApp...');
    try {
        if (global.sock) {
            await global.sock.logout();
            await global.sock.end();
        }
        global.botState.isConnected = false;
        global.botState.isReady = false;
        logger.success('Disconnected from WhatsApp');
    } catch (error) {
        logger.error('Error disconnecting:', error);
        throw error;
    }
}

/**
 * Get connection status
 */
function getStatus() {
    return {
        connected: global.botState.isConnected,
        ready: global.botState.isReady,
        user: global.sock?.user || null,
        qrCode: global.botState.qrCode || null,
        uptime: global.botState.startTime ? Date.now() - global.botState.startTime : 0
    };
}

module.exports = {
    connectToWhatsApp,
    reconnect,
    disconnect,
    getStatus
};
