import Link from "next/link";

import { cn } from "@/lib/cn";

import type { NavigationListProps } from "./type";

const BottomNavigationBar: React.FC<NavigationListProps> = ({
  navItems,
  pathname,
  onLinkClick,
  className,
}) => {
  if (!navItems?.length) {
    return null;
  }

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex border-t border-surface2 bg-bg/95 px-2 py-2 shadow-lg shadow-ink/10 backdrop-blur",
        "lg:hidden",
        className,
      )}
      aria-label="Primary navigation"
    >
      <ul className="flex w-full items-center justify-between gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                onClick={onLinkClick}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center rounded-xl px-2 py-1 text-xs font-medium transition",
                  isActive ? "text-brand-primary" : "text-ink-muted hover:text-ink",
                )}
              >
                <item.icon size={20} />
                <span className="mt-1">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNavigationBar;
