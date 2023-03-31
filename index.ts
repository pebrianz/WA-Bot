import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeInMemoryStore,
  MessageRetryMap,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import dotenv from "dotenv";
dotenv.config();

import getAllLibIds from "./utils/getAllLibIds.js";
import MAIN_LOGGER from "./utils/logger.js";
import Message from "./utils/message.js";

// const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const dir = "./tmp";
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const useStore = !process.argv.includes("--no-store");

const logger = MAIN_LOGGER.child({});
logger.level = "silent";

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterMap: MessageRetryMap = {};
console.log("Sedang memeriksa..........");
// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
export const store = useStore ? makeInMemoryStore({ logger }) : undefined;
store?.readFromFile("./tohka_yatogami_store_multi.json");

// save every 10s
setInterval(() => {
  store?.writeToFile("./tohka_yatogami_store_multi.json");
}, 10_000);

async function startSock() {
  try {
    const files = await getAllLibIds();
    console.log(files);
    console.log("Memproses.........");
    const promises = files.map(
      (file) => import(path.join(__dirname, "/lib/", `${file}.js`))
    );
    const libs = await Promise.all(promises);
    console.log("Selesai");
    const { state, saveCreds } = await useMultiFileAuthState(
      "./tohka_yatogami_auth_info"
    );

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

    const socket = makeWASocket.default;
    const sock = socket({
      version,
      logger,
      printQRInTerminal: true,
      browser: ["Tohka Yatogami", "Safari", "3.0"],
      auth: {
        creds: state.creds,
        /** caching makes the store faster to send/recv messages */
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      msgRetryCounterMap,
      getMessage: async (key) => {
        if (store) {
          const msg = await store.loadMessage(key.remoteJid!, key.id!);
          return msg?.message || undefined;
        }
        return {
          conversation: "hello",
        };
      },
    });

    store?.bind(sock.ev);

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
      console.log("connection update", update);
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const message = messages.at(0);
        if (!message) return;
        const msg = new Message(message);
        console.log(msg);
        const prefix = "[>.!/]";
        let t = msg.body.text || "";
        let r = new RegExp(`^(${prefix})`);
        if (!r.test(t!)) return;
//        if ((msg.isGroup && msg.jid !== "120363043888969214@g.us")&&(msg.isGroup && msg.jid !==  '120363047747393581@g.us')&&(msg.isGroup && msg.jid !== '120363044393265188@g.us')) return;
        for (let i = 0; i < files.length; i++) {
          const lib = libs[i].default;
          const regex = new RegExp(`^(${prefix} ?${files[i]})$`);
          const text = msg.body.text!.split(" ");
          const command =
            text.at(1) === files[i]
              ? text.at(0)!.concat(text.at(1)!)
              : text.at(0);
          if (regex.test(command!)) {
            console.log(regex);
            try {
              console.log("Sedang memproses.......");
              sock.sendMessage(
                msg.jid,
                {
                  text: "Sedang memproses.........",
                },
                { quoted: msg }
              );
              await lib(sock, msg);
            } catch (error: any) {
              const e = error.toString();
              await sock.sendMessage(msg.jid, { text: e }, { quoted: msg });
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
    return sock;
  } catch (error) {
    console.log(error);
  }
}

startSock();
