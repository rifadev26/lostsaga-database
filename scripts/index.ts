import { fetchAllHeroes } from "./fetchers/heroes";
import { fetchTextures } from "./fetchers/textures";
import { fetchItems } from "./fetchers/items";
import { fetchManuals } from "./fetchers/manuals";
import { fetchGears } from "./fetchers/gears";
import { fetchMedals } from "./fetchers/medals";
import { fetchPets } from "./fetchers/pets";
import { fetchQuests } from "./fetchers/quests";

async function main(): Promise<void> {
  await fetchAllHeroes();
  await fetchTextures();
  await fetchItems();
  await fetchManuals();
  await fetchGears();
  await fetchMedals();
  await fetchPets();
  await fetchQuests();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
