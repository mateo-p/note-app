import { memo } from "react";
import type { Note } from "@/lib/types";
import { colors } from "@/lib/theme";
import { formatDate } from "@/lib/utils";

type Props = Note & {
  onClick: () => void;
}

export default memo(function NoteCard({ title, content, category, updated_at, onClick }: Props) {
  const bg = category?.color ?? colors.bgNote;
  return (
    <div
      onClick={onClick}
      className="relative rounded-xl p-4 cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md overflow-hidden"
      style={{ border: "3px solid " + bg }}
    >
      {/* Background layer — opacity applied here only */}
      <div className="absolute inset-0" style={{ backgroundColor: bg, opacity: 0.5 }} />
      {/* Content layer — sits above the background */}
      <div className="relative">
        <p className="text-xs mb-2" style={{ color: colors.text }}>
          <span className="font-bold mr-2">{formatDate(updated_at)}</span>
          <span className="opacity-75 font-normal">{category?.name}</span>
        </p>
        <h3
          className="font-serif font-bold text-lg leading-snug mb-2"
          style={{ color: colors.textDark, fontFamily: "'Playfair Display', serif" }}
        >
          {title || "Untitled"}
        </h3>
        {content && (
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap break-words line-clamp-6"
            style={{ color: colors.textDeep }}
          >
            {content}
          </p>
        )}
      </div>
    </div>
  );
});
