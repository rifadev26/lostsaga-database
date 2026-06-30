import { notFound } from "next/navigation";
import { getServerAlias } from "@/lib/servers";

export function resolveServerParam(alias: string): string {
  const server = getServerAlias(alias);
  if (!server) {
    notFound();
  }
  return server;
}
