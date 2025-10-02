"use client";

import { X } from "phosphor-react";
import type { ReactNode } from "react";

interface Modal {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, children }: Modal) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="relative rounded-2xl bg-white p-6 shadow-lg">
        <button
          className="absolute right-4 top-4 text-gray-700 hover:text-red-500"
          onClick={onClose}
          aria-label="Close Modal"
        >
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
