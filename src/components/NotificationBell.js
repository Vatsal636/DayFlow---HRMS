"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Bell, 
    Check, 
    CheckCheck, 
    X, 
    Calendar, 
    DollarSign, 
    Megaphone, 
    Clock,
    User,
    Shield,
    Trash2,
    Settings
} from 'lucide-react'
import Link from 'next/link'

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

function formatTimeAgo(date) {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
}

export default function NotificationBell({ csrfToken }) {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const dropdownRef = useRef(null)

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?limit=10')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications)
                setUnreadCount(data.unreadCount)
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        }
    }

    useEffect(() => {
        fetchNotifications()
        
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

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
        setIsLoading(true)
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
        } finally {
            setIsLoading(false)
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
                if (notification && !notification.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1))
                }
            }
        } catch (error) {
            console.error('Failed to delete notification:', error)
        }
    }

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id)
        }
        if (notification.link) {
            setIsOpen(false)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-semibold text-slate-900">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={isLoading}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3 h-3" />
                                        Mark all read
                                    </button>
                                )}
                                <Link 
                                    href="/dashboard/profile?tab=notifications"
                                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Settings className="w-4 h-4 text-slate-500" />
                                </Link>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const iconConfig = notificationIcons[notification.type] || notificationIcons.ANNOUNCEMENT
                                    const IconComponent = iconConfig.icon

                                    return (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`relative group ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                                        >
                                            {notification.link ? (
                                                <Link
                                                    href={notification.link}
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                                                >
                                                    <NotificationContent 
                                                        notification={notification}
                                                        IconComponent={IconComponent}
                                                        iconConfig={iconConfig}
                                                    />
                                                </Link>
                                            ) : (
                                                <div 
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                                                >
                                                    <NotificationContent 
                                                        notification={notification}
                                                        IconComponent={IconComponent}
                                                        iconConfig={iconConfig}
                                                    />
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            e.preventDefault()
                                                            markAsRead(notification.id)
                                                        }}
                                                        className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-green-50 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        deleteNotification(notification.id)
                                                    }}
                                                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </button>
                                            </div>

                                            {/* Unread Indicator */}
                                            {!notification.isRead && (
                                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                                            )}
                                        </motion.div>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                                <Link
                                    href="/dashboard/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    View all notifications
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function NotificationContent({ notification, IconComponent, iconConfig }) {
    return (
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${iconConfig.bg}`}>
                <IconComponent className={`w-4 h-4 ${iconConfig.color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                    {notification.title}
                </p>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {notification.message}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    {formatTimeAgo(notification.createdAt)}
                </p>
            </div>
        </div>
    )
}
