/**
 * Fun Commands Plugin
 * Entertainment and fun commands
 */

const { fetchJson, randomString } = require('../lib/utils');

const commands = [
    {
        name: 'joke',
        aliases: ['funny'],
        description: 'Get a random joke',
        category: 'fun',
        execute: async (sock, messageInfo) => {
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything!",
                "Why did the scarecrow win an award? He was outstanding in his field!",
                "Why don't eggs tell jokes? They'd crack each other up!",
                "What do you call a fake noodle? An impasta!",
                "Why did the math book look sad? Because it had too many problems.",
                "What do you call a bear with no teeth? A gummy bear!",
                "Why couldn't the bicycle stand up by itself? It was two tired!",
                "What do you call a sleeping dinosaur? A dino-snore!",
                "Why did the cookie go to the doctor? Because it was feeling crumbly!",
                "What do you call a fish wearing a crown? A king fish!"
            ];
            
            const joke = jokes[Math.floor(Math.random() * jokes.length)];
            await sock.sendMessage(messageInfo.chat, { text: `😄 *Joke:*\n\n${joke}` });
        }
    },
    {
        name: 'quote',
        aliases: ['q'],
        description: 'Get an inspirational quote',
        category: 'fun',
        execute: async (sock, messageInfo) => {
            const quotes = [
                { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
                { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
                { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
                { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
                { text: "Whoever is happy will make others happy too.", author: "Anne Frank" },
                { text: "You will face many defeats in life, but never let yourself be defeated.", author: "Maya Angelou" },
                { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
                { text: "Money and success don't change people; they merely amplify what is already there.", author: "Will Smith" },
                { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" }
            ];
            
            const quote = quotes[Math.floor(Math.random() * quotes.length)];
            await sock.sendMessage(messageInfo.chat, { 
                text: `💭 *Quote:*\n\n"${quote.text}"\n\n— *${quote.author}*` 
            });
        }
    },
    {
        name: 'fact',
        aliases: ['didyouknow'],
        description: 'Get a random interesting fact',
        category: 'fun',
        execute: async (sock, messageInfo) => {
            const facts = [
                "Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible!",
                "Octopuses have three hearts, nine brains, and blue blood!",
                "Bananas are berries, but strawberries aren't!",
                "A day on Venus is longer than a year on Venus!",
                "Wombat poop is cube-shaped!",
                "The Eiffel Tower can be 15 cm taller during the summer due to heat expansion!",
                "A group of flamingos is called a 'flamboyance'!",
                "Cows have best friends and get stressed when separated!",
                "The shortest war in history lasted only 38 minutes!",
                "There's a species of jellyfish that is immortal!"
            ];
            
            const fact = facts[Math.floor(Math.random() * facts.length)];
            await sock.sendMessage(messageInfo.chat, { text: `🤓 *Did You Know?*\n\n${fact}` });
        }
    },
    {
        name: 'roll',
        aliases: ['dice'],
        description: 'Roll a dice',
        category: 'fun',
        usage: '[sides]',
        execute: async (sock, messageInfo, { args }) => {
            const sides = parseInt(args[0]) || 6;
            const result = Math.floor(Math.random() * sides) + 1;
            
            await sock.sendMessage(messageInfo.chat, { 
                text: `🎲 *Rolling ${sides}-sided dice...*\n\nResult: *${result}*` 
            });
        }
    },
    {
        name: 'coin',
        aliases: ['flip', 'coinflip'],
        description: 'Flip a coin',
        category: 'fun',
        execute: async (sock, messageInfo) => {
            const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
            const emoji = result === 'Heads' ? '👤' : '🦅';
            
            await sock.sendMessage(messageInfo.chat, { 
                text: `🪙 *Flipping coin...*\n\nResult: ${emoji} *${result}*` 
            });
        }
    },
    {
        name: '8ball',
        aliases: ['magicball', 'ask'],
        description: 'Ask the magic 8-ball a question',
        category: 'fun',
        usage: '<question>',
        execute: async (sock, messageInfo, { fullArgs }) => {
            if (!fullArgs) {
                await sock.sendMessage(messageInfo.chat, { 
                    text: '❌ Please ask a question!\nExample: !8ball Will I be rich?' 
                });
                return;
            }
            
            const responses = [
                "It is certain.",
                "It is decidedly so.",
                "Without a doubt.",
                "Yes definitely.",
                "You may rely on it.",
                "As I see it, yes.",
                "Most likely.",
                "Outlook good.",
                "Yes.",
                "Signs point to yes.",
                "Reply hazy, try again.",
                "Ask again later.",
                "Better not tell you now.",
                "Cannot predict now.",
                "Concentrate and ask again.",
                "Don't count on it.",
                "My reply is no.",
                "My sources say no.",
                "Outlook not so good.",
                "Very doubtful."
            ];
            
            const response = responses[Math.floor(Math.random() * responses.length)];
            
            await sock.sendMessage(messageInfo.chat, { 
                text: `🎱 *Magic 8-Ball*\n\nQ: ${fullArgs}\n\nA: *${response}*` 
            });
        }
    },
    {
        name: 'rate',
        aliases: ['score'],
        description: 'Rate something out of 10',
        category: 'fun',
        usage: '<thing_to_rate>',
        execute: async (sock, messageInfo, { fullArgs }) => {
            if (!fullArgs) {
                await sock.sendMessage(messageInfo.chat, { 
                    text: '❌ Please specify what to rate!\nExample: !rate my cooking' 
                });
                return;
            }
            
            const rating = Math.floor(Math.random() * 11);
            let emoji = '';
            
            if (rating >= 8) emoji = '😍';
            else if (rating >= 6) emoji = '🙂';
            else if (rating >= 4) emoji = '😐';
            else if (rating >= 2) emoji = '😕';
            else emoji = '😢';
            
            const bar = '⭐'.repeat(rating) + '⚫'.repeat(10 - rating);
            
            await sock.sendMessage(messageInfo.chat, { 
                text: `📊 *Rating*\n\n${fullArgs}\n\n${bar}\nScore: *${rating}/10* ${emoji}` 
            });
        }
    },
    {
        name: 'love',
        aliases: ['lovecalc', 'ship'],
        description: 'Calculate love compatibility',
        category: 'fun',
        usage: '<name1> <name2>',
        execute: async (sock, messageInfo, { args }) => {
            if (args.length < 2) {
                await sock.sendMessage(messageInfo.chat, { 
                    text: '❌ Please provide two names!\nExample: !love John Jane' 
                });
                return;
            }
            
            const name1 = args[0];
            const name2 = args[1];
            
            // Generate consistent percentage based on names
            const combined = (name1 + name2).toLowerCase();
            let hash = 0;
            for (let i = 0; i < combined.length; i++) {
                hash = ((hash << 5) - hash) + combined.charCodeAt(i);
                hash = hash & hash;
            }
            const percentage = Math.abs(hash % 101);
            
            let message = '';
            if (percentage >= 80) message = '💕 A match made in heaven!';
            else if (percentage >= 60) message = '💗 Great compatibility!';
            else if (percentage >= 40) message = '💛 There\'s potential!';
            else if (percentage >= 20) message = '💔 It might be challenging...';
            else message = '💀 Run while you still can!';
            
            const hearts = '❤️'.repeat(Math.floor(percentage / 10)) + '🖤'.repeat(10 - Math.floor(percentage / 10));
            
            await sock.sendMessage(messageInfo.chat, { 
                text: `💘 *Love Calculator*\n\n${name1} ❤️ ${name2}\n\n${hearts}\nCompatibility: *${percentage}%*\n\n${message}` 
            });
        }
    },
    {
        name: 'meme',
        aliases: ['memes'],
        description: 'Get a random meme',
        category: 'fun',
        execute: async (sock, messageInfo) => {
            const memes = [
                "When you finally fix that bug after 5 hours...\n\n*It's been 84 years*",
                "Me: *writes one line of code*\n\nAlso me: *takes a break, I deserve it*",
                "My code doesn't work, I don't know why.\nMy code works, I don't know why.",
                "*Client:* Can you make the logo bigger?\n*Me:* Can you make your expectations smaller?",
                "When the code works on the first try...\n\n*Something's wrong, I can feel it*",
                "*Me debugging:*\n\nConsole.log('here')\nConsole.log('here2')\nConsole.log('here3')",
                "When you delete a block of code that was causing problems...\n\n*I am inevitable*",
                "*Teacher:* You can't learn programming in one night\n*Me watching tutorials at 3AM:*\n\n*Observe*"
            ];
            
            const meme = memes[Math.floor(Math.random() * memes.length)];
            await sock.sendMessage(messageInfo.chat, { text: `😂 *Meme:*\n\n${meme}` });
        }
    },
    {
        name: 'riddle',
        aliases: ['puzzle'],
        description: 'Get a riddle',
        category: 'fun',
        execute: async (sock, messageInfo) => {
            const riddles = [
                { q: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", a: "A map!" },
                { q: "What has keys but no locks?", a: "A piano!" },
                { q: "What has a head and a tail but no body?", a: "A coin!" },
                { q: "What gets wetter the more it dries?", a: "A towel!" },
                { q: "What has an eye but cannot see?", a: "A needle!" },
                { q: "What can travel around the world while staying in a corner?", a: "A stamp!" },
                { q: "What has hands but cannot clap?", a: "A clock!" },
                { q: "What has a neck but no head?", a: "A bottle!" }
            ];
            
            const riddle = riddles[Math.floor(Math.random() * riddles.length)];
            
            await sock.sendMessage(messageInfo.chat, { 
                text: `🧩 *Riddle:*\n\n${riddle.q}\n\n_Answer will be revealed in 10 seconds..._` 
            });
            
            // Send answer after delay
            setTimeout(async () => {
                await sock.sendMessage(messageInfo.chat, { 
                    text: `🎯 *Answer:*\n\n${riddle.a}` 
                });
            }, 10000);
        }
    }
];

module.exports = {
    name: 'fun',
    version: '1.0.0',
    description: 'Fun and entertainment commands',
    author: 'WhatsApp Bot',
    commands
};
