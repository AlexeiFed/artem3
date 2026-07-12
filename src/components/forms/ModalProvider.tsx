"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { ModalForm } from "./ModalForm";

interface ModalContextValue {
  openModal(service?: string): void;
  closeModal(): void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

interface ModalProviderProps {
  children: ReactNode;
  metrikaId: number | undefined;
}

export function ModalProvider({
  children,
  metrikaId,
}: ModalProviderProps) {
  const [service, setService] = useState<string>();
  const [open, setOpen] = useState(false);
  const openModal = useCallback((nextService?: string) => {
    setService(nextService);
    setOpen(true);
  }, []);
  const closeModal = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ openModal, closeModal }),
    [closeModal, openModal],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {open ? (
        <ModalForm
          service={service}
          metrikaId={metrikaId}
          onClose={closeModal}
        />
      ) : null}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const value = useContext(ModalContext);
  if (!value) throw new Error("useModal must be used inside ModalProvider");
  return value;
}

export function useOptionalModal(): ModalContextValue | null {
  return useContext(ModalContext);
}
