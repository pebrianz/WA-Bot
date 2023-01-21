import path from "path";

import makeWASocket, {
  fetchLatestBaileysVersion,
  MessageRetryMap,
  DisconnectReason,
  makeInMemoryStore,
  useSingleFileAuthState,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";

import MAIN_LOGGER from "./utils/logger";
import Message from "./utils/message";
import getListLibs from "./utils/getListLibs";

const useStore = !process.argv.includes("--no-store");

const logger = MAIN_LOGGER.child({});
logger.level = "silent";

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterMap: MessageRetryMap = {};

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = useStore ? makeInMemoryStore({ logger }) : undefined;
store?.readFromFile("./tohka_yatogami_store_multi.json");
// save every 10s
setInterval(() => {
  store?.writeToFile("./tohka_yatogami_store_multi.json");
}, 10_000);

async function startSock() {
  try {
    const files = await getListLibs();
    console.log(files);

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

    const { state, saveState } = useSingleFileAuthState(
      "./tohka_yatogami.json"
    );

    const store = makeInMemoryStore({
      logger: pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` }),
    });

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: true,
      browser: ["Tohka Yatogami", "Safari", "3.0"],
      auth: state,
      msgRetryCounterMap,
      getMessage: async (key) => {
        if (store) {
          const msg = await store.loadMessage(
            key.remoteJid!,
            key.id!,
            undefined
          );
          return msg?.message || undefined;
        }
        return {
          conversation: "hello",
        };
      },
    });

    store.bind(sock.ev);

    sock.ev.on("creds.update", saveState);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        // reconnect if not logged out
        if (
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut
        ) {
          startSock();
        } else {
          console.log("Connection closed. You are logged out.");
        }
      } else if (connection === "open") {
        console.log("opened connection");
      }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const message = messages.at(0);
        if (!message) return;
        const msg = new Message(message);
        console.log(msg);
        if (
          msg.body.text == "AERO!!!" &&
          msg.jid !== "120363044393265188@g.us"
        ) {
          const { participants } = await sock.groupMetadata(msg.jid);
          sock.sendMessage(msg.jid, {
            text: "AERO!!!!",
            mentions: participants.map((v) => v.id),
          });
        }
        for (const file of files) {
          const { default: lib } = await require(path.join(
            __dirname,
            "/libs/",
            file
          ));
          const regex = new RegExp(`^.${file}|^. ${file}`);
          if (regex.test(msg.body.text!)) {
            await lib(sock, msg);
          }
        }
      } catch (e: any) {
        console.log(e.messages);
      }
    });

    return sock;
  } catch (error) {
    console.log(error);
  }
}

startSock();
