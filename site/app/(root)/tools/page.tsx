import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  LayoutGrid,
  Wrench,
  Package,
  Backpack,
  Shield,
  Terminal,
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
}

const tools: Tool[] = [
  {
    href: "/tools/icon-browser",
    label: "UI Icon Browser",
    description:
      "Search and inspect every UI sprite icon clipped from the game’s sprite sheets.",
    icon: LayoutGrid,
    available: true,
  },
];

const comingSoon: Tool[] = [
  {
    href: "#",
    label: "Item Compendium",
    description: "Browse every consumable, material, and collectible item.",
    icon: Package,
    available: false,
  },
  {
    href: "#",
    label: "Gear Database",
    description: "Explore hero gear, weapons, and equipment sets.",
    icon: Backpack,
    available: false,
  },
  {
    href: "#",
    label: "Medal Collection",
    description: "Track medals, titles, and achievements.",
    icon: Shield,
    available: false,
  },
  {
    href: "#",
    label: "Command Lookup",
    description: "Search chat commands, emoticons, and macros.",
    icon: Terminal,
    available: false,
  },
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
      {!tool.available && (
        <span className="mt-auto rounded border border-[var(--border)] bg-[#0e1626] px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
          Coming soon
        </span>
      )}
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
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase text-muted-foreground">
          Available
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.label} tool={tool} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase text-muted-foreground">
          Coming soon
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoon.map((tool) => (
            <ToolCard key={tool.label} tool={tool} />
          ))}
        </div>
      </section>
    </>
  );
}
