import { MedalList } from "@/components/MedalList";
import { Breadcrumb } from "@/components/Breadcrumb";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";
import { loadMedalSubTypes, loadMedals } from "@/lib/server/medals";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Medals — Lost Saga Database",
  description:
    "Browse every medal, rank badge, and medal inventory item in Lost Saga.",
};

export default async function MedalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ server: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { server: rawServer } = await params;
  const server = resolveServerParam(rawServer);
  const query = await searchParams;
  const medals = await loadMedals(server);
  const medalSubTypes = await loadMedalSubTypes(server);

  return (
    <>
      <Breadcrumb items={serverBreadcrumb(server, [{ label: "Medals" }])} />

      <div className="ls-section-header mb-4">
        <Shield className="h-5 w-5" />
        <span>Medal Database</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          {medals.length.toLocaleString("en-US")}
        </span>
      </div>

      <MedalList
        medals={medals}
        medalSubTypes={medalSubTypes}
        server={server}
        q={typeof query.q === "string" ? query.q : ""}
        subType={typeof query.subType === "string" ? query.subType : ""}
        hasManual={typeof query.hasManual === "string" ? query.hasManual : ""}
        sort={typeof query.sort === "string" ? query.sort : "id"}
        page={typeof query.page === "string" ? Number(query.page) : 1}
      />
    </>
  );
}
