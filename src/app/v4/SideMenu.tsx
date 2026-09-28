"use client";

import { Disc3, House, Music, Search, X, type LucideIcon } from "lucide-react";

export type MenuItemId = "home" | "music" | "albums" | "x" | "search";

const ITEMS: { id: MenuItemId; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Inicio", icon: House },
  { id: "music", label: "Música", icon: Music },
  { id: "albums", label: "Discos", icon: Disc3 },
  { id: "x", label: "X", icon: X },
  { id: "search", label: "Buscar", icon: Search },
];

type Props = {
  active: MenuItemId;
  onChange: (id: MenuItemId) => void;
};

// Menú lateral flotante (conceptual): una píldora vertical centrada a la izquierda.
export function SideMenu({ active, onChange }: Props) {
  return (
    <nav
      aria-label="Menú principal"
      className="fixed left-4 top-1/2 z-20 -translate-y-1/2 sm:left-6"
    >
      <ul className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-zinc-900/80 p-1.5 shadow-lg shadow-black/40 backdrop-blur">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          const stateClass = isActive
            ? "text-white"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300";
          return (
            <li key={id}>
              <button
                type="button"
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onChange(id)}
                className={`flex size-10 items-center justify-center rounded-xl transition-[color,background-color,transform] duration-150 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${stateClass}`}
              >
                <Icon className="size-5" strokeWidth={isActive ? 2.25 : 2} />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
