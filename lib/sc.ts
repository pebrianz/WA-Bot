import { WASocket } from "@adiwajshing/baileys";

import Message from "../utils/message.js";

const sc = async (sock: WASocket, msg: Message) => {
  try {
    const url = "https://github.com/pebrianz/TohkaYatogami-Bot";
    await sock.sendMessage(msg.jid, { text: url });
  } catch (error) {
    throw error;
  }
};

export default sc;
