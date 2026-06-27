import { MedalList } from "@/components/MedalList";
import { medals, medalSubTypes } from "@/lib/server/medals";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Medals — Lost Saga Database",
  description:
    "Browse every medal, rank badge, and medal inventory item in Lost Saga.",
};

export default function MedalsPage() {
  return (
    <>
      <div className="ls-section-header mb-4">
        <Shield className="h-5 w-5" />
        <span>Medal Database</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          {medals.length.toLocaleString("en-US")}
        </span>
      </div>

      <MedalList medals={medals} medalSubTypes={medalSubTypes} />
    </>
  );
}
