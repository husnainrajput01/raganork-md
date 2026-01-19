const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Module } = require('../main');

const TARGET_ID = '184989257826440@lid';

// --- 1. MANUAL COMMAND (.vv2) ---
Module({
    pattern: 'vv2 ?(.*)', 
    fromMe: true, 
    desc: 'Forward view-once to owner LID', 
    use: 'owner'
}, (async (message, match) => {
    // Look for view-once in the quoted message
    const quoted = message.reply_message;
    if (!quoted) return await message.sendReply("*Reply to a view-once message!*");

    // Deep check for viewOnce flag
    const mtype = quoted.mtype;
    const isViewOnce = quoted.data.message[mtype]?.viewOnce || quoted.viewonce;

    if (!isViewOnce) return await message.sendReply("*This is not a view-once message.*");

    try {
        await message.sendReply("_Processing..._");
        const mediaData = quoted.data.message[mtype];
        const stream = await downloadContentFromMessage(mediaData, mtype.replace('Message', ''));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

        const caption = `✅ *MANUAL RECOVERY (.vv2)*\n👤 *From:* @${(quoted.participant || '').split('@')[0]}`;

        await message.client.sendMessage(TARGET_ID, { 
            [mtype.replace('Message', '').toLowerCase()]: buffer, 
            caption: caption,
            mentions: [quoted.participant]
        });
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
