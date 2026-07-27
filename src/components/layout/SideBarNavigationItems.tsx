import Link from "next/link";

import { cn } from "@/lib/cn";

import type { NavigationListProps } from "./type";

const SideBarNavigationItems = ({
  navItems,
  pathname,
  onLinkClick,
  className,
  ariaLabel,
}: NavigationListProps) => {
  return (
    <nav className={cn("flex flex-col", className)} aria-label={ariaLabel}>
      <ul className="space-y-3">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onLinkClick}
              className={cn("flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition", {
                "bg-brand-primary text-white": pathname === item.href,
                "text-ink hover:bg-surface2": pathname !== item.href,
              })}
            >
              <item.icon size={18} className="mr-3 shrink-0" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SideBarNavigationItems;
