import { fetchAllHeroes } from "./fetchers/heroes";
import { fetchTextures } from "./fetchers/textures";

async function main(): Promise<void> {
  await fetchAllHeroes();
  await fetchTextures();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
