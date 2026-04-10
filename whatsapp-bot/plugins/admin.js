/**
 * Admin Commands Plugin
 * Group administration commands
 */

const { isAdmin, isOwner, getGroupMetadata } = require('../lib/utils');
const logger = require('../lib/logger');

const commands = [
    {
        name: 'kick',
        aliases: ['remove', 'ban'],
        description: 'Remove a user from the group',
        category: 'admin',
        groupOnly: true,
        adminOnly: true,
        usage: '@user [reason]',
        execute: async (sock, messageInfo, { args, fullArgs }) => {
            const { chat, sender, quotedMsg, mentions } = messageInfo;
            
            // Get target user
            let targetUser;
            if (mentions.length > 0) {
                targetUser = mentions[0];
            } else if (quotedMsg) {
                targetUser = quotedMsg.participant;
            } else if (args.length > 0) {
                targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }
            
            if (!targetUser) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please mention a user, reply to their message, or provide their number.' 
                });
                return;
            }
            
            try {
                await sock.groupParticipantsUpdate(chat, [targetUser], 'remove');
                const reason = args.slice(1).join(' ') || 'No reason provided';
                await sock.sendMessage(chat, { 
                    text: `👢 User removed\n📝 Reason: ${reason}` 
                });
            } catch (error) {
                logger.error('Error kicking user:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to remove user. Make sure I have admin privileges.' 
                });
            }
        }
    },
    {
        name: 'add',
        aliases: ['invite'],
        description: 'Add a user to the group',
        category: 'admin',
        groupOnly: true,
        adminOnly: true,
        usage: '<phone_number>',
        execute: async (sock, messageInfo, { args }) => {
            const { chat } = messageInfo;
            
            if (args.length === 0) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please provide a phone number.\nExample: !add 1234567890' 
                });
                return;
            }
            
            const phoneNumber = args[0].replace(/[^0-9]/g, '');
            const userJid = phoneNumber + '@s.whatsapp.net';
            
            try {
                await sock.groupParticipantsUpdate(chat, [userJid], 'add');
                await sock.sendMessage(chat, { 
                    text: `✅ User +${phoneNumber} added to the group.` 
                });
            } catch (error) {
                logger.error('Error adding user:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to add user. Make sure:\n• The number is correct\n• The user allows being added to groups\n• I have admin privileges' 
                });
            }
        }
    },
    {
        name: 'promote',
        aliases: ['admin', 'makeadmin'],
        description: 'Promote a user to admin',
        category: 'admin',
        groupOnly: true,
        adminOnly: true,
        usage: '@user',
        execute: async (sock, messageInfo, { args }) => {
            const { chat, mentions, quotedMsg } = messageInfo;
            
            let targetUser;
            if (mentions.length > 0) {
                targetUser = mentions[0];
            } else if (quotedMsg) {
                targetUser = quotedMsg.participant;
            } else if (args.length > 0) {
                targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }
            
            if (!targetUser) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please mention a user or reply to their message.' 
                });
                return;
            }
            
            try {
                await sock.groupParticipantsUpdate(chat, [targetUser], 'promote');
                await sock.sendMessage(chat, { 
                    text: `⬆️ User promoted to admin.` 
                });
            } catch (error) {
                logger.error('Error promoting user:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to promote user.' 
                });
            }
        }
    },
    {
        name: 'demote',
        aliases: ['removeadmin'],
        description: 'Demote an admin to member',
        category: 'admin',
        groupOnly: true,
        adminOnly: true,
        usage: '@user',
        execute: async (sock, messageInfo, { args }) => {
            const { chat, mentions, quotedMsg } = messageInfo;
            
            let targetUser;
            if (mentions.length > 0) {
                targetUser = mentions[0];
            } else if (quotedMsg) {
                targetUser = quotedMsg.participant;
            } else if (args.length > 0) {
                targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }
            
            if (!targetUser) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please mention a user or reply to their message.' 
                });
                return;
            }
            
            try {
                await sock.groupParticipantsUpdate(chat, [targetUser], 'demote');
                await sock.sendMessage(chat, { 
                    text: `⬇️ User demoted to member.` 
                });
            } catch (error) {
                logger.error('Error demoting user:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to demote user.' 
                });
            }
        }
    },
    {
        name: 'groupinfo',
        aliases: ['ginfo', 'group'],
        description: 'Show group information',
        category: 'admin',
        groupOnly: true,
        execute: async (sock, messageInfo) => {
            const { chat } = messageInfo;
            
            try {
                const metadata = await getGroupMetadata(sock, chat);
                
                if (!metadata) {
                    await sock.sendMessage(chat, { 
                        text: '❌ Failed to get group information.' 
                    });
                    return;
                }
                
                const owner = metadata.owner ? `@${metadata.owner.split('@')[0]}` : 'Unknown';
                const created = new Date(metadata.creation * 1000).toLocaleDateString();
                
                const info = `
╔═══ *Group Information* ═══╗

📛 *Name:* ${metadata.subject}
📝 *Description:* ${metadata.desc || 'No description'}
👤 *Owner:* ${owner}
👥 *Members:* ${metadata.participants.length}
📅 *Created:* ${created}
🔗 *Group ID:* ${metadata.id}

*Participants:*
👑 Admins: ${metadata.participants.filter(p => p.admin).length}
👤 Members: ${metadata.participants.filter(p => !p.admin).length}

*Settings:*
🔒 Restrict: ${metadata.restrict ? '✅' : '❌'}
📢 Announce: ${metadata.announce ? '✅' : '❌'}
                `;
                
                await sock.sendMessage(chat, { text: info.trim() });
                
            } catch (error) {
                logger.error('Error getting group info:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to get group information.' 
                });
            }
        }
    },
    {
        name: 'setname',
        aliases: ['setsubject', 'subject'],
        description: 'Change group name',
        category: 'admin',
        groupOnly: true,
        adminOnly: true,
        usage: '<new_name>',
        execute: async (sock, messageInfo, { fullArgs }) => {
            const { chat } = messageInfo;
            
            if (!fullArgs) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please provide a new group name.' 
                });
                return;
            }
            
            try {
                await sock.groupUpdateSubject(chat, fullArgs);
                await sock.sendMessage(chat, { 
                    text: `✅ Group name changed to: ${fullArgs}` 
                });
            } catch (error) {
                logger.error('Error changing group name:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to change group name.' 
                });
            }
        }
    },
    {
        name: 'setdesc',
        aliases: ['setdescription', 'description'],
        description: 'Change group description',
        category: 'admin',
        groupOnly: true,
        adminOnly: true,
        usage: '<new_description>',
        execute: async (sock, messageInfo, { fullArgs }) => {
            const { chat } = messageInfo;
            
            if (!fullArgs) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please provide a new group description.' 
                });
                return;
            }
            
            try {
                await sock.groupUpdateDescription(chat, fullArgs);
                await sock.sendMessage(chat, { 
                    text: `✅ Group description updated.` 
                });
            } catch (error) {
                logger.error('Error changing group description:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to change group description.' 
                });
            }
        }
    },
    {
        name: 'tagall',
        aliases: ['mentionall', 'everyone'],
        description: 'Tag all group members',
        category: 'admin',
        groupOnly: true,
        adminOnly: true,
        usage: '[message]',
        execute: async (sock, messageInfo, { fullArgs }) => {
            const { chat } = messageInfo;
            
            try {
                const metadata = await getGroupMetadata(sock, chat);
                const participants = metadata.participants.map(p => p.id);
                
                const message = fullArgs || '👋 Attention everyone!';
                
                await sock.sendMessage(chat, { 
                    text: message,
                    mentions: participants
                });
                
            } catch (error) {
                logger.error('Error tagging all:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to tag all members.' 
                });
            }
        }
    },
    {
        name: 'hidetag',
        aliases: ['silenttag'],
        description: 'Tag all members without showing the list',
        category: 'admin',
        groupOnly: true,
        adminOnly: true,
        usage: '[message]',
        execute: async (sock, messageInfo, { fullArgs }) => {
            const { chat } = messageInfo;
            
            try {
                const metadata = await getGroupMetadata(sock, chat);
                const participants = metadata.participants.map(p => p.id);
                
                const message = fullArgs || '👋 Attention!';
                
                // Send message with mentions but hide the @mentions visually
                await sock.sendMessage(chat, { 
                    text: message + '\n' + participants.map(p => '@' + p.split('@')[0]).join(' '),
                    mentions: participants
                });
                
            } catch (error) {
                logger.error('Error with hidetag:', error);
                await sock.sendMessage(chat, { 
                    text: '❌ Failed to send hidden tags.' 
                });
            }
        }
    },
    {
        name: 'antilink',
        aliases: ['linkguard'],
        description: 'Toggle anti-link protection',
        category: 'admin',
        groupOnly: true,
        adminOnly: true,
        usage: 'on/off',
        execute: async (sock, messageInfo, { args }) => {
            const { chat } = messageInfo;
            
            if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
                await sock.sendMessage(chat, { 
                    text: '❌ Please specify: on or off' 
                });
                return;
            }
            
            const enabled = args[0].toLowerCase() === 'on';
            
            // Store setting in global state (you should use a database in production)
            if (!global.groupSettings) global.groupSettings = {};
            if (!global.groupSettings[chat]) global.groupSettings[chat] = {};
            global.groupSettings[chat].antilink = enabled;
            
            await sock.sendMessage(chat, { 
                text: `🔗 Anti-link protection: ${enabled ? '✅ Enabled' : '❌ Disabled'}` 
            });
        }
    }
];

module.exports = {
    name: 'admin',
    version: '1.0.0',
    description: 'Group administration commands',
    author: 'WhatsApp Bot',
    commands
};
