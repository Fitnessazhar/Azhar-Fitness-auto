/**
 * Media Commands Plugin
 * Media processing and manipulation commands
 */

const { downloadMedia, fetchBuffer, formatBytes } = require('../lib/utils');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const commands = [
    {
        name: 'sticker',
        aliases: ['s', 'stiker'],
        description: 'Convert image/video to sticker',
        category: 'media',
        usage: '[reply to image/video]',
        execute: async (sock, messageInfo) => {
            const { chat, quoted, media } = messageInfo;
            
            const targetMedia = quoted || media;
            
            if (!targetMedia) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please reply to an image or video, or send an image with the command.' 
                });
                return;
            }
            
            if (!['image', 'video'].includes(targetMedia.type)) {
                await sock.sendMessage(chat, { 
                    text: '❌ Only images and videos can be converted to stickers.' 
                });
                return;
            }
            
            try {
                await sock.sendMessage(chat, { text: '⏳ Creating sticker...' });
                
                // Download media
                const buffer = await downloadMedia(targetMedia.data, targetMedia.type);
                
                // Send as sticker
                await sock.sendMessage(chat, { 
                    sticker: buffer 
                });
                
            } catch (error) {
                console.error('Error creating sticker:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to create sticker.' 
                });
            }
        }
    },
    {
        name: 'toimg',
        aliases: ['image', 'img'],
        description: 'Convert sticker to image',
        category: 'media',
        usage: '[reply to sticker]',
        execute: async (sock, messageInfo) => {
            const { chat, quoted } = messageInfo;
            
            if (!quoted || quoted.type !== 'sticker') {
                await sock.sendMessage(chat, { 
                    text: '❌ Please reply to a sticker.' 
                });
                return;
            }
            
            try {
                await sock.sendMessage(chat, { text: '⏳ Converting to image...' });
                
                // Download sticker
                const buffer = await downloadMedia(quoted.data, 'sticker');
                
                // Send as image
                await sock.sendMessage(chat, { 
                    image: buffer,
                    caption: '✅ Sticker converted to image'
                });
                
            } catch (error) {
                console.error('Error converting sticker:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to convert sticker.' 
                });
            }
        }
    },
    {
        name: 'tovideo',
        aliases: ['tovid', 'mp4'],
        description: 'Convert GIF sticker to video',
        category: 'media',
        usage: '[reply to animated sticker]',
        execute: async (sock, messageInfo) => {
            const { chat, quoted } = messageInfo;
            
            if (!quoted || quoted.type !== 'sticker') {
                await sock.sendMessage(chat, { 
                    text: '❌ Please reply to an animated sticker.' 
                });
                return;
            }
            
            try {
                await sock.sendMessage(chat, { text: '⏳ Converting to video...' });
                
                // Download sticker
                const buffer = await downloadMedia(quoted.data, 'sticker');
                
                // Send as video
                await sock.sendMessage(chat, { 
                    video: buffer,
                    caption: '✅ Sticker converted to video',
                    gifPlayback: true
                });
                
            } catch (error) {
                console.error('Error converting to video:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to convert sticker to video.' 
                });
            }
        }
    },
    {
        name: 'ttp',
        aliases: ['texttopng', 'textp'],
        description: 'Convert text to image sticker',
        category: 'media',
        usage: '<text>',
        execute: async (sock, messageInfo, { fullArgs }) => {
            const { chat } = messageInfo;
            
            if (!fullArgs) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please provide text.\nExample: !ttp Hello World' 
                });
                return;
            }
            
            try {
                // For now, just send as text message
                // In a full implementation, you'd use a text-to-image library
                await sock.sendMessage(chat, { 
                    text: `📝 *Text to Sticker:*\n\n${fullArgs}\n\n_Note: Full text-to-image conversion requires additional setup._` 
                });
                
            } catch (error) {
                console.error('Error creating text sticker:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to create text sticker.' 
                });
            }
        }
    },
    {
        name: 'getpp',
        aliases: ['profilepic', 'dp'],
        description: 'Get user profile picture',
        category: 'media',
        usage: '[@user]',
        execute: async (sock, messageInfo, { args }) => {
            const { chat, sender, mentions, quotedMsg } = messageInfo;
            
            let targetUser;
            if (mentions.length > 0) {
                targetUser = mentions[0];
            } else if (quotedMsg) {
                targetUser = quotedMsg.participant;
            } else if (args.length > 0) {
                targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            } else {
                targetUser = sender;
            }
            
            try {
                const ppUrl = await sock.profilePictureUrl(targetUser, 'image');
                const buffer = await fetchBuffer(ppUrl);
                
                await sock.sendMessage(chat, { 
                    image: buffer,
                    caption: `📷 Profile picture of @${targetUser.split('@')[0]}`,
                    mentions: [targetUser]
                });
                
            } catch (error) {
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to get profile picture. User may not have one or has privacy settings enabled.' 
                });
            }
        }
    },
    {
        name: 'upload',
        aliases: ['tourl', 'geturl'],
        description: 'Upload media to get URL',
        category: 'media',
        usage: '[reply to media]',
        execute: async (sock, messageInfo) => {
            const { chat, quoted, media } = messageInfo;
            
            const targetMedia = quoted || media;
            
            if (!targetMedia) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please reply to a media file.' 
                });
                return;
            }
            
            try {
                await sock.sendMessage(chat, { text: '⏳ Uploading...' });
                
                // Download media
                const buffer = await downloadMedia(targetMedia.data, targetMedia.type);
                
                // In a real implementation, you'd upload to a file hosting service
                // For now, just provide info about the file
                await sock.sendMessage(chat, { 
                    text: `📁 *File Information*\n\nType: ${targetMedia.type}\nSize: ${formatBytes(buffer.length)}\n\n_Note: Full upload functionality requires a file hosting service._` 
                });
                
            } catch (error) {
                console.error('Error uploading:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to upload file.' 
                });
            }
        }
    },
    {
        name: 'readviewonce',
        aliases: ['rvo', 'viewonce'],
        description: 'Read view-once messages',
        category: 'media',
        usage: '[reply to view-once message]',
        execute: async (sock, messageInfo) => {
            const { chat, quoted } = messageInfo;
            
            if (!quoted) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please reply to a view-once message.' 
                });
                return;
            }
            
            try {
                // Check if it's a view-once message
                const viewOnceContent = quoted.data?.viewOnceMessage?.message;
                
                if (!viewOnceContent) {
                    await sock.sendMessage(chat, { 
                        text: '❌ This is not a view-once message.' 
                    });
                    return;
                }
                
                // Extract and send the content
                const messageType = Object.keys(viewOnceContent)[0];
                const content = viewOnceContent[messageType];
                
                if (messageType === 'imageMessage') {
                    await sock.sendMessage(chat, { 
                        image: { url: content.url },
                        caption: '✅ View-once image revealed'
                    });
                } else if (messageType === 'videoMessage') {
                    await sock.sendMessage(chat, { 
                        video: { url: content.url },
                        caption: '✅ View-once video revealed'
                    });
                }
                
            } catch (error) {
                console.error('Error reading view-once:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to read view-once message.' 
                });
            }
        }
    },
    {
        name: 'blur',
        aliases: ['blurimage'],
        description: 'Blur an image',
        category: 'media',
        usage: '[reply to image]',
        execute: async (sock, messageInfo) => {
            const { chat, quoted, media } = messageInfo;
            
            const targetMedia = quoted || media;
            
            if (!targetMedia || targetMedia.type !== 'image') {
                await sock.sendMessage(chat, { 
                    text: '❌ Please reply to an image.' 
                });
                return;
            }
            
            try {
                await sock.sendMessage(chat, { text: '⏳ Processing image...' });
                
                // Download image
                const buffer = await downloadMedia(targetMedia.data, 'image');
                
                // In a full implementation, you'd use sharp or similar to blur
                await sock.sendMessage(chat, { 
                    text: '🖼️ *Image Blur*\n\n_Note: Full image processing requires sharp library setup._' 
                });
                
            } catch (error) {
                console.error('Error blurring image:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to blur image.' 
                });
            }
        }
    },
    {
        name: 'caption',
        aliases: ['addtext', 'text'],
        description: 'Add caption to media',
        category: 'media',
        usage: '<caption>',
        execute: async (sock, messageInfo, { fullArgs }) => {
            const { chat, quoted, media } = messageInfo;
            
            const targetMedia = quoted || media;
            
            if (!targetMedia) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please reply to a media file or send media with caption.' 
                });
                return;
            }
            
            if (!fullArgs) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please provide a caption.' 
                });
                return;
            }
            
            try {
                const buffer = await downloadMedia(targetMedia.data, targetMedia.type);
                
                if (targetMedia.type === 'image') {
                    await sock.sendMessage(chat, { 
                        image: buffer,
                        caption: fullArgs
                    });
                } else if (targetMedia.type === 'video') {
                    await sock.sendMessage(chat, { 
                        video: buffer,
                        caption: fullArgs
                    });
                }
                
            } catch (error) {
                console.error('Error adding caption:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to add caption.' 
                });
            }
        }
    }
];

module.exports = {
    name: 'media',
    version: '1.0.0',
    description: 'Media processing commands',
    author: 'WhatsApp Bot',
    commands
};
