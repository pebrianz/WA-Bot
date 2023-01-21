import { readdirSync } from "fs";
import path from "path";

const getListLibs = async () => {
  const files = readdirSync(path.join(__dirname, "/../libs/")).filter((file) =>
    file.endsWith(".ts")
  );
  return files.map((file) => {
    // remove .ts
    return file.replace(/.ts$/, "");
  });
};

export default getListLibs;
