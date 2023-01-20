import makeWASocket, {
  fetchLatestBaileysVersion,
  MessageRetryMap,
  DisconnectReason,
  makeInMemoryStore,
  useSingleFileAuthState,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";

import { readdirSync } from "fs";
import path, { basename } from "path";

import Message from "./utils/message";
import MAIN_LOGGER from "./utils/logger";

(async () => {
  const files = readdirSync(path.join(__dirname, "/libs/")).filter((file) =>
    file.endsWith(".ts")
  );
  console.log(files);
  console.log(basename(__filename));
})();

const useStore = !process.argv.includes("--no-store");
const doReplies = !process.argv.includes("--no-reply");

const logger = MAIN_LOGGER.child({});
logger.level = "silent";
const msgRetryCounterMap: MessageRetryMap = {};

const store = useStore ? makeInMemoryStore({ logger }) : undefined;
store?.readFromFile("./tohka_yatogami_store_multi.json");

setInterval(() => {
  store?.writeToFile("./tohka_yatogami_store_multi.json");
}, 10_000);

async function connectToWhatsApp() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const { state, saveState } = useSingleFileAuthState("./tohka_yatogami.json");

  const store = makeInMemoryStore({
    logger: pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` }),
  });

  const client = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,
    browser: ["Tohka Yatogami", "Safari", "3.0"],
    auth: state,
    msgRetryCounterMap,
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
      console.log(message);
      const msg = new Message(message);
      if (msg.body == "test") {
        client.sendMessage(msg.jid, { text: "helo" });
      }
    } catch (e: any) {
      console.error(e.messages);
    }
  });
  return client;
}

connectToWhatsApp();
