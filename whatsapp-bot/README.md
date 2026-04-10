# WhatsApp Bot with Full HTML Support

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A powerful, feature-rich WhatsApp bot built with Node.js and Baileys, featuring a modern web dashboard for easy management and monitoring.

![WhatsApp Bot Dashboard](https://i.imgur.com/example.png)

## Features

### Core Features
- **Full WhatsApp Integration** - Powered by [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
- **Web Dashboard** - Beautiful HTML interface for bot management
- **Plugin System** - Extensible architecture with easy plugin development
- **Multi-Device Support** - Works with WhatsApp Multi-Device Beta
- **QR Code Authentication** - Easy setup with QR code scanning
- **Real-time Updates** - WebSocket support for live data

### Bot Features
- **Command System** - Prefix-based commands with aliases
- **Group Management** - Admin tools for group moderation
- **Media Processing** - Sticker creation, image manipulation
- **Anti-Spam** - Built-in spam protection
- **Auto-Reply** - Configurable automatic responses
- **Message Logging** - Optional message tracking

### Web Dashboard Features
- **Modern UI** - Dark theme with responsive design
- **Real-time Statistics** - Live bot metrics and analytics
- **QR Code Scanner** - Easy connection setup
- **Message Sender** - Send messages directly from web
- **Plugin Manager** - View and manage plugins
- **Log Viewer** - Real-time log monitoring with filters
- **Terminal Access** - Execute commands from browser
- **Settings Panel** - Configure bot without restarting

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn
- Git (optional)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/whatsapp-bot.git
cd whatsapp-bot
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure environment**
```bash
cp config.env.example config.env
# Edit config.env with your settings
```

4. **Start the bot**
```bash
npm start
# or
yarn start
```

5. **Access the dashboard**
Open your browser and go to `http://localhost:3000`

Default login:
- Username: `admin`
- Password: `admin123`

## Configuration

### Environment Variables

Create a `config.env` file with the following variables:

```env
# Bot Settings
BOT_NAME=My WhatsApp Bot
BOT_PREFIX=!
BOT_OWNER=Your Name
OWNER_NUMBER=1234567890

# Web Server
WEB_ENABLED=true
WEB_PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-secret-key

# Features
FEATURE_WELCOME=true
FEATURE_ANTISPAM=true
FEATURE_AUTOREPLY=false
```

See `config.env.example` for all available options.

## Usage

### Bot Commands

#### General Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `!ping` | Check bot latency | `!ping` |
| `!help` | Show all commands | `!help [command]` |
| `!info` | Bot information | `!info` |
| `!uptime` | Show bot uptime | `!uptime` |

#### Admin Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `!kick` | Remove user from group | `!kick @user` |
| `!add` | Add user to group | `!add 1234567890` |
| `!promote` | Promote user to admin | `!promote @user` |
| `!demote` | Demote admin to member | `!demote @user` |
| `!tagall` | Tag all group members | `!tagall [message]` |

#### Media Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `!sticker` | Convert image to sticker | `!sticker` (reply to image) |
| `!toimg` | Convert sticker to image | `!toimg` (reply to sticker) |
| `!getpp` | Get user profile picture | `!getpp @user` |

#### Fun Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `!joke` | Get a random joke | `!joke` |
| `!quote` | Get an inspirational quote | `!quote` |
| `!roll` | Roll a dice | `!roll [sides]` |
| `!coin` | Flip a coin | `!coin` |
| `!8ball` | Magic 8-ball | `!8ball <question>` |

### Web Dashboard

The web dashboard provides a graphical interface for managing your bot:

1. **Dashboard** - Overview of bot statistics and status
2. **QR Code** - Scan to connect WhatsApp
3. **Messages** - Send messages to any number
4. **Plugins** - Manage bot plugins
5. **Logs** - View and filter bot logs
6. **Terminal** - Execute commands remotely
7. **Settings** - Configure bot settings

## Plugin Development

Creating custom plugins is easy! Here's a simple example:

```javascript
// plugins/myplugin.js

const commands = [
    {
        name: 'hello',
        aliases: ['hi'],
        description: 'Say hello',
        category: 'general',
        execute: async (sock, messageInfo, { args }) => {
            const { chat } = messageInfo;
            await sock.sendMessage(chat, { text: 'Hello! 👋' });
        }
    }
];

module.exports = {
    name: 'myplugin',
    version: '1.0.0',
    description: 'My custom plugin',
    author: 'Your Name',
    commands
};
```

## Deployment

### Docker

```bash
# Build image
docker build -t whatsapp-bot .

# Run container
docker run -p 3000:3000 -v $(pwd)/data:/app/data whatsapp-bot
```

### Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Replit

1. Import this repository to Replit
2. Run `npm install`
3. Click Run button

## Project Structure

```
whatsapp-bot/
├── index.js              # Main entry point
├── config.js             # Configuration loader
├── config.env            # Environment variables
├── web-server.js         # Express web server
├── lib/                  # Core modules
│   ├── connection.js     # WhatsApp connection
│   ├── messageHandler.js # Message processor
│   ├── commandHandler.js # Command manager
│   ├── pluginLoader.js   # Plugin system
│   ├── utils.js          # Utility functions
│   └── logger.js         # Logging system
├── plugins/              # Bot plugins
│   ├── general.js        # General commands
│   ├── admin.js          # Admin commands
│   ├── media.js          # Media commands
│   └── fun.js            # Fun commands
├── views/                # HTML templates (EJS)
│   ├── login.ejs
│   ├── dashboard.ejs
│   ├── qr.ejs
│   ├── messages.ejs
│   ├── plugins.ejs
│   ├── logs.ejs
│   ├── terminal.ejs
│   └── settings.ejs
├── public/               # Static assets
│   └── css/
│       └── style.css
├── data/                 # Data storage
├── logs/                 # Log files
└── media/                # Media downloads
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Get bot status |
| `/api/qr` | GET | Get QR code data URL |
| `/api/plugins` | GET | List all plugins |
| `/api/plugins/reload` | POST | Reload all plugins |
| `/api/send` | POST | Send a message |
| `/api/restart` | POST | Restart the bot |
| `/api/groups` | GET | List all groups |
| `/api/logs/:filename` | GET | Get log file content |

## Screenshots

### Dashboard
![Dashboard](https://i.imgur.com/dashboard.png)

### QR Code
![QR Code](https://i.imgur.com/qr.png)

### Terminal
![Terminal](https://i.imgur.com/terminal.png)

## Troubleshooting

### Common Issues

**QR Code not showing**
- Check if the bot is already connected
- Refresh the page
- Restart the bot

**Bot not responding to commands**
- Check if the correct prefix is used
- Verify the bot has necessary permissions
- Check logs for errors

**Web dashboard not accessible**
- Verify `WEB_ENABLED=true` in config
- Check if the port is not in use
- Check firewall settings

### Getting Help

- Check the [Wiki](https://github.com/yourusername/whatsapp-bot/wiki)
- Open an [Issue](https://github.com/yourusername/whatsapp-bot/issues)
- Join our [Discord](https://discord.gg/example)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Express](https://expressjs.com/) - Web framework
- [Chart.js](https://www.chartjs.org/) - Charts and graphs

## Disclaimer

This project is not affiliated with, authorized, maintained, sponsored, or endorsed by WhatsApp or any of its affiliates or subsidiaries. This is an independent and unofficial software. Use at your own risk.

---

Made with ❤️ by [Your Name](https://github.com/yourusername)
