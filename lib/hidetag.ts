import { WASocket } from "@adiwajshing/baileys";

import Message from "../utils/message.js";

const hidetag = async (sock: WASocket, msg: Message) => {
if(msg.from !== '6283128977625@s.whatsapp.net') return
  try {
    const text = msg.body.text?.replace(/.hidetag|. hidetag/, "");
    const { participants } = await sock.groupMetadata(msg.jid);
    await sock.sendMessage(msg.jid, {
      text: text!,
      mentions: participants.map((p) => p.id),
    });
  } catch (error) {
    console.log(error);
  }
};

export default hidetag;
