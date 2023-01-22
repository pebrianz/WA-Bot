import { WASocket } from "@adiwajshing/baileys";

import Message from "../utils/message.js";

const say = async (sock: WASocket, msg: Message) => {
  try {
    const mentions = msg.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const text = msg.body.text?.replace(/.say|. say/, "");
    await msg.sendMessageWTyping(sock, msg.jid, {
      text: text!,
      mentions: mentions,
    });
  } catch (error) {
    console.log(error);
  }
};

export default say;
