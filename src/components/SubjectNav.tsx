"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import type { Subject } from "@/lib/study";

const LINKS: { href: string; label: string; subject: Subject }[] = [
  { href: "/study/business", label: "商业", subject: "business" },
  { href: "/study/english", label: "英语", subject: "english" },
  { href: "/study/thai", label: "泰语", subject: "thai" },
  { href: "/study/cultivation", label: "修身", subject: "cultivation" },
];

export function SubjectNav({ current }: { current: Subject }) {
  return (
    <Stack className="subjects" component="nav" aria-label="学习栏目" direction="row" spacing={0.5}>
      {LINKS.map((link) => (
        <Button
          key={link.href}
          component={Link}
          href={link.href}
          fullWidth
          size="small"
          variant={link.subject === current ? "contained" : "text"}
          aria-current={link.subject === current ? "page" : undefined}
        >
          {link.label}
        </Button>
      ))}
    </Stack>
  );
}
