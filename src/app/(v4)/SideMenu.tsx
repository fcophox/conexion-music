"use client";

import { Disc3, House, Music, Search, X, type LucideIcon } from "lucide-react";
import type { MenuItemId } from "./sections";


const ITEMS: { id: MenuItemId; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Inicio", icon: House },
  { id: "music", label: "Música", icon: Music },
  { id: "albums", label: "Discos", icon: Disc3 },
  { id: "x", label: "Experience", icon: X },
];

type Props = {
  active: MenuItemId;
  onChange: (id: MenuItemId) => void;
  // La lupa no cambia de sección: abre el buscador como modal.
  isSearchOpen: boolean;
  onSearch: () => void;
};

const ITEM_CLASS =
  "flex size-10 items-center justify-center rounded-xl transition-[color,background-color,transform] duration-150 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const ACTIVE_CLASS = "text-white";
const IDLE_CLASS = "text-zinc-500 hover:bg-white/5 hover:text-zinc-300";

// Menú lateral flotante (conceptual): una píldora vertical centrada a la izquierda.
export function SideMenu({ active, onChange, isSearchOpen, onSearch }: Props) {
  return (
    <nav
      aria-label="Menú principal"
      className="fixed left-4 top-1/2 z-20 -translate-y-1/2 sm:left-6"
    >
      <ul className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-zinc-900/80 p-1.5 shadow-lg shadow-black/40 backdrop-blur">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id && !isSearchOpen;
          return (
            <li key={id}>
              <button
                type="button"
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onChange(id)}
                className={`${ITEM_CLASS} ${isActive ? ACTIVE_CLASS : IDLE_CLASS}`}
              >
                <Icon className="size-5" strokeWidth={isActive ? 2.25 : 2} />
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            aria-label="Buscar"
            aria-haspopup="dialog"
            aria-expanded={isSearchOpen}
            onClick={onSearch}
            className={`${ITEM_CLASS} ${isSearchOpen ? ACTIVE_CLASS : IDLE_CLASS}`}
          >
            <Search className="size-5" strokeWidth={isSearchOpen ? 2.25 : 2} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
