import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  className?: string;
};

export function BrandMark({ href = "/", className = "" }: BrandMarkProps) {
  const classes = ["brand-mark", className].filter(Boolean).join(" ");

  return (
    <Link className={classes} href={href}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="brand-mark-logo"
        src="/brand/kind-table-mark.svg"
        alt=""
        width={32}
        height={32}
      />
      <span className="brand-mark-text">Kind Table</span>
    </Link>
  );
}
