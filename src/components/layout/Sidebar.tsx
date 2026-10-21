"use client";

import { APP_NAME } from "@/constants/app";
import { Card } from "@/ui/Card";

import SideBarNavigationItems from "./SideBarNavigationItems";
import SignOutControl from "./SignOutControl";
import type { SidebarProps } from "./type";

/**
 * The desktop sidebar, from `lg` up. Below it, the bottom bar navigates and the account page signs
 * out; the mobile drawer that used to live here was never opened and kept its controls in the tab
 * order while off screen (kit `mobile-sign-out`, D-01).
 */
const Sidebar = ({ navItems, pathname, onLinkClick, onLogout, isLoggingOut }: SidebarProps) => (
  <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
    <Card radius="none" className="flex h-full flex-col border-r border-surface2 px-4 py-6">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 pb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-sm font-bold text-on-brand">
            L
          </div>
          <p className="text-lg font-semibold text-ink">{APP_NAME}</p>
        </div>
        <SideBarNavigationItems
          navItems={navItems}
          pathname={pathname}
          onLinkClick={onLinkClick}
          className="flex-1"
          ariaLabel="Primary sidebar navigation"
        />
        <div className="mt-auto border-t border-surface2 pt-4">
          <SignOutControl onSignOut={onLogout} isSigningOut={isLoggingOut} />
        </div>
      </div>
    </Card>
  </aside>
);

export default Sidebar;
