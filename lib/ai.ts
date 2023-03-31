import { WASocket } from "@adiwajshing/baileys";
import { Configuration, OpenAIApi } from "openai";

import Message from "../utils/message.js";

const ai = async (sock: WASocket, msg: Message) => {
  try {
    const text = msg.body.text?.replace(/.ai |. ai /, "");

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_SECRET_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text! }],
    });

    const content = response?.data?.choices[0]?.message?.content || "";
    await msg.sendMessageWTyping(
      sock,
      msg.jid,
      {
        text: content,
      },
      { quoted: msg }
    );
  } catch (error) {
    throw error;
  }
};

export default ai;
