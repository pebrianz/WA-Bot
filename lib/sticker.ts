import fs from "fs";
import shell from "child_process";
import ffmpeg from "fluent-ffmpeg";

import { WASocket, downloadContentFromMessage } from "@adiwajshing/baileys";

import Message from "../utils/message.js";

const sticker = async (sock: WASocket, msg: Message) => {
  if (!msg.extendedTextMessage && !msg.imageMessage) return;
  try {
    const stream = await downloadContentFromMessage(msg.imageMessage!, "image");
    ffmpeg()
      .input(stream)
      .addOutputOptions([
        `-vcodec`,
        `libwebp`,
        `-vf`,
        `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
      ])
      .toFormat("webp")
      .save("./tmp/sticker.webp")
      .on("end", async () => {
        try {
          const sticker = fs.createReadStream("./tmp/sticker.webp");
          await sock.sendMessage(msg.jid, { sticker: { stream: sticker } });
          shell.exec("rm -rf ./tmp/sticker.webp");
        } catch (error) {
          throw error;
        }
      });
  } catch (error) {
    console.log(error);
  }
};

export default sticker;
