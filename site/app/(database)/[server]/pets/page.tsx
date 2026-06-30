import { PetList } from "@/components/PetList";
import { Breadcrumb } from "@/components/Breadcrumb";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";
import { loadPetRanks, loadPets } from "@/lib/server/pets";
import { Bone } from "lucide-react";

export const metadata = {
  title: "Pets — Lost Saga Database",
  description:
    "Browse every pet, rank, and pet ability in Lost Saga.",
};

export default async function PetsPage({
  params,
  searchParams,
}: {
  params: Promise<{ server: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { server: rawServer } = await params;
  const server = resolveServerParam(rawServer);
  const query = await searchParams;
  const pets = await loadPets(server);
  const petRanks = await loadPetRanks(server);

  return (
    <>
      <Breadcrumb items={serverBreadcrumb(server, [{ label: "Pets" }])} />

      <div className="ls-section-header mb-4">
        <Bone className="h-5 w-5" />
        <span>Pet Database</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          {pets.length.toLocaleString("en-US")}
        </span>
      </div>

      <PetList
        pets={pets}
        petRanks={petRanks}
        server={server}
        q={typeof query.q === "string" ? query.q : ""}
        baseRank={typeof query.baseRank === "string" ? query.baseRank : ""}
        maxRank={typeof query.maxRank === "string" ? query.maxRank : ""}
        sort={typeof query.sort === "string" ? query.sort : "id"}
        page={typeof query.page === "string" ? Number(query.page) : 1}
      />
    </>
  );
}
