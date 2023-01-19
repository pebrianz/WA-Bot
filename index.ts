import makeWASocket, {
  fetchLatestBaileysVersion,
  useSingleFileAuthState,
  DisconnectReason,
  makeInMemoryStore,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import { readdirSync } from "fs";
import path from "path";

import Message from "./utils/message";

(async () => {
  const files = readdirSync(path.join(__dirname, "/libs/"));
  console.log(files);
})();

async function connectToWhatsApp() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const { state, saveState } = useSingleFileAuthState("./tohka-yatogami.json");

  const store = makeInMemoryStore({
    logger: pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` }),
  });

  const client = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    browser: ["Tohka Yatogami", "Safari", "3.0"],
    auth: state,
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid!, key.id!, undefined);
        return msg?.message || undefined;
      }
      return {
        conversation: "hello",
      };
    },
  });

  store.bind(client.ev);

  client.ev.on("creds.update", saveState);

  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (!lastDisconnect) return;
      const reason = (lastDisconnect.error as Boom)?.output?.statusCode;
      console.log(
        "connection closed due to ",
        lastDisconnect.error,
        ", reconnecting ",
        reason
      );
      if (reason === DisconnectReason.connectionClosed) {
        connectToWhatsApp();
      }
      if (reason === DisconnectReason.connectionLost) {
        connectToWhatsApp();
      }
      if (reason === DisconnectReason.timedOut) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("opened connection");
    }
  });

  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const message = messages.at(0);
      if (!message) return;
      if (!message.key.id) return;
      console.log(message);
      const msg = new Message(message);
    } catch (e: any) {
      console.error(e.messages);
    }
  });
  return client;
}

connectToWhatsApp();
