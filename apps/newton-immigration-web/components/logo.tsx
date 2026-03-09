import Link from "next/link";
import Image from "next/image";

export function Logo({ darkText = true }: { darkText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image src="/logo.png" alt="Newton Immigration logo" width={40} height={40} className="rounded-md object-contain" />
      <span className={`text-sm font-semibold tracking-wide sm:text-base ${darkText ? "text-newton-dark" : "text-white"}`}>Newton Immigration</span>
    </Link>
  );
}
