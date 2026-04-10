/**
 * Command Handler Module
 * Manages bot commands and their execution
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');
const config = require('../config');

// Command registry
const commands = new Map();
const aliases = new Map();
const categories = new Map();

/**
 * Load all commands from the plugins folder
 */
function loadCommands() {
    try {
        const pluginsFolder = path.resolve(config.plugins.folder);
        
        if (!fs.existsSync(pluginsFolder)) {
            logger.warn('Plugins folder not found');
            return;
        }

        const files = fs.readdirSync(pluginsFolder);
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                try {
                    const filePath = path.join(pluginsFolder, file);
                    delete require.cache[require.resolve(filePath)];
                    const plugin = require(filePath);
                    
                    if (plugin.commands) {
                        for (const cmd of plugin.commands) {
                            registerCommand(cmd);
                        }
                    }
                    
                    logger.debug(`Loaded plugin: ${file}`);
                } catch (error) {
                    logger.error(`Error loading plugin ${file}:`, error);
                }
            }
        }
        
        logger.success(`Loaded ${commands.size} commands`);
    } catch (error) {
        logger.error('Error loading commands:', error);
    }
}

/**
 * Register a command
 * @param {Object} cmd - Command object
 */
function registerCommand(cmd) {
    if (!cmd.name || !cmd.execute) {
        logger.warn('Invalid command format:', cmd);
        return;
    }

    // Register main command
    commands.set(cmd.name.toLowerCase(), cmd);

    // Register aliases
    if (cmd.aliases) {
        for (const alias of cmd.aliases) {
            aliases.set(alias.toLowerCase(), cmd.name.toLowerCase());
        }
    }

    // Register category
    const category = cmd.category || 'misc';
    if (!categories.has(category)) {
        categories.set(category, []);
    }
    categories.get(category).push(cmd);

    logger.debug(`Registered command: ${cmd.name}`);
}

/**
 * Get a command by name or alias
 * @param {String} name - Command name
 * @returns {Object|null} Command object
 */
function getCommand(name) {
    const lowerName = name.toLowerCase();
    
    // Check main commands
    if (commands.has(lowerName)) {
        return commands.get(lowerName);
    }
    
    // Check aliases
    if (aliases.has(lowerName)) {
        const mainName = aliases.get(lowerName);
        return commands.get(mainName);
    }
    
    return null;
}

/**
 * Execute a command
 * @param {String} name - Command name
 * @param {Object} sock - WhatsApp socket
 * @param {Object} messageInfo - Message info
 * @param {Object} options - Command options
 */
async function executeCommand(name, sock, messageInfo, options) {
    const cmd = getCommand(name);
    
    if (!cmd) {
        throw new Error(`Command not found: ${name}`);
    }

    return await cmd.execute(sock, messageInfo, options);
}

/**
 * Get all commands
 * @returns {Map} All commands
 */
function getAllCommands() {
    return commands;
}

/**
 * Get commands by category
 * @returns {Map} Commands grouped by category
 */
function getCommandsByCategory() {
    return categories;
}

/**
 * Get command help text
 * @param {String} name - Command name
 * @returns {String} Help text
 */
function getCommandHelp(name) {
    const cmd = getCommand(name);
    
    if (!cmd) {
        return null;
    }

    let help = `*Command:* ${config.bot.prefix}${cmd.name}\n`;
    
    if (cmd.aliases && cmd.aliases.length > 0) {
        help += `*Aliases:* ${cmd.aliases.map(a => config.bot.prefix + a).join(', ')}\n`;
    }
    
    if (cmd.description) {
        help += `*Description:* ${cmd.description}\n`;
    }
    
    if (cmd.usage) {
        help += `*Usage:* ${config.bot.prefix}${cmd.name} ${cmd.usage}\n`;
    }
    
    if (cmd.category) {
        help += `*Category:* ${cmd.category}\n`;
    }
    
    if (cmd.ownerOnly) {
        help += `*Permission:* Owner Only\n`;
    } else if (cmd.adminOnly) {
        help += `*Permission:* Admin Only\n`;
    }

    return help;
}

/**
 * Reload all commands
 */
function reloadCommands() {
    commands.clear();
    aliases.clear();
    categories.clear();
    loadCommands();
    logger.success('Commands reloaded');
}

// Load commands on startup
loadCommands();

module.exports = {
    loadCommands,
    registerCommand,
    getCommand,
    executeCommand,
    getAllCommands,
    getCommandsByCategory,
    getCommandHelp,
    reloadCommands
};
