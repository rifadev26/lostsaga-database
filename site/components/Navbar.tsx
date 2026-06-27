"use client";

import Link from "next/link";
import { useState } from "react";
import { Users, Package, Backpack, Shield, Terminal, Wrench, Menu, X } from "lucide-react";

const navItems = [
  { href: "/heroes", label: "Heroes", sub: "Database", icon: Users },
  { href: "/items", label: "Items", sub: "Compendium", icon: Package },
  { href: "/gears", label: "Gears", sub: "Equipment", icon: Backpack },
  { href: "/medals", label: "Medals", sub: "Collection", icon: Shield },
  { href: "#", label: "Commands", sub: "Macro", icon: Terminal },
  { href: "/tools", label: "Tools", sub: "Utilities", icon: Wrench },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b-[3px] border-[#173046]"
      style={{
        background: "linear-gradient(to bottom, #0c4372, #125ea1)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.14), 0 0 10px -2px rgba(0,0,0,0.5)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1370px] items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-black tracking-tight text-white drop-shadow-md">
            LOST SAGA
          </span>
          <span className="ml-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white">
            DB
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/10"
            >
              <item.icon className="h-4 w-4 text-white/80 transition-transform group-hover:scale-110" />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-white/90">{item.label}</span>
                <span className="text-[10px] text-white/60">{item.sub}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white/20 bg-white/10 text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0c4372] px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/10"
              >
                <item.icon className="h-4 w-4 text-white/80" />
                <span className="text-sm font-bold text-white/90">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
