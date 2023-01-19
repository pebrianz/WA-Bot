import { proto } from "@adiwajshing/baileys";

export default class Message extends proto.WebMessageInfo {
  id?: string | null;
  jid?: string | null;
  name?: string | null;
  fromMe?: boolean | null;
  isGroup?: boolean;
  from?: string | null;
  body?: string | null;
  constructor(m: proto.IWebMessageInfo) {
    super(m);
    this.id = m.key.id;
    this.jid = m.key.remoteJid;
    this.name = m.pushName;
    this.fromMe = m.key.fromMe;
    this.isGroup = this.jid?.endsWith("@g.us");
    this.from = this.isGroup ? m.key.participant : this.jid;
    this.body = m.message?.conversation;
  }
}
