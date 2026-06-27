import { IconBrowser } from "@/components/IconBrowser";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LayoutGrid } from "lucide-react";

export const metadata = {
  title: "UI Icon Browser — Lost Saga Database",
  description:
    "Browse and search every UI sprite icon from Lost Saga, clipped from the game’s sprite sheets.",
};

export default function IconBrowserPage() {
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

      <IconBrowser />
    </>
  );
}
