"use client";

import { useRef, useState, useEffect } from "react";
import type { Category } from "@/lib/types";
import { colors } from "@/lib/theme";

type Props = {
  categories: Category[];
  selected?: Category | null;
  onSelect: (cat: Category) => void;
  align?: "left" | "right";
  trigger?: React.ReactNode;
}

export default function CategoryDropdown({
  categories,
  selected,
  onSelect,
  align = "left",
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const options = selected
    ? categories.filter((c) => c.id !== selected.id)
    : categories;

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        {trigger ?? (
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
            style={{
              border: `1.5px solid ${colors.border}`,
              backgroundColor: colors.bg,
              color: colors.text,
            }}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: selected?.color ?? colors.bgNote }}
            />
            {selected?.name ?? "No category"}
            <svg
              className="w-4 h-4 ml-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {/* Menu */}
      {open && options.length > 0 && (
        <div
          className={`absolute top-full mt-1 rounded-xl py-1 shadow-lg z-10 min-w-[160px] ${align === "right" ? "right-0" : "left-0"}`}
          style={{
            backgroundColor: colors.bgLight,
            border: `1px solid ${colors.borderLight}`,
          }}
        >
          {options.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { onSelect(cat); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:opacity-70 text-left"
              style={{ color: colors.text }}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
