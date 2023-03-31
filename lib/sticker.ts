import { WASocket, downloadContentFromMessage } from "@adiwajshing/baileys";
import { Sticker, StickerTypes } from "wa-sticker-formatter";

import Message from "../utils/message.js";
import streamToBuffer from "../utils/streamToBuffer.js";
import bufferToStream from "../utils/bufferToStream.js";

const sticker = async (sock: WASocket, msg: Message) => {
  try {
    const text = msg.body.text?.replace(/. ?sticker ?/, "");
    const arr = text!.split("|")
    const pack = arr.at(0) || "";
    const author = arr.at(1) || "";
    const media = msg.imageMessage || msg.stickerMessage;

    const mediaStream = await downloadContentFromMessage(media!, "image");
    const mediaBuffer = await streamToBuffer(mediaStream);

    const sticker = new Sticker(mediaBuffer, {
      pack: pack, // The pack name
      author: author, // The author name
      type: StickerTypes.FULL, // The sticker type
    });

    const buffer = await sticker.toBuffer();
    const stream = bufferToStream(buffer);

    await sock.sendMessage(msg.jid, { sticker: { stream } }, { quoted: msg });
  } catch (error) {
    throw error;
  }
};

export default sticker;
