import { LayoutGrid } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";
import { IconBrowser } from "@/components/IconBrowser";
import { loadUIIcons } from "@/lib/server/ui-icons";
import { loadUIImagesets } from "@/lib/server/ui-imageset";

export const metadata = {
  title: "UI Icon Browser — Lost Saga Database",
  description:
    "Browse and search every UI sprite icon from Lost Saga, clipped from the game’s sprite sheets.",
};

export default async function IconBrowserPage({
  params,
}: {
  params: Promise<{ server: string }>;
}) {
  const { server: rawServer } = await params;
  const server = resolveServerParam(rawServer);
  const [icons, imagesets] = await Promise.all([
    loadUIIcons(server),
    loadUIImagesets(server),
  ]);

  return (
    <>
      <Breadcrumb items={serverBreadcrumb(server, [{ label: "UI Icon Browser" }])} />

      <div className="ls-section-header mb-4">
        <LayoutGrid className="h-5 w-5" />
        <span>UI Icon Browser</span>
      </div>

      <IconBrowser icons={icons} imagesets={imagesets} />
    </>
  );
}
