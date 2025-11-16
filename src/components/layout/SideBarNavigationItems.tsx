import Link from "next/link";

import type { NavigationProps } from "./type";
import { cn } from "@/lib/cn";

const SideBarNavigationItems = ({ navItems, pathname, onClick, className }: NavigationProps) => {
  return (
    <nav className={className}>
      <ul className="space-y-3">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onClick}
              className={cn("flex items-center rounded-md px-4 py-2 transition", {
                "text-brand-primary font-bold": pathname === item.href,
                "text-ink hover:bg-surface2": pathname !== item.href,
              })}
            >
              <item.icon size={20} className="mr-2" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SideBarNavigationItems;
