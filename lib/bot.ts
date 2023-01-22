import fs from "fs";

import { WASocket } from "@adiwajshing/baileys";

import Message from "../utils/message.js";

const bot = async (sock: WASocket, msg: Message) => {
  const audio = "./database/bot.opus";
  if (!fs.existsSync(audio)) return;
  const stream = fs.createReadStream(audio);
  await sock.sendMessage(msg.jid, { audio: { stream } }, { quoted: msg });
};

export default bot;
