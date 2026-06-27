import fsp from "node:fs/promises";
import path from "node:path";
import { extractIop } from "../lib/iop";

const URL = "https://lostsagakr-cdn.valofe.com/lostsaga_service/client/xml/uiimageset.xml.iop";
const OUT_DIR = path.resolve(process.cwd(), "tmp-iop-test");

async function main(): Promise<void> {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  console.log("Downloading", URL);
  const res = await fetch(URL);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log("Downloaded", buf.length, "bytes");

  console.log("Extracting...");
  // temporary manual extraction debug
  const local = buf;
  const cdPos = local.lastIndexOf(Buffer.from("PK\x05\x06"));
  const preEocd = local.subarray(0, cdPos);
  const firstCd = preEocd.indexOf(Buffer.from("PK\x01\x02"));
  console.log({ cdPos, firstCd, totalLen: local.length });
  const entries = await extractIop(buf);
  console.log("Extracted", entries.length, "entries");

  for (const entry of entries) {
    console.log(" ->", entry.filename, entry.data.length, "bytes", "comment:", JSON.stringify(entry.comment));
    const outPath = path.join(OUT_DIR, path.basename(entry.filename));
    await fsp.writeFile(outPath, entry.data);
    console.log("    saved to", outPath);
    if (entry.filename.endsWith(".xml")) {
      console.log(
        "    first 200 chars:\n",
        new TextDecoder("euc-kr").decode(entry.data).slice(0, 200),
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
