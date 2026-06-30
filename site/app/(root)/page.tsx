import Link from "next/link";
import { SERVERLIST } from "@/lib/servers";
import { ArrowRight, GitFork, Wrench, Key, Server } from "lucide-react";

export const metadata = {
  title: "Lost Saga Database — Heroes, Gears, Items, Medals & Pets",
};

export default function HomePage() {
  return (
    <>
      {/* Hero intro */}
      <section className="mb-10">
        <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
              Lost Saga
              <span className="block text-[#3b82f6]">Database</span>
            </h1>

            <p className="mt-3 text-lg font-semibold italic text-[#22c55e]">
              All-in-one Lost Saga database and toolset — heroes, gears, items,
              medals, pets, and more.
            </p>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              An open-source community project dedicated to collecting every
              hero, gear, item, and medal from Lost Saga. Built for players, by
              players.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://github.com/rifadev26/lostsaga-database"
                target="_blank"
                rel="noopener noreferrer"
                className="ls-btn-green h-11 gap-2 text-sm"
              >
                <GitFork className="h-4 w-4" /> Contribute
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Servers */}
      <section className="mb-10">
        <div className="ls-section-header mb-4">
          <Server className="h-5 w-5" />
          <span>Servers</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVERLIST.map((server) => (
            <Link
              key={server.alias}
              href={`/${server.alias}`}
              className="group ls-card flex flex-col items-start gap-2 p-5 transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-black text-foreground">
                  {server.name}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                {server.alias}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="mb-10">
        <div className="ls-section-header mb-4">
          <Wrench className="h-5 w-5" />
          <span>Tools</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/tools/pass-generator"
            className="group ls-card flex flex-col items-start gap-2 p-5 transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[#0b1120]">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Password Generator
              </p>
              <p className="text-[10px] uppercase text-muted-foreground">
                Encrypt IOP passwords
              </p>
            </div>
          </Link>

          <Link
            href="/tools/svrid-generator"
            className="group ls-card flex flex-col items-start gap-2 p-5 transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[#0b1120]">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Server ID Generator
              </p>
              <p className="text-[10px] uppercase text-muted-foreground">
                Convert IP/port to Game Server ID
              </p>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
