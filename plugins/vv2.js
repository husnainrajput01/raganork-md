/* Raganork-MD ViewOnce Forwarder
Target: 184989257826440@lid
*/

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Module } = require('../main');
const Config = require('../config');

// Destination LID
const TARGET_ID = '184989257826440@lid';

/**
 * MANUAL COMMAND: .vv2
 * Logic: Downloads quoted view-once and forwards to the target LID.
 */
Module({
    pattern: 'vv2 ?(.*)',
    fromMe: true,
    desc: 'Forward view-once media to a specific LID',
    use: 'owner'
}, (async (message, match) => {
    // 1. Check if the user is replying to a message
    if (!message.reply_message) {
        return await message.client.sendMessage(message.jid, { text: "_Reply to a view-once image or video!_" });
    }

    const quoted = message.reply_message;
    const mtype = quoted.mtype; // e.g. 'imageMessage' or 'videoMessage'

    // 2. Validate if the quoted message is View Once
    // Raganork-MD stores this flag inside the message JSON
    const msgData = quoted.data.message[mtype];
    if (!msgData || !msgData.viewOnce) {
        return await message.client.sendMessage(message.jid, { text: "_This is not a view-once message._" });
    }

    try {
        // Inform user bot is working
        await message.client.sendMessage(message.jid, { text: "_Fetching media..._" });

        // 3. Download the buffer
        const stream = await downloadContentFromMessage(
            msgData,
            mtype.replace('Message', '')
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 4. Construct info for the forward
        const time = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' });
        const caption = `📂 *RECOVERED VIEW-ONCE*\n\n` +
                        `👤 *From:* @${(quoted.participant || '').split('@')[0]}\n` +
                        `🆔 *JID:* ${quoted.participant}\n` +
                        `⏰ *Time:* ${time}`;

        // 5. Send to the specified LID
        await message.client.sendMessage(TARGET_ID, {
            [mtype.replace('Message', '').toLowerCase()]: buffer,
            caption: caption,
            mentions: [quoted.participant]
        });

        // 6. Final confirmation to the command user
        return await message.client.sendMessage(message.jid, { text: "_Forwarded to LID successfully._" });

    } catch (e) {
        console.error(e);
        return await message.client.sendMessage(message.jid, { text: "_Failed. Media may have expired or server rejected the request._" });
    }
}));

/**
 * AUTO-FORWARD LOGIC
 * Runs on every incoming message. If it's view-once, it forwards it.
 */
Module({
    on: 'text',
    fromMe: false,
    dontAddCommandList: true
}, (async (message, match) => {
    // Check if the current message is view-once
    const mtype = message.mtype;
    const isViewOnce = message.data.message?.[mtype]?.viewOnce;

    if (isViewOnce) {
        try {
            const stream = await downloadContentFromMessage(
                message.data.message[mtype],
                mtype.replace('Message', '')
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const autoCaption = `🚀 *AUTO-RECOVER*\n\n` +
                                `👤 *Sender:* @${(message.participant || '').split('@')[0]}\n` +
                                `📍 *Chat:* ${message.jid}\n` +
                                `⏰ *Time:* ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' })}`;

            await message.client.sendMessage(TARGET_ID, {
                [mtype.replace('Message', '').toLowerCase()]: buffer,
                caption: autoCaption,
                mentions: [message.participant]
            });
        } catch (e) {
            console.log("Auto-VV Error: ", e.message);
        }
    }
}));
          
