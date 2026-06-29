import { LayoutGrid } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { IconBrowser } from "@/components/IconBrowser";
import { loadUIIcons } from "@/lib/server/ui-icons";
import { loadUIImagesets } from "@/lib/server/ui-imageset";

export const metadata = {
  title: "UI Icon Browser — Lost Saga Database",
  description:
    "Browse and search every UI sprite icon from Lost Saga, clipped from the game’s sprite sheets.",
};

export default async function IconBrowserPage() {
  const [icons, imagesets] = await Promise.all([
    loadUIIcons(),
    loadUIImagesets(),
  ]);

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Tools", href: "/tools" },
          { label: "UI Icon Browser" },
        ]}
      />

      <div className="ls-section-header mb-4">
        <LayoutGrid className="h-5 w-5" />
        <span>UI Icon Browser</span>
      </div>

      <IconBrowser icons={icons} imagesets={imagesets} />
    </>
  );
}
