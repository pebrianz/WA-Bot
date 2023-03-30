import { WASocket, downloadContentFromMessage } from "@adiwajshing/baileys";
import { Sticker, StickerTypes } from "wa-sticker-formatter";

import Message from "../utils/message.js";
import fs from "fs";
import { exec } from "child_process";

const sf = async (sock: WASocket, msg: Message) => {
  try {
    const text = msg.body.text?.replace(/.sf |. sf /, "");
    if(!text) return
    const arr = text.split("|");
    const pack = arr.at(0) || "";
    const author = arr.at(1) || "" ;
    const media = msg.imageMessage || msg.stickerMessage;

    let buffer = Buffer.from([]);
    const stream = await downloadContentFromMessage(media!, "image");
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    fs.writeFileSync("./tmp/sticker.png", buffer);
    const image = fs.readFileSync("./tmp/sticker.png");
    const sticker = new Sticker(image, {
      pack: pack, // The pack name
      author: author, // The author name
      type: StickerTypes.FULL, // The sticker type
      //categories: ["🤩", "🎉"], // The sticker category    id: '123', // The sticker id    quality:0, // The quality of the output file    background: '#000000' // The sticker background color (only for full stickers)})
    });
    const sb = await sticker.toBuffer();
    fs.writeFileSync("./tmp/sticker.webp", sb);
    const ss = fs.createReadStream("./tmp/sticker.webp");
    await sock.sendMessage(msg.jid, { sticker: { stream: ss } },{ quoted: msg });
    exec("rm -rf ./tmp/sticker*");
  } catch (error) {
    console.log(error);
  }
};

export default sf;
