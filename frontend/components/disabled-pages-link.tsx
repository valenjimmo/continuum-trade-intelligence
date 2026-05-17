import Link from "next/link";

export function DisabledPagesLink() {
  return (
    <Link href="/disabled-pages" className="text-xs font-medium text-ink/35 transition hover:text-ink/65">
      disabled pages
    </Link>
  );
}
