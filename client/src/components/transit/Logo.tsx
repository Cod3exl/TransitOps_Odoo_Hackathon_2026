import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--primary)" />
      <path
        d="M8 12h16M8 12l4-4m-4 4l4 4M24 20H8m16 0l-4-4m4 4l-4 4"
        stroke="var(--sidebar)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}