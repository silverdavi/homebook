"use client";

import Link from "next/link";
import { LifeBuoy } from "lucide-react";

interface Props {
  href: string;
  onUsed: () => void;
}

export function HelpLink({ href, onUsed }: Props) {
  return (
    <Link
      href={href}
      target="_blank"
      onClick={onUsed}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
    >
      <LifeBuoy className="w-3.5 h-3.5" />
      Need help? Open the lesson in a new tab.
    </Link>
  );
}
