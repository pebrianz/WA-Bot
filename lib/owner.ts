import fs from "fs";

import { proto, WASocket } from "@adiwajshing/baileys";

import Message from "../utils/message.js";

const owner = async (sock: WASocket, msg: Message) => {
  try {
    const vcard =
      "BEGIN:VCARD\n" +
      "VERSION:3.0\n" +
      "FN:Pebrianz\n" +
      "ORG:;\n" +
      "TEL;type=CELL;type=VOICE;waid=6283128977625:+62 831-2897-7625\n" +
      "END:VCARD";
    const contacts: proto.Message.IContactMessage = {
      displayName: "Pebrianz",
      vcard,
    };
    const contact = await sock.sendMessage(
      msg.jid,
      {
        contacts: { contacts: [contacts] },
      },
      { quoted: msg }
    );
    const audio = "./database/owner.opus";
    if (!fs.existsSync(audio)) return;
    const stream = fs.createReadStream(audio);
    const vn = await sock.sendMessage(
      msg.jid,
      { audio: { stream }, ptt: true },
      { quoted: contact }
    );
    const sticker = "./database/sticker-cute.webp";
    if (!fs.existsSync(sticker)) return;
    const ss = fs.createReadStream(sticker);
    await sock.sendMessage(
      msg.jid,
      { sticker: { stream: ss } },
      { quoted: vn }
    );
  } catch (error) {
    throw error;
  }
};

export default owner;
