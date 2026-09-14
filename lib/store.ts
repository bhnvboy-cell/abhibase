import { create } from 'zustand'

interface SidebarState {
  open: boolean
  toggle: () => void
  close: () => void
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
}))

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, type?: ToastType) => void
  dismiss: (id: number) => void
}

let toastId = 0

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (message, type = 'success') => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = (message: string, type: ToastType = 'success') =>
  useToastStore.getState().push(message, type)
