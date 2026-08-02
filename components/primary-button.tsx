import Link from "next/link";

export function PrimaryButton({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const look =
    variant === "solid"
      ? "bg-cobalt p-[18px] font-bold text-white"
      : "border-[1.5px] border-ink p-[15px] font-semibold text-ink";
  return (
    <Link href={href} className={`block text-center text-base ${look} ${className}`}>
      {children}
    </Link>
  );
}
