import { WASocket, makeInMemoryStore } from "@adiwajshing/baileys";

import { store } from "../index.js";
import Message from "../utils/message.js";

const del = async (sock: WASocket, msg: Message) => {
  try {
    const jid = msg.isGroup ? msg.jid : msg.contextInfo?.participant;
    const m = await store!.loadMessage(jid!, msg.contextInfo?.stanzaId!);
    if (!m?.key.fromMe) return;
    if (m.status === 1) {
      await sock.sendMessage(msg.jid, {
        delete: { id: msg.contextInfo?.stanzaId },
      });
    } else {
      await sock.sendMessage(
        msg.jid,
        { text: "Pesan bukan berasal dari bot" },
        { quoted: msg }
      );
    }
  } catch (error) {
    throw error;
  }
};

export default del;
