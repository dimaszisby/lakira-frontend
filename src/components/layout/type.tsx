import { ChartBar, Folder, SquaresFour, UserCircle } from "phosphor-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: SquaresFour },
  { name: "Metrics", href: "/metrics", icon: ChartBar },
  { name: "Category", href: "/metric-categories", icon: Folder },
  { name: "Account", href: "/account", icon: UserCircle },
];

export interface NavigationListProps {
  navItems: NavItem[];
  pathname: string;
  onLinkClick?: () => void;
  className?: string;
}

export interface SidebarProps {
  navItems: NavItem[];
  pathname: string;
  onLinkClick?: () => void;
  isMobileOpen: boolean;
  onClose: () => void;
}
