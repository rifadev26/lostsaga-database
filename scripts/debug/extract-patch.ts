import fsp from "node:fs/promises";
import path from "node:path";
import { extractIop } from "../lib/iop";

async function main(): Promise<void> {
  const file = process.argv[2] || "data/.cache/server_patch.cfg.iop";
  const buf = await fsp.readFile(path.resolve(file));
  const entries = await extractIop(buf);
  for (const e of entries) {
    console.log(e.filename, e.data.length, "comment:", JSON.stringify(e.comment));
  }
  const cfg = entries.find((e) => e.filename.includes("server_patch.cfg"));
  if (cfg) {
    const text = new TextDecoder("euc-kr").decode(cfg.data);
    await fsp.writeFile("data/.cache/server_patch.cfg", text);
    console.log("\n--- first 80 lines ---");
    console.log(text.split("\n").slice(0, 80).join("\n"));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
