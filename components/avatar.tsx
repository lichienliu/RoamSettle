import type { Person } from "@/lib/mock";

const SIZES = {
  sm: "size-[26px] text-[11px]",
  md: "size-8 text-[13px]",
  lg: "size-[42px] text-base",
  xl: "size-[52px] text-[17px]",
} as const;

export function Avatar({
  person,
  size = "md",
  className = "",
}: {
  person: Person;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const isMe = person.id === "me";
  return (
    <div
      className={`${person.color} ${SIZES[size]} flex flex-none items-center justify-center rounded-[3px] text-white ${
        isMe ? "font-mono font-semibold tracking-wide text-[0.8em]" : "font-bold"
      } ${className}`}
    >
      {person.initial}
    </div>
  );
}
