import Image from "next/image";
import coffeeImg from "@/assets/coffe.png";
import { colors } from "@/lib/theme";

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-20">
      <Image src={coffeeImg} alt="Coffee" className="w-44 h-44 object-contain" />
      <p className="text-center text-base" style={{ color: colors.textMuted }}>
        I&apos;m just here waiting for your charming notes...
      </p>
    </div>
  );
}
