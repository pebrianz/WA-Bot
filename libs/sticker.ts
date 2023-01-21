import fs from "fs";
import shell from "child_process";
import ffmpeg from "fluent-ffmpeg";

import { WASocket, downloadContentFromMessage } from "@adiwajshing/baileys";

import Message from "../utils/message";

const sticker = async (conn: WASocket, m: Message) => {
  if (!m.extendedTextMessage && !m.imageMessage) return;
  try {
    let buffer = Buffer.from([]);
    const stream = await downloadContentFromMessage(m.imageMessage!, "image");
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    fs.writeFileSync("./tmp/sticker.png", buffer);

    ffmpeg("./tmp/sticker.png")
      .input("./tmp/sticker.png")
      .addOutputOptions([
        `-vcodec`,
        `libwebp`,
        `-vf`,
        `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
      ])
      .toFormat("webp")
      .save("./tmp/sticker.webp")
      .on("end", async () => {
        const sticker = fs.createReadStream("./tmp/sticker.webp");
        await conn.sendMessage(m.jid, { sticker: { stream: sticker } });
        shell.exec("rm -rf ./tmp/sticker*");
      });
  } catch (error) {
    console.log(error);
  }
};

export default sticker;
