import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

import makeWASocket, {
  fetchLatestBaileysVersion,
  MessageRetryMap,
  DisconnectReason,
  makeInMemoryStore,
  useSingleFileAuthState,
} from "@adiwajshing/baileys";
import {Boom} from "@hapi/boom";

import getAllLibIds from "./utils/getAllLibIds.js";
import MAIN_LOGGER from "./utils/logger.js";
import Message from "./utils/message.js";

// const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const dir = "./tmp";
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const useStore = !process.argv.includes("--no-store");

const logger = MAIN_LOGGER.child({});
logger.level = "silent";

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterMap: MessageRetryMap = {};

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = useStore ? makeInMemoryStore({logger}) : undefined;
store?.readFromFile("./tohka_yatogami_store_multi.json");
// save every 10s
setInterval(() => {
  store?.writeToFile("./tohka_yatogami_store_multi.json");
}, 10_000);

async function startSock() {
  try {
    const files = await getAllLibIds();
    console.log(files);

    const {state, saveState} = useSingleFileAuthState(
      "./tohka_yatogami_auth.json"
    );

    const {version, isLatest} = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

    const socket = makeWASocket.default;
    const sock = socket({
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

    store?.bind(sock.ev);

    sock.ev.on("connection.update", (update) => {
      const {connection, lastDisconnect} = update;
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
      console.log("connection update", update);
    });

    sock.ev.on("creds.update", saveState);

    sock.ev.on("messages.upsert", async ({messages}) => {
      try {
        const message = messages.at(0);
        if (!message) return;
        const msg = new Message(message);
        console.log(msg);
        if (!msg.body.text) return;
        for (const file of files) {
          const {default: lib} = await import(
            path.join(__dirname, "/lib/", `${file}.js`)
          );
          const regex = new RegExp(`^(.${file})|(. ${file})$`);
          const text = msg.body.text!.split(" ");
          const command =
            text.at(1) === file ? text.at(0)!.concat(text.at(1)!) : text.at(0);
          if (regex.test(command!)) {
            await lib(sock, msg);
          }
        }
      } catch (error: any) {
        console.log(error);
      }
    });
    return sock;
  } catch (error) {
    console.log(error);
  }
}

startSock();
