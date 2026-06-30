import { IconCdnBrowser } from "@/components/IconCdnBrowser";
import { Breadcrumb } from "@/components/Breadcrumb";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";
import { Cloud } from "lucide-react";
import { loadIconCdn } from "@/lib/server/icon-cdn";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "LSIcon CDN — Lost Saga Database",
  description:
    "Browse and copy direct URLs for every individual Lost Saga UI icon.",
};

export default async function IconCdnPage({
  params,
}: {
  params: Promise<{ server: string }>;
}) {
  const { server: rawServer } = await params;
  const server = resolveServerParam(rawServer);
  const icons = Object.values(await loadIconCdn(server));
  // eslint-disable-next-line react-hooks/purity -- dynamic per-request shuffle
  const shuffled = [...icons].sort(() => Math.random() - 0.5);

  return (
    <>
      <Breadcrumb items={serverBreadcrumb(server, [{ label: "LSIcon CDN" }])} />

      <div className="ls-section-header mb-4">
        <Cloud className="h-5 w-5" />
        <span>LSIcon CDN</span>
      </div>

      <IconCdnBrowser initialData={shuffled} />
    </>
  );
}
