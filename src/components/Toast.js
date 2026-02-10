"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"

const ToastContext = createContext(null)

const iconMap = {
    success: { icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", iconColor: "text-emerald-500", bar: "bg-emerald-500" },
    error: { icon: XCircle, bg: "bg-red-50", border: "border-red-200", text: "text-red-800", iconColor: "text-red-500", bar: "bg-red-500" },
    warning: { icon: AlertTriangle, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", iconColor: "text-amber-500", bar: "bg-amber-500" },
    info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", iconColor: "text-blue-500", bar: "bg-blue-500" },
}

let toastIdCounter = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = "info", duration = 4000) => {
        const id = ++toastIdCounter
        setToasts(prev => [...prev, { id, message, type, duration }])
        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const toast = useCallback({
        success: (msg, duration) => addToast(msg, "success", duration),
        error: (msg, duration) => addToast(msg, "error", duration),
        warning: (msg, duration) => addToast(msg, "warning", duration),
        info: (msg, duration) => addToast(msg, "info", duration),
    }, [addToast])

    // Attach to window for non-component usage 
    useEffect(() => {
        window.__toast = toast
    }, [toast])

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast Container - bottom center */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

function ToastItem({ toast, onRemove }) {
    const { id, message, type, duration } = toast
    const config = iconMap[type] || iconMap.info
    const Icon = config.icon

    useEffect(() => {
        const timer = setTimeout(() => onRemove(id), duration)
        return () => clearTimeout(timer)
    }, [id, duration, onRemove])

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm min-w-[320px] max-w-md ${config.bg} ${config.border}`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
            <p className={`text-sm font-medium flex-1 ${config.text}`}>{message}</p>
            <button
                onClick={() => onRemove(id)}
                className={`p-1 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0 ${config.text}`}
            >
                <X className="w-3.5 h-3.5" />
            </button>
            {/* Progress bar */}
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left rounded-b-xl ${config.bar}`}
            />
        </motion.div>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}
