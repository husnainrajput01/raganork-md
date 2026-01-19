/* Copyright (C) 2022 Sourav KL11.
Raganork MD - Isolated ViewOnce Forwarder
*/

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Module } = require('../main');
const Config = require('../config');

// The target ID
const TARGET_ID = '184989257826440@lid';

Module({
    pattern: 'vv2 ?(.*)', 
    fromMe: true, 
    desc: 'Forward view-once to owner LID', 
    use: 'owner'
}, (async (message, match) => {
    // 1. Check if it's a reply
    if (!message.reply_message) return await message.sendReply("*Reply to a view-once message!*");

    try {
        const quoted = message.reply_message;
        const mtype = quoted.mtype;
        
        // 2. Deep check for view-once data
        const viewOnceData = quoted.data.message[mtype];
        
        if (!viewOnceData || !viewOnceData.viewOnce) {
            return await message.sendReply("*This is not a view-once message.*");
        }

        // 3. Download the media
        const stream = await downloadContentFromMessage(viewOnceData, mtype.replace('Message', ''));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 4. Send to the LID
        const caption = `✅ *RECOVERED*\n👤 *From:* @${(quoted.participant || '').split('@')[0]}`;
        
        await message.client.sendMessage(TARGET_ID, { 
            [mtype.replace('Message', '').toLowerCase()]: buffer, 
            caption: caption,
            mentions: [quoted.participant]
        });

        await message.sendReply("_Forwarded to your LID successfully._");

    } catch (e) {
        console.error(e);
        await message.sendReply("_Error: Could not retrieve media._");
    }
}));
    } catch (e) {
        await message.sendReply("_Failed to retrieve media._");
    }
}));

// --- 2. AUTO-FORWARD LOGIC ---
Module({
    on: 'text', 
    fromMe: false,
    dontAddCommandList: true
}, (async (message, match) => {
    // Extracting the message type and deep checking for the viewOnce flag
    const mtype = message.mtype;
    const msg = message.data.message?.[mtype];
    
    if (msg?.viewOnce || message.viewonce) {
        try {
            const stream = await downloadContentFromMessage(msg, mtype.replace('Message', ''));
            let buffer = Buffer.from([]);
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

            const autoCaption = `🚀 *AUTO-RECOVER*\n👤 *Sender:* @${(message.participant || '').split('@')[0]}\n📍 *Chat:* ${message.jid}`;

            await message.client.sendMessage(TARGET_ID, { 
                [mtype.replace('Message', '').toLowerCase()]: buffer, 
                caption: autoCaption,
                mentions: [message.participant]
            });
        } catch (e) {
            console.log("Auto-forward error: ", e.message);
        }
    }
}));
