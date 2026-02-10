"use client"

import { ToastProvider } from "@/components/Toast"

export default function Providers({ children }) {
    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    )
}
