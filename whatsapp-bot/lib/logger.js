/**
 * Logger Module
 * Advanced logging with colors and formatting
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const config = require('../config');

class Logger {
    constructor() {
        this.logFolder = config.logging.folder;
        this.ensureLogFolder();
    }

    ensureLogFolder() {
        if (!fs.existsSync(this.logFolder)) {
            fs.mkdirSync(this.logFolder, { recursive: true });
        }
    }

    getLogFile() {
        const date = moment().format('YYYY-MM-DD');
        return path.join(this.logFolder, `${date}.log`);
    }

    formatMessage(level, message, ...args) {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        let formattedMessage = message;
        if (args.length > 0) {
            formattedMessage += ' ' + args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
        }
        
        return { prefix, formattedMessage };
    }

    writeToFile(level, message) {
        if (!config.logging.file) return;
        
        try {
            const logFile = this.getLogFile();
            const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
            const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
            fs.appendFileSync(logFile, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    info(message, ...args) {
        const { prefix, formattedMessage } = this.formatMessage('info', message, ...args);
        if (config.logging.console) {
            console.log(chalk.blue(prefix), formattedMessage);
        }
        this.writeToFile('info', formattedMessage);
    }

    success(message, ...args) {
        const { prefix, formattedMessage } = this.formatMessage('success', message, ...args);
        if (config.logging.console) {
            console.log(chalk.green(prefix), chalk.green(formattedMessage));
        }
        this.writeToFile('success', formattedMessage);
    }

    warn(message, ...args) {
        const { prefix, formattedMessage } = this.formatMessage('warn', message, ...args);
        if (config.logging.console) {
            console.log(chalk.yellow(prefix), chalk.yellow(formattedMessage));
        }
        this.writeToFile('warn', formattedMessage);
    }

    error(message, ...args) {
        const { prefix, formattedMessage } = this.formatMessage('error', message, ...args);
        if (config.logging.console) {
            console.log(chalk.red(prefix), chalk.red(formattedMessage));
        }
        this.writeToFile('error', formattedMessage);
    }

    debug(message, ...args) {
        if (config.logging.level !== 'debug') return;
        
        const { prefix, formattedMessage } = this.formatMessage('debug', message, ...args);
        if (config.logging.console) {
            console.log(chalk.gray(prefix), chalk.gray(formattedMessage));
        }
        this.writeToFile('debug', formattedMessage);
    }

    command(user, command, args) {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        const prefix = `[${timestamp}] [COMMAND]`;
        const message = `${user} executed: ${command} ${args || ''}`;
        
        if (config.logging.console) {
            console.log(chalk.cyan(prefix), chalk.cyan(message));
        }
        this.writeToFile('command', message);
    }

    message(from, type, content) {
        if (!config.features.messageLogging) return;
        
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        const prefix = `[${timestamp}] [MESSAGE]`;
        const truncated = content.length > 50 ? content.substring(0, 50) + '...' : content;
        const message = `${from} [${type}]: ${truncated}`;
        
        if (config.logging.console) {
            console.log(chalk.magenta(prefix), chalk.magenta(message));
        }
        this.writeToFile('message', message);
    }

    banner(text) {
        const line = '='.repeat(text.length + 4);
        if (config.logging.console) {
            console.log(chalk.cyan(line));
            console.log(chalk.cyan(`= ${text} =`));
            console.log(chalk.cyan(line));
        }
    }

    table(data, title = '') {
        if (title) {
            console.log(chalk.cyan(`\n${title}`));
        }
        console.table(data);
    }
}

module.exports = new Logger();
