import { ChartBar, Folder, SquaresFour, UserCircle } from "phosphor-react";

import { authRoutes, dashboardRoute, metricCategoryRoutes, metricRoutes } from "@/lib/routes";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const navItems: NavItem[] = [
  { name: "Dashboard", href: dashboardRoute(), icon: SquaresFour },
  { name: "Metrics", href: metricRoutes.list(), icon: ChartBar },
  { name: "Category", href: metricCategoryRoutes.list(), icon: Folder },
  { name: "Account", href: authRoutes.account(), icon: UserCircle },
];

export interface NavigationListProps {
  navItems: NavItem[];
  pathname: string;
  onLinkClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export interface SidebarProps {
  navItems: NavItem[];
  pathname: string;
  onLinkClick?: () => void;
  isMobileOpen: boolean;
  onClose: () => void;
}
