import path from "path";
import { readFile } from "fs/promises";
import { IconCdnBrowser } from "@/components/IconCdnBrowser";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Cloud } from "lucide-react";
import type { IconCdnEntry } from "@/lib/ui-icons";

export const metadata = {
  title: "LSIcon CDN — Lost Saga Database",
  description:
    "Browse and copy direct CDN URLs for every individual Lost Saga UI icon.",
};

export default async function IconCdnPage() {
  const filePath = path.join(process.cwd(), "..", "data", "icon-cdn.json");
  const raw = await readFile(filePath, "utf-8");
  const icons = JSON.parse(raw) as IconCdnEntry[];

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Tools", href: "/tools" },
          { label: "LSIcon CDN" },
        ]}
      />

      <div className="ls-section-header mb-4">
        <Cloud className="h-5 w-5" />
        <span>LSIcon CDN</span>
      </div>

      <IconCdnBrowser initialData={icons} />
    </>
  );
}
