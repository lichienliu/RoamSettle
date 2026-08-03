export type AvatarPerson = {
  id?: string;
  name: string;
  initial?: string;
  color?: string;
};

const SIZES = {
  sm: "size-[26px] text-[11px]",
  md: "size-8 text-[13px]",
  lg: "size-[42px] text-base",
  xl: "size-[52px] text-[17px]",
} as const;

// 真資料成員沒有指定色時,依名字雜湊從調色盤取色(同名恆同色)
const PALETTE = ["bg-cobalt", "bg-gain", "bg-tangerine", "bg-violet", "bg-darkline"];

function colorFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({
  person,
  size = "md",
  className = "",
}: {
  person: AvatarPerson;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const isMe = person.id === "me";
  const color = person.color ?? (isMe ? "bg-ink" : colorFor(person.name));
  const initial =
    person.initial ?? (isMe ? "ME" : person.name.slice(0, 1).toUpperCase());
  return (
    <div
      className={`${color} ${SIZES[size]} flex flex-none items-center justify-center rounded-[3px] text-white ${
        isMe ? "font-mono font-semibold tracking-wide text-[0.8em]" : "font-bold"
      } ${className}`}
    >
      {initial}
    </div>
  );
}
