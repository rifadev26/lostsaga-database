import { Key } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { IopPasswordGenerator } from "@/components/IopPasswordGenerator";

export const metadata = {
  title: "IOP Password Generator — Lost Saga Database",
  description:
    "Encrypt and decrypt IOP archive passwords used by the LSAutoUpgrade and PatchManager modules. Supports known locale presets and custom passwords.",
  openGraph: {
    title: "IOP Password Generator — Lost Saga Database",
    description:
      "Encrypt and decrypt IOP archive passwords used by LSAutoUpgrade and PatchManager.",
  },
  twitter: {
    card: "summary_large_image",
    title: "IOP Password Generator — Lost Saga Database",
    description:
      "Encrypt and decrypt IOP archive passwords used by LSAutoUpgrade and PatchManager.",
  },
};

export default function PassGeneratorPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Tools", href: "/tools" },
          { label: "Password Generator" },
        ]}
      />

      <div className="ls-section-header mb-4">
        <Key className="h-5 w-5" />
        <span>Password Generator</span>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Encrypt a plaintext IOP password into the signed byte arrays used by the
        LSAutoUpgrade and PatchManager executables, or decrypt a known encoded
        array back to plaintext. The presets are taken directly from the local
        source files.
      </p>

      <IopPasswordGenerator />
    </>
  );
}
