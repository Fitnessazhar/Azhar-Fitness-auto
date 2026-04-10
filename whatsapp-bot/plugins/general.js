/**
 * General Commands Plugin
 * Basic utility commands for the bot
 */

const config = require('../config');
const { formatDuration, formatBytes } = require('../lib/utils');
const moment = require('moment');

const commands = [
    {
        name: 'ping',
        aliases: ['p'],
        description: 'Check bot response time',
        category: 'general',
        execute: async (sock, messageInfo) => {
            const start = Date.now();
            const sent = await sock.sendMessage(messageInfo.chat, { text: '🏓 Pinging...' });
            const end = Date.now();
            const latency = end - start;
            
            await sock.sendMessage(messageInfo.chat, { 
                text: `🏓 Pong!\n⏱️ Latency: ${latency}ms\n📡 API Latency: ${end - start}ms`,
                edit: sent.key
            });
        }
    },
    {
        name: 'help',
        aliases: ['h', 'menu', 'commands'],
        description: 'Show all available commands',
        category: 'general',
        execute: async (sock, messageInfo, { args }) => {
            const { getCommandsByCategory, getCommandHelp } = require('../lib/commandHandler');
            
            if (args.length > 0) {
                // Show help for specific command
                const help = getCommandHelp(args[0]);
                if (help) {
                    await sock.sendMessage(messageInfo.chat, { text: help });
                } else {
                    await sock.sendMessage(messageInfo.chat, { 
                        text: `❓ Command not found: ${args[0]}` 
                    });
                }
                return;
            }
            
            // Show all commands
            const categories = getCommandsByCategory();
            let menu = `╔═══ *${config.bot.name}* ═══╗\n\n`;
            menu += `👋 Hello *${messageInfo.pushName}*!\n`;
            menu += `🤖 Bot Version: ${config.bot.version}\n`;
            menu += `⏱️ Uptime: ${formatDuration(Date.now() - global.botState.startTime)}\n`;
            menu += `📊 Commands: ${global.botState.plugins.size}\n\n`;
            
            for (const [category, cmds] of categories) {
                menu += `*${category.toUpperCase()}*\n`;
                for (const cmd of cmds) {
                    menu += `  ${config.bot.prefix}${cmd.name}`;
                    if (cmd.description) {
                        menu += ` - ${cmd.description}`;
                    }
                    menu += '\n';
                }
                menu += '\n';
            }
            
            menu += `\n💡 Type ${config.bot.prefix}help <command> for detailed info`;
            
            await sock.sendMessage(messageInfo.chat, { text: menu });
        }
    },
    {
        name: 'info',
        aliases: ['about', 'botinfo'],
        description: 'Show bot information',
        category: 'general',
        execute: async (sock, messageInfo) => {
            const info = `
╔═══ *${config.bot.name}* ═══╗

🤖 *Bot Information*
📛 Name: ${config.bot.name}
🔢 Version: ${config.bot.version}
👤 Owner: ${config.bot.owner || 'Not set'}
📝 Description: ${config.bot.description}

📊 *Statistics*
⏱️ Uptime: ${formatDuration(Date.now() - global.botState.startTime)}
💬 Messages: ${global.botState.messageCount.toLocaleString()}
⚡ Commands: ${global.botState.commandCount.toLocaleString()}
👥 Users: ${global.botState.userCount.size.toLocaleString()}
🔌 Plugins: ${global.botState.plugins.size}

💻 *System*
📅 Date: ${moment().format('YYYY-MM-DD HH:mm:ss')}
🌐 Node.js: ${process.version}
📦 Platform: ${process.platform}
💾 Memory: ${formatBytes(process.memoryUsage().heapUsed)}

═══════════════════
*Made with ❤️ by ${config.bot.owner || 'Developer'}*
            `;
            
            await sock.sendMessage(messageInfo.chat, { text: info.trim() });
        }
    },
    {
        name: 'uptime',
        aliases: ['up'],
        description: 'Show bot uptime',
        category: 'general',
        execute: async (sock, messageInfo) => {
            const uptime = formatDuration(Date.now() - global.botState.startTime);
            await sock.sendMessage(messageInfo.chat, { 
                text: `⏱️ *Bot Uptime:* ${uptime}` 
            });
        }
    },
    {
        name: 'status',
        aliases: ['stats'],
        description: 'Show bot status and statistics',
        category: 'general',
        execute: async (sock, messageInfo) => {
            const status = `
╔═══ *Bot Status* ═══╗

📊 *Statistics*
💬 Messages Processed: ${global.botState.messageCount.toLocaleString()}
⚡ Commands Executed: ${global.botState.commandCount.toLocaleString()}
👥 Unique Users: ${global.botState.userCount.size.toLocaleString()}
🔌 Plugins Loaded: ${global.botState.plugins.size}

🔌 *Connection*
📡 Connected: ${global.botState.isConnected ? '✅' : '❌'}
✅ Ready: ${global.botState.isReady ? '✅' : '❌'}
⏱️ Uptime: ${formatDuration(Date.now() - global.botState.startTime)}

💻 *System*
💾 Memory Usage: ${formatBytes(process.memoryUsage().heapUsed)}
📦 Total Memory: ${formatBytes(process.memoryUsage().heapTotal)}
🔄 CPU Usage: ${process.cpuUsage().user / 1000000}s
            `;
            
            await sock.sendMessage(messageInfo.chat, { text: status.trim() });
        }
    },
    {
        name: 'time',
        aliases: ['date'],
        description: 'Show current date and time',
        category: 'general',
        execute: async (sock, messageInfo) => {
            const now = moment();
            const timeInfo = `
🕐 *Current Time*

📅 Date: ${now.format('dddd, MMMM Do YYYY')}
🕒 Time: ${now.format('HH:mm:ss')}
🌍 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
📆 Week: ${now.format('w')}
            `;
            
            await sock.sendMessage(messageInfo.chat, { text: timeInfo.trim() });
        }
    },
    {
        name: 'owner',
        aliases: ['creator', 'developer'],
        description: 'Show bot owner information',
        category: 'general',
        execute: async (sock, messageInfo) => {
            const ownerInfo = `
╔═══ *Bot Owner* ═══╗

👤 *Name:* ${config.bot.owner || 'Not set'}
📱 *Number:* ${config.bot.ownerNumber || 'Not set'}

💬 *Contact the owner for:*
• Bug reports
• Feature requests
• Support & help
• Collaboration

═══════════════════
*Thank you for using ${config.bot.name}!*
            `;
            
            await sock.sendMessage(messageInfo.chat, { text: ownerInfo.trim() });
        }
    }
];

// Plugin metadata
module.exports = {
    name: 'general',
    version: '1.0.0',
    description: 'General utility commands',
    author: 'WhatsApp Bot',
    commands
};
