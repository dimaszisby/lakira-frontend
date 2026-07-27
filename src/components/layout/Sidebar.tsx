"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { SignOut, X } from "phosphor-react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";

import { cn } from "@/lib/cn";
import { authRoutes } from "@/lib/routes";
import { logoutUser } from "@/services/api/auth.api";
import { userAtom } from "@/services/state/atoms";
import Button from "@/ui/Button";
import Card from "@/ui/Card";
import Modal from "@/ui/Modal";

import SideBarNavigationItems from "./SideBarNavigationItems";
import type { SidebarProps } from "./type";

interface SidebarContentProps {
  includeCloseButton?: boolean;
  onClose?: () => void;
  children: ReactNode;
}

const SidebarContentWrapper = ({ includeCloseButton, onClose, children }: SidebarContentProps) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center justify-between pb-8">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-sm font-bold text-white">
          L
        </div>
        <p className="text-lg font-semibold text-ink">Lakira</p>
      </div>
      {includeCloseButton ? (
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-ink-secondary transition hover:text-ink"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      ) : null}
    </div>
    {children}
  </div>
);

const Sidebar = ({ navItems, pathname, onLinkClick, isMobileOpen, onClose }: SidebarProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [, setUser] = useAtom(userAtom);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const { mutate: handleLogout, status } = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(["userProfile"], null);
      toast.success("Logged out successfully");
      router.push(authRoutes.login());
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    },
  });

  const handleNavigationSelection = useCallback(() => {
    if (isMobileOpen) {
      onClose();
    }
    onLinkClick?.();
  }, [isMobileOpen, onClose, onLinkClick]);

  const logoutButton = (
    <div className="mt-auto border-t border-surface2 pt-4">
      <button
        type="button"
        onClick={() => setLogoutModalOpen(true)}
        className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-status-error-bg hover:text-status-error"
        aria-label="Logout"
      >
        <SignOut size={18} className="mr-3 shrink-0" />
        Sign Out
      </button>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Card radius="none" className="flex h-full flex-col border-r border-surface2 px-4 py-6">
          <SidebarContentWrapper>
            <SideBarNavigationItems
              navItems={navItems}
              pathname={pathname}
              onLinkClick={handleNavigationSelection}
              className="flex-1"
              ariaLabel="Primary sidebar navigation"
            />
            {logoutButton}
          </SidebarContentWrapper>
        </Card>
      </aside>

      <div className="lg:hidden" aria-live="polite">
        <div
          className={cn(
            "fixed inset-0 z-40 bg-ink/40 transition-opacity duration-200",
            isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden="true"
          onClick={onClose}
        />

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 max-w-sm",
            "transform transition-transform duration-200 ease-out",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Mobile navigation"
        >
          <Card radius="none" className="flex h-full flex-col border-r border-surface2 px-4 py-6">
            <SidebarContentWrapper includeCloseButton onClose={onClose}>
              <SideBarNavigationItems
                navItems={navItems}
                pathname={pathname}
                onLinkClick={handleNavigationSelection}
                className="flex-1"
                ariaLabel="Mobile sidebar navigation"
              />
              {logoutButton}
            </SidebarContentWrapper>
          </Card>
        </aside>
      </div>

      <Modal
        title="Logout"
        description="Are you sure you want to log out?"
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        className="mx-auto w-full max-w-md"
      >
        <div className="flex justify-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLogoutModalOpen(false)}
            className="w-full"
            aria-label="Cancel logout"
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={() => handleLogout()}
            disabled={status === "pending"}
            className="w-full"
            aria-label="Confirm logout"
          >
            {status === "pending" ? "Logging Out..." : "Log Out"}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
