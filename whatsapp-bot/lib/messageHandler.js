/**
 * Message Handler Module
 * Processes incoming messages and executes commands
 */

const config = require('../config');
const logger = require('./logger');
const { getCommand, executeCommand } = require('./commandHandler');
const { formatMessage, downloadMedia, isAdmin, isOwner } = require('./utils');
const moment = require('moment');

// Anti-spam protection
const userMessageCache = new Map();
const SPAM_WINDOW = 5000; // 5 seconds
const SPAM_MAX_MESSAGES = 5;

/**
 * Main message handler
 * @param {Object} sock - WhatsApp socket
 * @param {Object} m - Message object
 */
async function messageHandler(sock, m) {
    try {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
            // Skip messages from self
            if (msg.key.fromMe) continue;

            // Extract message info
            const messageInfo = extractMessageInfo(msg);
            if (!messageInfo) continue;

            // Log message
            logger.message(messageInfo.sender, messageInfo.type, messageInfo.text);

            // Update stats
            global.botState.messageCount++;
            global.botState.userCount.add(messageInfo.sender);

            // Anti-spam check
            if (config.features.antiSpam && isSpam(messageInfo.sender)) {
                logger.warn(`Spam detected from ${messageInfo.sender}`);
                await sock.sendMessage(messageInfo.chat, { 
                    text: '⚠️ Please slow down! You are sending messages too quickly.' 
                });
                continue;
            }

            // Handle commands
            if (messageInfo.isCommand) {
                await handleCommand(sock, msg, messageInfo);
            } 
            // Handle auto-reply (if enabled)
            else if (config.features.autoReply) {
                await handleAutoReply(sock, msg, messageInfo);
            }
        }
    } catch (error) {
        logger.error('Error in message handler:', error);
    }
}

/**
 * Extract message information
 * @param {Object} msg - Raw message object
 * @returns {Object} Formatted message info
 */
function extractMessageInfo(msg) {
    try {
        const message = msg.message;
        if (!message) return null;

        // Get message type and content
        const messageType = Object.keys(message)[0];
        let text = '';
        let media = null;
        let caption = '';

        switch (messageType) {
            case 'conversation':
                text = message.conversation;
                break;
            case 'extendedTextMessage':
                text = message.extendedTextMessage.text;
                break;
            case 'imageMessage':
                text = message.imageMessage.caption || '';
                media = { type: 'image', data: message.imageMessage };
                caption = message.imageMessage.caption || '';
                break;
            case 'videoMessage':
                text = message.videoMessage.caption || '';
                media = { type: 'video', data: message.videoMessage };
                caption = message.videoMessage.caption || '';
                break;
            case 'audioMessage':
                text = '';
                media = { type: 'audio', data: message.audioMessage };
                break;
            case 'documentMessage':
                text = message.documentMessage.caption || '';
                media = { type: 'document', data: message.documentMessage };
                break;
            case 'stickerMessage':
                text = '';
                media = { type: 'sticker', data: message.stickerMessage };
                break;
            case 'locationMessage':
                text = '';
                media = { 
                    type: 'location', 
                    data: {
                        latitude: message.locationMessage.degreesLatitude,
                        longitude: message.locationMessage.degreesLongitude
                    }
                };
                break;
            case 'contactMessage':
                text = '';
                media = { type: 'contact', data: message.contactMessage };
                break;
            case 'buttonsResponseMessage':
                text = message.buttonsResponseMessage.selectedButtonId;
                break;
            case 'listResponseMessage':
                text = message.listResponseMessage.singleSelectReply.selectedRowId;
                break;
            default:
                text = '';
        }

        // Get sender info
        const sender = msg.key.participant || msg.key.remoteJid;
        const chat = msg.key.remoteJid;
        const isGroup = chat.endsWith('@g.us');
        const fromMe = msg.key.fromMe;

        // Check if it's a command
        const prefix = config.bot.prefix;
        const isCommand = text.startsWith(prefix);
        const commandBody = isCommand ? text.slice(prefix.length).trim() : '';
        const args = commandBody.split(/\s+/);
        const command = args.shift()?.toLowerCase() || '';

        // Get quoted message
        const quoted = message.extendedTextMessage?.contextInfo?.quotedMessage || null;
        const quotedMsg = message.extendedTextMessage?.contextInfo || null;

        return {
            msg,
            message,
            messageType,
            text,
            media,
            caption,
            sender,
            chat,
            isGroup,
            fromMe,
            isCommand,
            prefix,
            command,
            args,
            fullArgs: args.join(' '),
            quoted,
            quotedMsg,
            timestamp: msg.messageTimestamp * 1000,
            pushName: msg.pushName || 'Unknown'
        };
    } catch (error) {
        logger.error('Error extracting message info:', error);
        return null;
    }
}

/**
 * Handle bot commands
 * @param {Object} sock - WhatsApp socket
 * @param {Object} msg - Raw message
 * @param {Object} messageInfo - Formatted message info
 */
async function handleCommand(sock, msg, messageInfo) {
    try {
        const { command, args, fullArgs, sender, chat } = messageInfo;

        // Log command
        logger.command(sender, command, fullArgs);
        global.botState.commandCount++;

        // Show typing indicator
        if (config.whatsapp.autoTyping) {
            await sock.sendPresenceUpdate('composing', chat);
        }

        // Get command handler
        const cmd = getCommand(command);
        
        if (cmd) {
            // Check permissions
            if (cmd.ownerOnly && !isOwner(sender)) {
                await sock.sendMessage(chat, { text: '❌ This command is only for the bot owner.' });
                return;
            }

            if (cmd.adminOnly && !await isAdmin(sock, chat, sender)) {
                await sock.sendMessage(chat, { text: '❌ This command is only for admins.' });
                return;
            }

            if (cmd.groupOnly && !messageInfo.isGroup) {
                await sock.sendMessage(chat, { text: '❌ This command can only be used in groups.' });
                return;
            }

            if (cmd.privateOnly && messageInfo.isGroup) {
                await sock.sendMessage(chat, { text: '❌ This command can only be used in private chat.' });
                return;
            }

            // Execute command
            try {
                await cmd.execute(sock, messageInfo, { args, fullArgs });
            } catch (error) {
                logger.error(`Error executing command ${command}:`, error);
                await sock.sendMessage(chat, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        } else {
            // Unknown command
            await sock.sendMessage(chat, { 
                text: `❓ Unknown command: ${command}\nType ${config.bot.prefix}help to see available commands.` 
            });
        }

        // Stop typing indicator
        await sock.sendPresenceUpdate('paused', chat);

    } catch (error) {
        logger.error('Error handling command:', error);
    }
}

/**
 * Handle auto-reply for non-command messages
 * @param {Object} sock - WhatsApp socket
 * @param {Object} msg - Raw message
 * @param {Object} messageInfo - Formatted message info
 */
async function handleAutoReply(sock, msg, messageInfo) {
    try {
        const { text, chat } = messageInfo;
        const lowerText = text.toLowerCase();

        // Simple auto-reply patterns
        const autoReplies = {
            'hello': '👋 Hello! How can I help you today?',
            'hi': '👋 Hi there! What can I do for you?',
            'hey': '👋 Hey! Need any assistance?',
            'help': `Type ${config.bot.prefix}help to see my commands!`,
            'bot': "🤖 Yes, I'm here! How can I assist you?",
            'thanks': "You're welcome! 😊",
            'thank you': "You're welcome! 😊",
        };

        for (const [pattern, reply] of Object.entries(autoReplies)) {
            if (lowerText.includes(pattern)) {
                await sock.sendMessage(chat, { text: reply });
                break;
            }
        }
    } catch (error) {
        logger.error('Error in auto-reply:', error);
    }
}

/**
 * Check if user is spamming
 * @param {String} userId - User ID
 * @returns {Boolean} True if spamming
 */
function isSpam(userId) {
    const now = Date.now();
    const userData = userMessageCache.get(userId) || { count: 0, firstMessage: now };

    if (now - userData.firstMessage > SPAM_WINDOW) {
        // Reset counter
        userData.count = 1;
        userData.firstMessage = now;
    } else {
        userData.count++;
    }

    userMessageCache.set(userId, userData);

    return userData.count > SPAM_MAX_MESSAGES;
}

module.exports = {
    messageHandler,
    extractMessageInfo
};
