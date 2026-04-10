/**
 * Utility Functions Module
 * Common utility functions for the bot
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const logger = require('./logger');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/**
 * Format a message with mentions
 * @param {String} text - Message text
 * @param {Array} mentions - Array of JIDs to mention
 * @returns {Object} Formatted message
 */
function formatMessage(text, mentions = []) {
    return {
        text,
        mentions
    };
}

/**
 * Download media from a message
 * @param {Object} message - Message object
 * @param {String} type - Media type
 * @param {String} filename - Output filename
 * @returns {Promise<String>} Path to downloaded file
 */
async function downloadMedia(message, type, filename = null) {
    try {
        const stream = await downloadContentFromMessage(message, type);
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (!filename) {
            const ext = getExtensionFromMime(type);
            filename = `media_${Date.now()}.${ext}`;
        }

        const filePath = path.join(config.media.tempFolder, filename);
        await fs.writeFile(filePath, buffer);
        
        return filePath;
    } catch (error) {
        logger.error('Error downloading media:', error);
        throw error;
    }
}

/**
 * Get file extension from MIME type
 * @param {String} mimeType - MIME type
 * @returns {String} File extension
 */
function getExtensionFromMime(mimeType) {
    const mimeMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/avi': 'avi',
        'video/mov': 'mov',
        'audio/mpeg': 'mp3',
        'audio/ogg': 'ogg',
        'audio/wav': 'wav',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };
    
    return mimeMap[mimeType] || 'bin';
}

/**
 * Check if user is the bot owner
 * @param {String} userId - User JID
 * @returns {Boolean}
 */
function isOwner(userId) {
    const ownerNumber = config.bot.ownerNumber;
    if (!ownerNumber) return false;
    
    const cleanUserId = userId.split('@')[0];
    const cleanOwner = ownerNumber.toString().replace(/[^0-9]/g, '');
    
    return cleanUserId === cleanOwner;
}

/**
 * Check if user is an admin in a group
 * @param {Object} sock - WhatsApp socket
 * @param {String} groupId - Group JID
 * @param {String} userId - User JID
 * @returns {Promise<Boolean>}
 */
async function isAdmin(sock, groupId, userId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participants = groupMetadata.participants;
        
        const participant = participants.find(p => p.id === userId);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (error) {
        logger.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Format bytes to human readable
 * @param {Number} bytes - Bytes
 * @param {Number} decimals - Decimal places
 * @returns {String} Formatted string
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds
 * @param {Number} ms - Milliseconds
 * @returns {String} Formatted duration
 */
function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    
    return parts.join(' ') || '0s';
}

/**
 * Generate a random string
 * @param {Number} length - String length
 * @returns {String} Random string
 */
function randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Sleep for a specified time
 * @param {Number} ms - Milliseconds
 * @returns {Promise}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch JSON from URL
 * @param {String} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} JSON response
 */
async function fetchJson(url, options = {}) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...options.headers
            },
            timeout: options.timeout || 30000,
            ...options
        });
        
        return response.data;
    } catch (error) {
        logger.error('Error fetching JSON:', error.message);
        throw error;
    }
}

/**
 * Fetch buffer from URL
 * @param {String} url - URL to fetch
 * @returns {Promise<Buffer>} Buffer
 */
async function fetchBuffer(url) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });
        
        return Buffer.from(response.data);
    } catch (error) {
        logger.error('Error fetching buffer:', error.message);
        throw error;
    }
}

/**
 * Parse command arguments
 * @param {String} text - Command text
 * @returns {Object} Parsed arguments
 */
function parseArgs(text) {
    const args = text.split(/\s+/);
    const flags = {};
    const positional = [];
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            flags[key] = value || true;
        } else if (arg.startsWith('-')) {
            const key = arg.slice(1);
            const nextArg = args[i + 1];
            
            if (nextArg && !nextArg.startsWith('-')) {
                flags[key] = nextArg;
                i++;
            } else {
                flags[key] = true;
            }
        } else {
            positional.push(arg);
        }
    }
    
    return { flags, positional };
}

/**
 * Create a progress bar
 * @param {Number} current - Current progress
 * @param {Number} total - Total
 * @param {Number} length - Bar length
 * @returns {String} Progress bar string
 */
function createProgressBar(current, total, length = 20) {
    const percentage = Math.min(100, Math.max(0, (current / total) * 100));
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage.toFixed(1)}%`;
}

/**
 * Escape special regex characters
 * @param {String} string - String to escape
 * @returns {String} Escaped string
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get group metadata
 * @param {Object} sock - WhatsApp socket
 * @param {String} groupId - Group JID
 * @returns {Promise<Object>} Group metadata
 */
async function getGroupMetadata(sock, groupId) {
    try {
        return await sock.groupMetadata(groupId);
    } catch (error) {
        logger.error('Error getting group metadata:', error);
        return null;
    }
}

/**
 * Get user profile picture
 * @param {Object} sock - WhatsApp socket
 * @param {String} userId - User JID
 * @returns {Promise<String|null>} Profile picture URL
 */
async function getProfilePicture(sock, userId) {
    try {
        const result = await sock.profilePictureUrl(userId, 'image');
        return result;
    } catch (error) {
        return null;
    }
}

/**
 * Send a reaction to a message
 * @param {Object} sock - WhatsApp socket
 * @param {Object} messageKey - Message key
 * @param {String} emoji - Reaction emoji
 */
async function sendReaction(sock, messageKey, emoji) {
    try {
        await sock.sendMessage(messageKey.remoteJid, {
            react: {
                text: emoji,
                key: messageKey
            }
        });
    } catch (error) {
        logger.error('Error sending reaction:', error);
    }
}

module.exports = {
    formatMessage,
    downloadMedia,
    getExtensionFromMime,
    isOwner,
    isAdmin,
    formatBytes,
    formatDuration,
    randomString,
    sleep,
    fetchJson,
    fetchBuffer,
    parseArgs,
    createProgressBar,
    escapeRegex,
    getGroupMetadata,
    getProfilePicture,
    sendReaction
};
