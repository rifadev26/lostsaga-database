import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  LayoutGrid,
  Wrench,
  Image,
  Box,
  Play,
  Bone,
  Scroll,
  Medal,
  Layers,
  Key,
  Server,
  Cloud,
} from "lucide-react";

export const metadata = {
  title: "Tools — Lost Saga Database",
  description:
    "A collection of utilities and browsers for Lost Saga assets, items, and data.",
};

interface Tool {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  available: boolean;
  category: string;
}

const allTools: Tool[] = [
  {
    href: "/tools/icon-browser",
    label: "Icon Browser",
    description: "Browse and inspect icons from Lost Saga UI Imagesets.",
    icon: LayoutGrid,
    available: true,
    category: "Asset Conversion",
  },
  {
    href: "#",
    label: "LSC2DDS",
    description: "Convert your GearDesign LSC file into DDS.",
    icon: Image,
    available: false,
    category: "Asset Conversion",
  },
  {
    href: "#",
    label: "MSH to OBJ 3D Converter",
    description: "Convert MSH engine files into 3D .obj formats.",
    icon: Box,
    available: false,
    category: "Asset Conversion",
  },
  {
    href: "#",
    label: "Ani Viewer",
    description: "View and inspect Lost Saga .ani animation files.",
    icon: Play,
    available: false,
    category: "Asset Conversion",
  },
  {
    href: "#",
    label: "SKL Skeleton Viewer",
    description: "Browse bone hierarchy from .skl skeleton files.",
    icon: Bone,
    available: false,
    category: "Asset Conversion",
  },
  {
    href: "/tools/quest-generator",
    label: "Quest Generator",
    description: "Create custom quests for Lost Saga.",
    icon: Scroll,
    available: true,
    category: "Creation Tools",
  },
  {
    href: "#",
    label: "Medal Generator",
    description: "Create custom medals for Lost Saga.",
    icon: Medal,
    available: false,
    category: "Creation Tools",
  },
  {
    href: "#",
    label: "3D Gear Designer",
    description: "Design and customize character gear in a 3D viewer.",
    icon: Layers,
    available: false,
    category: "Creation Tools",
  },
  {
    href: "#",
    label: "Password Generator",
    description: "Encrypt and decrypt passwords for configuration files.",
    icon: Key,
    available: false,
    category: "Developer Utilities",
  },
  {
    href: "#",
    label: "Server ID Generator",
    description: "Convert IP addresses and ports to 64-bit Game Server IDs.",
    icon: Server,
    available: false,
    category: "Developer Utilities",
  },
  {
    href: "#",
    label: "LSIcon CDN",
    description: "Serve Lost Saga PNG textures from a CDN endpoint.",
    icon: Cloud,
    available: false,
    category: "Developer Utilities",
  },
];

const categoryOrder = [
  "Asset Conversion",
  "Creation Tools",
  "Developer Utilities",
];

function ToolCard({ tool }: { tool: Tool }) {
  const content = (
    <div
      className={`ls-card flex h-full flex-col items-start gap-3 p-5 ${
        tool.available
          ? "cursor-pointer"
          : "cursor-not-allowed opacity-60 grayscale"
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[#0b1120]">
        <tool.icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="text-base font-black text-foreground">{tool.label}</h3>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">
          {tool.description}
        </p>
      </div>
      <span
        className={`mt-auto rounded border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase ${
          tool.available
            ? "bg-[#22c55e]/10 text-[#22c55e]"
            : "bg-[#0e1626] text-muted-foreground"
        }`}
      >
        {tool.available ? "Active" : "Coming soon"}
      </span>
    </div>
  );

  if (!tool.available) {
    return <div>{content}</div>;
  }

  return <Link href={tool.href}>{content}</Link>;
}

export default function ToolsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Tools" }]} />

      <div className="ls-section-header mb-6">
        <Wrench className="h-5 w-5" />
        <span>Tools</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          {allTools.filter((t) => t.available).length} / {allTools.length}
        </span>
      </div>

      {categoryOrder.map((category) => {
        const categoryTools = allTools.filter((t) => t.category === category);
        if (categoryTools.length === 0) return null;

        return (
          <section key={category} className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase text-muted-foreground">
              {category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryTools.map((tool) => (
                <ToolCard key={tool.label} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
