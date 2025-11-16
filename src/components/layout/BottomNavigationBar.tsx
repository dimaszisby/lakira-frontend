import Link from "next/link";

import type { NavigationProps } from "./type";
import Container from "@/ui/Container";
import { cn } from "@/lib/cn";

const BottomNavigationBar: React.FC<NavigationProps> = ({
  navItems,
  pathname,
  onClick,
  className,
  style,
}) => {
  return (
    <Container
      size="md"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 ",
        "block rounded-none rounded-t-2xl border p-4 ",
        "shadow-lg shadow-gray-200/50",
        "lg:hidden",
        className,
      )}
      style={style}
    >
      <nav style={style} aria-label="Bottom Navigation Bar">
        <ul className="flex justify-between">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClick}
                className={cn("flex flex-col items-center text-sm transition", {
                  "text-brand-primary font-bold": pathname === item.href,
                  "text-ink hover:text-ink-emphasis": pathname !== item.href,
                })}
              >
                <item.icon size={20} className="mr-2" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
};
export default BottomNavigationBar;
