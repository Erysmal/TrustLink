import Link from "next/link";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "Create a deal", href: "/create" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "How it works", href: "/#how-it-works" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "GitHub", href: "#" },
      { label: "Smart contract", href: "#" },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: "Discord", href: "#" },
      { label: "Twitter / X", href: "#" },
      { label: "Email us", href: "mailto:hello@trustlink.xyz" },
    ],
  },
];

const tags = ["Arbitrum", "USDC", "Open Source"];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080D1A]">
      <div className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div>
            <Link href="/" className="text-sm font-semibold tracking-[0.22em] text-white">
              TRUSTLINK
            </Link>
            <p className="mt-4 max-w-[220px] text-sm leading-6 text-slate-400">
              Escrow-backed USDC deals with clear milestones and fast, trustless release.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-start gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} TrustLink. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
