import Link from "next/link";

const links = [
  { href: "/today", label: "今天" },
  { href: "/diary", label: "日记" },
  { href: "/study", label: "学习" },
] as const;

export function TabBar() {
  return (
    <nav className="tabbar">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
