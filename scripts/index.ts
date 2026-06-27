import { fetchAllHeroes } from "./fetchers/heroes";
import { fetchTextures } from "./fetchers/textures";
import { fetchItems } from "./fetchers/items";
import { fetchManuals } from "./fetchers/manuals";
import { fetchGears } from "./fetchers/gears";
import { fetchMedals } from "./fetchers/medals";

async function main(): Promise<void> {
  await fetchAllHeroes();
  await fetchTextures();
  await fetchItems();
  await fetchManuals();
  await fetchGears();
  await fetchMedals();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
