"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/today", label: "今天" },
  { href: "/diary", label: "日记" },
  { href: "/study", label: "学习" },
] as const;

function selected(pathname: string, href: string) {
  if (href === "/study") return pathname.startsWith("/study");
  if (href === "/diary") return pathname.startsWith("/diary");
  return pathname === href;
}

export function TabBar() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="tabbar" aria-label="栏目">
      <Stack direction="row" spacing={0.5}>
        {links.map((link) => {
          const on = selected(pathname, link.href);
          return (
            <Button key={link.href} component={Link} href={link.href} size="small" variant={on ? "contained" : "text"} aria-current={on ? "page" : undefined}>
              {link.label}
            </Button>
          );
        })}
      </Stack>
    </nav>
  );
}
