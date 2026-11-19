"use client";

import Link from "next/link";
import type { Subject } from "@/lib/study";

const LINKS: { href: string; label: string; subject: Subject }[] = [
  { href: "/study/business", label: "商业", subject: "business" },
  { href: "/study/english", label: "英语", subject: "english" },
  { href: "/study/thai", label: "泰语", subject: "thai" },
  { href: "/study/cultivation", label: "修身", subject: "cultivation" },
];

export function SubjectNav({ current, done = [] }: { current: Subject; done?: Subject[] }) {
  return (
    <nav className="subjects" aria-label="学习栏目">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} aria-current={link.subject === current ? "page" : undefined}>
          {link.label}
          {done.includes(link.subject) ? <i className="done-mark" aria-hidden="true" /> : <i className="done-mark pending" aria-hidden="true" />}
        </Link>
      ))}
    </nav>
  );
}
