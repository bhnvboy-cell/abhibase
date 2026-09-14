'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useToastStore } from '@/lib/store'

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error: <AlertCircle className="h-4 w-4 text-rose-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg border bg-card px-4 py-3 shadow-lg"
          >
            {icons[t.type]}
            <p className="text-sm">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
