"use client"

import { useState, useEffect, useRef } from "react"
import { Send, User, Loader2, RefreshCw, Edit2, Trash2, Check, X } from "lucide-react"

export default function ChatInterface({ currentUserRole }) {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editContent, setEditContent] = useState("")
    const [typingUsers, setTypingUsers] = useState([])
    const [currentUserId, setCurrentUserId] = useState(null)
    const [csrfToken, setCsrfToken] = useState(null)
    const scrollRef = useRef(null)
    const typingTimeoutRef = useRef(null)

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchMessages()
        const messageInterval = setInterval(fetchMessages, 3000)
        const typingInterval = setInterval(fetchTypingUsers, 2000)
        return () => {
            clearInterval(messageInterval)
            clearInterval(typingInterval)
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
            updateTypingStatus(false)
        }
    }, [])

    useEffect(() => {
        scrollToBottom()
        // Mark visible messages as read
        markMessagesAsRead()
    }, [messages])

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const markMessagesAsRead = async () => {
        try {
            // Mark all messages as read
            const res = await fetch('/api/chat/read', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                }
            })
            const data = await res.json()
            if (data.count > 0) {
                console.log(`Marked ${data.count} messages as read`)
            }
        } catch (e) {
            console.error('Failed to mark messages as read:', e)
        }
    }

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/chat')
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages || [])
                setCurrentUserId(data.currentUserId)
                setLoading(false)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const fetchTypingUsers = async () => {
        try {
            const res = await fetch('/api/chat/typing')
            if (res.ok) {
                const data = await res.json()
                setTypingUsers(data.typing || [])
            }
        } catch (e) {
            console.error(e)
        }
    }

    const updateTypingStatus = async (isTyping) => {
        try {
            await fetch('/api/chat/typing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({ isTyping })
            })
        } catch (e) {
            console.error(e)
        }
    }

    const handleInputChange = (e) => {
        setNewMessage(e.target.value)
        
        // Send typing indicator
        updateTypingStatus(true)
        
        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }
        
        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            updateTypingStatus(false)
        }, 2000)
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        setSending(true)
        updateTypingStatus(false)
        
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({ content: newMessage })
            })
            if (res.ok) {
                setNewMessage("")
                fetchMessages()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSending(false)
        }
    }

    const startEdit = (msg) => {
        setEditingId(msg.id)
        setEditContent(msg.content)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditContent("")
    }

    const saveEdit = async (messageId) => {
        if (!editContent.trim()) return
        
        try {
            const res = await fetch('/api/chat', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({ messageId, content: editContent })
            })
            if (res.ok) {
                setEditingId(null)
                setEditContent("")
                fetchMessages()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const deleteMessage = async (messageId) => {
        if (!confirm('Delete this message?')) return
        
        try {
            const res = await fetch(`/api/chat?id=${messageId}`, {
                method: 'DELETE',
                headers: {
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                }
            })
            if (res.ok) {
                fetchMessages()
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        Collaboration Platform
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </h2>
                </div>
                <button onClick={fetchMessages} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 relative">
                {loading && messages.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => {
                            const isMe = msg.isMe
                            const isEditing = editingId === msg.id

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar */}
                                        {!isMe && (
                                            <div className="shrink-0 mt-1">
                                                {msg.avatar ? (
                                                    <img src={msg.avatar} className="w-8 h-8 rounded-full object-cover shadow-sm" alt={msg.senderName} />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${msg.senderRole === 'ADMIN' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                                                        {msg.senderName.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            {/* Sender Name & Time */}
                                            {!isMe && (
                                                <div className="flex items-baseline gap-2 mb-1 px-1">
                                                    <span className={`text-xs font-bold ${msg.senderRole === 'ADMIN' ? 'text-blue-700' : 'text-slate-900'}`}>
                                                        {msg.senderName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Message Content */}
                                            <div className={`group relative px-4 py-2 rounded-2xl ${
                                                isMe 
                                                    ? 'bg-blue-600 text-white rounded-br-sm' 
                                                    : msg.senderRole === 'ADMIN'
                                                    ? 'bg-blue-50 text-slate-900 border border-blue-100 rounded-bl-sm'
                                                    : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
                                            }`}>
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            className="px-2 py-1 bg-white/20 border border-white/30 rounded text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-white/50"
                                                            autoFocus
                                                        />
                                                        <button onClick={() => saveEdit(msg.id)} className="p-1 hover:bg-white/20 rounded">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={cancelEdit} className="p-1 hover:bg-white/20 rounded">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                                            {msg.content}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {msg.isEdited && (
                                                                <span className={`text-[10px] italic ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                                                    (edited)
                                                                </span>
                                                            )}
                                                            {isMe && msg.readBy && msg.readBy.length > 0 && (
                                                                <span className="text-[10px] text-blue-200 flex items-center gap-1">
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                                                        <path d="M18.707 4.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 11.586l7.293-7.293a1 1 0 011.414 0z"/>
                                                                    </svg>
                                                                    {msg.readBy.length === 1 ? 'Seen' : `Seen by ${msg.readBy.length}`}
                                                                </span>
                                                            )}
                                                            {isMe && process.env.NODE_ENV === 'development' && (
                                                                <span className="text-[9px] text-blue-300 opacity-50">
                                                                    [readBy: {msg.readBy?.length || 0}]
                                                                </span>
                                                            )}
                                                        </div>
                                                    </>
                                                )}

                                                {/* Action Buttons (show on hover for own messages) */}
                                                {isMe && !isEditing && (
                                                    <div className="absolute -top-3 right-0 hidden group-hover:flex items-center gap-1 bg-white rounded-lg shadow-lg border border-slate-200 p-1">
                                                        <button
                                                            onClick={() => startEdit(msg)}
                                                            className="p-1 hover:bg-slate-100 rounded text-slate-600"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteMessage(msg.id)}
                                                            className="p-1 hover:bg-red-50 rounded text-red-600"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Time for own messages */}
                                            {isMe && (
                                                <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Typing Indicator */}
                        {typingUsers.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-slate-500 px-4 py-2">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span className="text-xs italic">
                                    {typingUsers.length === 1 
                                        ? `Someone is typing...` 
                                        : `${typingUsers.length} people are typing...`}
                                </span>
                            </div>
                        )}
                    </>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSend} className="flex gap-2 relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className="flex-1 pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 placeholder:text-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    )
}
