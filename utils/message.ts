import socket, {
  AnyMessageContent,
  MiscMessageGenerationOptions,
  WASocket,
  delay,
} from "@adiwajshing/baileys";

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
  isBaileys: boolean = false;
  extendedTextMessage?: socket.proto.Message.IExtendedTextMessage;
  contextInfo?: socket.proto.IContextInfo;
  imageMessage?: socket.proto.Message.IImageMessage;
  stickerMessage?: socket.proto.Message.IStickerMessage;
  constructor(m: socket.proto.IWebMessageInfo) {
    super(m);
    this.id = m.key.id as string;
    this.jid = m.key.remoteJid as string;
    this.name = m.pushName as string;
    this.fromMe = m.key.fromMe as boolean;
    this.isGroup = this.jid?.endsWith("@g.us");
    this.from = this.isGroup ? (m.key.participant as string) : this.jid;
    this.isBaileys = m.status === 1;
    this.extendedTextMessage = m.message
      ?.extendedTextMessage as socket.proto.Message.IExtendedTextMessage;
    this.contextInfo = m.message?.extendedTextMessage
      ?.contextInfo as socket.proto.ContextInfo;
    this.imageMessage =
      m.message?.imageMessage ||
      (m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        ?.imageMessage as socket.proto.Message.IImageMessage);
    this.stickerMessage = m.message?.extendedTextMessage?.contextInfo
      ?.quotedMessage?.stickerMessage as socket.proto.Message.IStickerMessage;
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
    msg: AnyMessageContent,
    op?: MiscMessageGenerationOptions
  ) {
    await sock.presenceSubscribe(jid);
    await delay(500);

    await sock.sendPresenceUpdate("composing", jid);
    await delay(2000);

    await sock.sendPresenceUpdate("paused", jid);

    await sock.sendMessage(jid, msg, op);
  }
}
