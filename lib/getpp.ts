import fs from "fs";

import { WASocket } from "@adiwajshing/baileys";
import axios from "axios";

import Message from "../utils/message.js";
import bufferToStream from "../utils/bufferToStream.js";

const getpp = async (sock: WASocket, msg: Message) => {
  try {
    const mentions = msg.contextInfo?.mentionedJid;
    if (!mentions) return;
    // for high res picture
    const ppUrl = await sock.profilePictureUrl(mentions![0], "image");
    try {
      const response = await axios.get(ppUrl!, {
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(response.data);
      const stream = bufferToStream(buffer);

      await sock.sendMessage(msg.jid, { image: { stream } }, { quoted: msg });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

export default getpp;
