"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Bell, 
    Calendar, 
    DollarSign, 
    Megaphone, 
    Clock,
    User,
    Shield,
    Trash2,
    Check,
    CheckCheck,
    Loader2,
    Filter,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import Link from "next/link"

const notificationIcons = {
    LEAVE_APPROVED: { icon: Calendar, color: 'text-green-500', bg: 'bg-green-100' },
    LEAVE_REJECTED: { icon: Calendar, color: 'text-red-500', bg: 'bg-red-100' },
    PAYROLL_GENERATED: { icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-100' },
    ANNOUNCEMENT: { icon: Megaphone, color: 'text-purple-500', bg: 'bg-purple-100' },
    ATTENDANCE_REMINDER: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100' },
    WELCOME: { icon: User, color: 'text-green-500', bg: 'bg-green-100' },
    PASSWORD_CHANGED: { icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    PROFILE_UPDATED: { icon: User, color: 'text-teal-500', bg: 'bg-teal-100' }
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [unreadCount, setUnreadCount] = useState(0)
    const [filter, setFilter] = useState('all') // all, unread
    const [page, setPage] = useState(0)
    const [csrfToken, setCsrfToken] = useState(null)
    const limit = 10

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
    }, [])

    const fetchNotifications = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: (page * limit).toString(),
                ...(filter === 'unread' && { unreadOnly: 'true' })
            })
            
            const res = await fetch(`/api/notifications?${params}`)
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications)
                setTotal(data.total)
                setUnreadCount(data.unreadCount)
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [page, filter])

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                }
            })
            if (res.ok) {
                setNotifications(prev => 
                    prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date() } : n)
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                }
            })
            if (res.ok) {
                setNotifications(prev => 
                    prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
                )
                setUnreadCount(0)
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    const deleteNotification = async (id) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                }
            })
            if (res.ok) {
                const notification = notifications.find(n => n.id === id)
                setNotifications(prev => prev.filter(n => n.id !== id))
                setTotal(prev => prev - 1)
                if (notification && !notification.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1))
                }
            }
        } catch (error) {
            console.error('Failed to delete notification:', error)
        }
    }

    const totalPages = Math.ceil(total / limit)

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                <p className="text-slate-500 mt-1">
                    {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <button
                        onClick={() => { setFilter('all'); setPage(0) }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => { setFilter('unread'); setPage(0) }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'unread' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Unread
                    </button>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
                        <p className="text-slate-500 mt-2">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-20 text-center">
                        <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {notifications.map((notification, index) => {
                            const iconConfig = notificationIcons[notification.type] || notificationIcons.ANNOUNCEMENT
                            const IconComponent = iconConfig.icon

                            return (
                                <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`relative group border-b border-slate-100 last:border-b-0 ${
                                        !notification.isRead ? 'bg-blue-50/50' : ''
                                    }`}
                                >
                                    <div className="p-4 flex items-start gap-4">
                                        {/* Unread Indicator */}
                                        {!notification.isRead && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                                        )}

                                        {/* Icon */}
                                        <div className={`p-3 rounded-xl ${iconConfig.bg} flex-shrink-0`}>
                                            <IconComponent className={`w-5 h-5 ${iconConfig.color}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className={`font-medium ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        {formatDate(notification.createdAt)}
                                                    </p>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Link */}
                                            {notification.link && (
                                                <Link
                                                    href={notification.link}
                                                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                                                    className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    View Details →
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <span className="text-sm text-slate-600">
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
