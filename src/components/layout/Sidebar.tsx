"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import { SignOut } from "phosphor-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { logoutUser } from "@/services/api/auth.api";
import { userAtom } from "@/services/state/atoms";

import BottomNavigationBar from "./BottomNavigationBar";
import SideBarNavigationItems from "./SideBarNavigationItems";
import { navItems } from "./type";
import ModalProps from "@/ui/Modal";
import Container from "@/ui/Container";
import Button from "@/ui/Button";
import { cn } from "@/lib/cn";

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [, setUser] = useAtom(userAtom);

  const queryClient = useQueryClient();

  // Mobile state handlers
  const closeMobileMenu = () => setMobileOpen(false);

  // Updated: Using "status" property to check if the mutation is loading.
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

  const logoutButton = () => (
    <div className="mt-auto">
      <Button
        variant="ghost"
        onClick={() => setLogoutModalOpen(true)}
        className="w-full hover:text-status-error"
        leftIcon={<SignOut size={20} />}
      >
        Sign Out
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Container
        size="lg"
        className={cn("fixed bottom-4 left-4 right-4 top-4 z-50 hidden w-64 lg:flex")}
      >
        <h2 className="mb-4 text-2xl font-bold">Lakira</h2>
        <SideBarNavigationItems
          navItems={navItems}
          pathname={pathname || ""}
          onClick={closeMobileMenu}
        />

        {logoutButton()}
      </Container>

      <BottomNavigationBar
        navItems={navItems}
        pathname={pathname || ""}
        onClick={closeMobileMenu}
        className="lg:hidden"
        // style={{ display: mobileOpen ? "block" : "hidden" }}
      />

      {/* Logout Confirmation Modal */}
      <ModalProps
        title="Logout"
        description="Are you sure to log out?"
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        className="mx-auto w-full max-w-md"
      >
        <div className="flex justify-center gap-4">
          <Button variant="ghost" onClick={() => setLogoutModalOpen(false)} className="w-full">
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={() => handleLogout()}
            disabled={status === "pending"}
            className="w-full"
          >
            {status === "pending" ? "Logging Out..." : "Log Out"}
          </Button>
        </div>
      </ModalProps>
    </>
  );
};

export default Sidebar;
