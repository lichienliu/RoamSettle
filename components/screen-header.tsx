import Link from "next/link";

/**
 * Top bar used on sub-screens: back affordance on the left, a mono
 * breadcrumb in the middle, an optional action on the right.
 */
export function ScreenHeader({
  backHref,
  backLabel = "← Back",
  title,
  right,
}: {
  backHref: string;
  backLabel?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-3.5">
      <Link href={backHref} className="text-sm font-medium text-ash">
        {backLabel}
      </Link>
      <div className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash uppercase">
        {title}
      </div>
      {right ?? <div className="w-10" />}
    </div>
  );
}
