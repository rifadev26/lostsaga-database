import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-2 text-sm"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.label + index} className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            {isLast || !item.href ? (
              <span
                className={`${
                  isLast
                    ? "font-bold text-foreground"
                    : "text-muted-foreground"
                }`}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
