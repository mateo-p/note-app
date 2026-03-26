import type { Note, Category } from "@/lib/types";
import { colors } from "@/lib/theme";

type Props = {
  notes: Note[];
  categories: Category[];
  selected: Category | null;
  onSelect: (cat: Category | null) => void;
}

export default function CategorySidebar({ notes, categories, selected, onSelect }: Props) {
  const countMap = new Map<number, number>();
  for (const n of notes) {
    if (n.category) countMap.set(n.category.id, (countMap.get(n.category.id) ?? 0) + 1);
  }

  return (
    <nav className="w-44 shrink-0 pt-8 pl-6 pr-4">
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: colors.textMuted }}>
        All Categories
      </p>
      <ul className="flex flex-col gap-2">
        {categories.map((cat) => {
          const count = countMap.get(cat.id) ?? 0;
          return (
            <li key={cat.id}>
              <button
                onClick={() => onSelect(selected?.id === cat.id ? null : cat)}
                className="flex items-center gap-2 w-full text-left text-sm py-0.5 hover:opacity-70 transition-opacity"
                style={{ color: colors.text, fontWeight: selected?.id === cat.id ? 700 : 400 }}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1">{cat.name}</span>
                {count > 0 && <span className="text-xs" style={{ color: colors.textMuted }}>{count}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
