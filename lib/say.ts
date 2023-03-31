import { WASocket } from "@adiwajshing/baileys";

import Message from "../utils/message.js";

const say = async (sock: WASocket, msg: Message) => {
  try {
    const mentions = msg.contextInfo?.mentionedJid || [];
    const text = msg.body.text?.replace(/. ?say ?/, "");
    await msg.sendMessageWTyping(sock, msg.jid, {
      text: text!,
      mentions: mentions,
    });
  } catch (error) {
    throw error;
  }
};

export default say;
