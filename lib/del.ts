import { WASocket, makeInMemoryStore } from "@adiwajshing/baileys";
import { store } from "../index.js";
import Message from "../utils/message.js";

const del = async (sock: WASocket, msg: Message) => {
  try {
    const jid = msg.isGroup
      ? msg.jid
      : msg.extendedTextMessage?.contextInfo?.participant;
    const m = await store!.loadMessage(
      jid!,
      msg.extendedTextMessage?.contextInfo?.stanzaId!
    );
    console.log(m);
    if (!m) return;
    if (!m.key.fromMe) return;
    if (m.status === 1) {
      await sock.sendMessage(msg.jid, {
        delete: { id: msg.extendedTextMessage?.contextInfo?.stanzaId },
      });
    } else {
      await sock.sendMessage(
        msg.jid,
        { text: "Pesan bukan berasal dari bot" },
        { quoted: msg }
      );
    }
  } catch (error) {
    console.log(error);
  }
};

export default del;
