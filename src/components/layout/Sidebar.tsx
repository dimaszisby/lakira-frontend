"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { SignOut, X } from "phosphor-react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";

import { cn } from "@/lib/cn";
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
    <div className="flex items-center justify-between pb-6">
      <div>
        <p className="text-2xl font-semibold text-ink">Lakira</p>
        <p className="text-ink-muted text-sm">Measure what matters</p>
      </div>
      {includeCloseButton ? (
        <button
          type="button"
          onClick={onClose}
          className="text-ink-muted p-2 transition hover:text-ink"
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
      router.push("/auth/login");
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
    <div className="mt-auto pt-6">
      <Button
        variant="ghost"
        onClick={() => setLogoutModalOpen(true)}
        className="w-full justify-start px-4 text-ink hover:text-status-error"
        leftIcon={<SignOut size={20} />}
        aria-label="Logout"
      >
        Sign Out
      </Button>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Card className="flex h-full flex-col border-r border-surface2 px-4 py-6">
          <SidebarContentWrapper>
            <SideBarNavigationItems
              navItems={navItems}
              pathname={pathname}
              onLinkClick={handleNavigationSelection}
              className="flex-1"
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
          <Card className="flex h-full flex-col rounded-none border-r border-surface2 px-4 py-6">
            <SidebarContentWrapper includeCloseButton onClose={onClose}>
              <SideBarNavigationItems
                navItems={navItems}
                pathname={pathname}
                onLinkClick={handleNavigationSelection}
                className="flex-1"
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
