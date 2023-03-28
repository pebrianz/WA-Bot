import socket, {AnyMessageContent, WASocket, delay} from "@adiwajshing/baileys"

interface body {
  text?: string;
}
export default class Message extends socket.proto.WebMessageInfo {
  id: string = "";
  jid: string = "";
  name: string = "";
  fromMe: boolean = false;
  isGroup: boolean = false;
  from: string = "";
  body: body;
  extendedTextMessage?:socket.proto.Message.IExtendedTextMessage;
  imageMessage?: socket.proto.Message.IImageMessage;
  constructor(m: socket.proto.IWebMessageInfo) {
    super(m);
    this.id = m.key.id as string;
    this.jid = m.key.remoteJid as string;
    this.name = m.pushName as string;
    this.fromMe = m.key.fromMe as boolean;
    this.isGroup = this.jid?.endsWith("@g.us");
    this.from = this.isGroup ? (m.key.participant as string) : this.jid;
    this.extendedTextMessage = m.message
      ?.extendedTextMessage as socket.proto.Message.IExtendedTextMessage;
    this.imageMessage =
      m.message?.imageMessage ||
      (m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        ?.imageMessage as socket.proto.Message.IImageMessage);
    this.body = {
      text:
        (m.message?.conversation as string) ||
        (m.message?.extendedTextMessage?.text as string) ||
        (m.message?.imageMessage?.caption as string),
    };
  }
  async sendMessageWTyping(
    sock: WASocket,
    jid: string,
    msg: AnyMessageContent
  ) {
    await sock.presenceSubscribe(jid);
    await delay(500);

    await sock.sendPresenceUpdate("composing", jid);
    await delay(2000);

    await sock.sendPresenceUpdate("paused", jid);

    await sock.sendMessage(jid, msg);
  }
}
