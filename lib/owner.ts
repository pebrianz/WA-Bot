import fs from "fs";

import { proto, WASocket } from "@adiwajshing/baileys";

import Message from "../utils/message.js";

const owner = async (sock: WASocket, msg: Message) => {
  try {
    const vcard =
      "BEGIN:VCARD\n" +
      "VERSION:3.0\n" +
      "N:;Pebrianz;;;\n" +
      "FN:Pebrianz\n" +
      "ORG:;\n" +
      "item1.TEL;type=CELL;type=VOICE;waid=6283128977625:+62 831-2897-7625\n" +
      "item1.X-ABLabel:Mobile\n" +
      "END:VCARD";
    const contacts: proto.Message.IContactMessage = {
      displayName: "Pebrianz",
      vcard,
    };
    const contact = await sock.sendMessage(msg.jid, {
      contacts: { contacts: [contacts] },
    });
    const audio = "./database/owner.opus";
    if (!fs.existsSync(audio)) return;
    const stream = fs.createReadStream(audio);
    await sock.sendMessage(msg.jid, { audio: { stream } }, { quoted: contact });
  } catch (error) {
    console.log(error);
  }
};

export default owner;
