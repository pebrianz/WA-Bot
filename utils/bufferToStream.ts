import { Readable } from "stream";

const bufferToStream = (buffer: Buffer) => {
  const stream = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
  return stream;
};

export default bufferToStream;
