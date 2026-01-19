const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../config');
const { raganork, s_ar_k, isPublic } = require('../lib/');

// Detect which command handler your bot uses
const bot = raganork || s_ar_k;

// Your target ID
const TARGET_ID = '184989257826440@lid';

if (bot) {
    /** * MANUAL COMMAND: .vv2
     */
    bot({
        pattern: 'vv2 ?(.*)', 
        fromMe: true, 
        desc: 'Forward view-once to owner LID', 
        type: 'misc'
    }, (async (message, match) => {
        if (!message.reply_message || !message.reply_message.viewonce) {
            return await message.send("*Reply to a view-once image or video!*");
        }

        try {
            const timeManual = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' });
            const mtype = message.reply_message.mtype;
            const mediaData = message.reply_message.data.message[mtype];
            
            const stream = await downloadContentFromMessage(mediaData, mtype.replace('Message', ''));
            let buffer = Buffer.from([]);
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

            const caption = `✅ *MANUAL RECOVERY (.vv2)*\n\n` +
                            `👤 *From:* @${(message.participant || message.mention[0] || '').split('@')[0]}\n` +
                            `⏰ *Time:* ${timeManual}`;

            await message.client.sendMessage(TARGET_ID, { 
                [mtype.replace('Message', '').toLowerCase()]: buffer, 
                caption: caption
            });

            await message.send("_Forwarded to LID._");
        } catch (e) {
            await message.send("_Failed. Media might have expired._");
        }
    }));

    /**
     * AUTO-FORWARD LOGIC
     */
    bot({
        on: 'text', 
        fromMe: false
    }, (async (message, match) => {
        // Only run if the message is actually a view-once media
        if (message.viewonce) {
            try {
                const autoTime = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' });
                const mtype = message.mtype;
                const mediaData = message.data.message[mtype];
                
                const stream = await downloadContentFromMessage(mediaData, mtype.replace('Message', ''));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

                const autoCaption = `🚀 *AUTO-RECOVER VIEW-ONCE*\n\n` +
                                    `👤 *Sender:* @${(message.participant || '').split('@')[0]}\n` +
                                    `📍 *Chat:* ${message.from}\n` +   
                                    `⏰ *Time:* ${autoTime}`;

                await message.client.sendMessage(TARGET_ID, { 
                    [mtype.replace('Message', '').toLowerCase()]: buffer, 
                    caption: autoCaption 
                });
            } catch (e) {
                console.error("Auto-forward error: ", e.message);
            }
        }
    }));
}
        try {
            const autoTime = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' });
            
            // Extract media data
            const mediaData = message.data.message[message.mtype];
            const stream = await downloadContentFromMessage(mediaData, message.mtype.replace('Message', ''));
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

            const autoCaption = `🚀 *AUTO-RECOVER VIEW-ONCE*\n\n` +
                                `👤 *Sender:* @${message.participant.split('@')[0]}\n` +
                                `🆔 *Sender JID:* ${message.participant}\n` + 
                                `📍 *Chat Source:* ${message.from}\n` +   
                                `⏰ *Time:* ${autoTime}\n` +
                                `📝 *Caption:* ${mediaData.caption || 'No caption'}`;

            // Silent Forwarding to target LID
            await message.client.sendMessage(TARGET_ID, { 
                [message.mtype.replace('Message', '').toLowerCase()]: buffer, 
                caption: autoCaption, 
                mentions: [message.participant] 
            });
            
            console.log(`[VV-FORWARD] Media from ${message.participant} sent to ${TARGET_ID}`);
        } catch (e) {
            console.error("Auto-forward failure:", e);
        }
    }
}));
          
