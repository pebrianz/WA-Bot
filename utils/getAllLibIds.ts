import { readdirSync } from "fs";

const getAllLibIds = async () => {
  const files = readdirSync("./lib/").filter((file) => {
    const regex = /^[a-zA-Z].*\.ts$/;
    return regex.test(file);
  });
  return files.map((file) => {
    // remove .ts
    return file.replace(/.ts$/, "");
  });
};

export default getAllLibIds;
