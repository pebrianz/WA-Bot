import { readdirSync } from "fs";

const getAllLibIds = async () => {
  const files = readdirSync("./lib/").filter((file) => file.endsWith(".ts"));
  return files.map((file) => {
    // remove .ts
    return file.replace(/.ts$/, "");
  });
};

export default getAllLibIds;
