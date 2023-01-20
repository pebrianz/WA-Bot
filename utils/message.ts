import { proto } from "@adiwajshing/baileys";

export default class Message extends proto.WebMessageInfo {
  id: string = "";
  jid: string = "";
  name: string = "";
  fromMe: boolean = false;
  isGroup: boolean = false;
  from: string = "";
  body: string = "";
  constructor(m: proto.IWebMessageInfo) {
    super(m);
    this.id = m.key.id as string;
    this.jid = m.key.remoteJid as string;
    this.name = m.pushName as string;
    this.fromMe = m.key.fromMe as boolean;
    this.isGroup = this.jid?.endsWith("@g.us");
    this.from = this.isGroup ? (m.key.participant as string) : this.jid;
    this.body = m.message?.conversation as string;
  }
}
