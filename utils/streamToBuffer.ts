import internal from "stream";

const streamToBuffer = async (stream: internal.Readable) => {
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
};

export default streamToBuffer;
