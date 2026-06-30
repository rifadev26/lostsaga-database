import { Server } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ServerIdGenerator } from "@/components/ServerIdGenerator";

export const metadata = {
  title: "Server ID Generator — Lost Saga Database",
  description:
    "Convert an IP address and port into a 64-bit Game Server ID, or decode a Game Server ID back to IP and port.",
  openGraph: {
    title: "Server ID Generator — Lost Saga Database",
    description:
      "Convert IP:Port to 64-bit Game Server ID and vice versa for Lost Saga.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Server ID Generator — Lost Saga Database",
    description:
      "Convert IP:Port to 64-bit Game Server ID and vice versa for Lost Saga.",
  },
};

export default function ServerIdGeneratorPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Tools", href: "/tools" },
          { label: "Server ID Generator" },
        ]}
      />

      <div className="ls-section-header mb-4">
        <Server className="h-5 w-5" />
        <span>Server ID Generator</span>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Convert an IPv4 address and port number into the 64-bit Game Server ID
        used by Lost Saga, or extract the IP and port from an existing server
        ID.
      </p>

      <ServerIdGenerator />
    </>
  );
}
