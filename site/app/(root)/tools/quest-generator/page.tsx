import { Scroll } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { QuestGenerator } from "@/components/QuestGenerator";

export const metadata = {
  title: "Quest Generator — Lost Saga Database",
  description:
    "Generate custom Lost Saga quest INI entries for private servers and mods. Build quests, objectives, rewards, and export ready-to-use sp2_quest_info.ini snippets.",
  openGraph: {
    title: "Quest Generator — Lost Saga Database",
    description:
      "Generate custom Lost Saga quest INI entries for private servers and mods. Build quests, objectives, rewards, and export ready-to-use sp2_quest_info.ini snippets.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quest Generator — Lost Saga Database",
    description:
      "Generate custom Lost Saga quest INI entries for private servers and mods.",
  },
};

export default function QuestGeneratorPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Tools", href: "/tools" },
          { label: "Quest Generator" },
        ]}
      />

      <div className="ls-section-header mb-4">
        <Scroll className="h-5 w-5" />
        <span>Quest Generator</span>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Build a custom{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">[questN]</code>{" "}
        section for Lost Saga. Edit the fields on the left and copy or download
        the generated INI snippet on the right.
      </p>

      <QuestGenerator />
    </>
  );
}
