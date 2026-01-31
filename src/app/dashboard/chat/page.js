"use client"

import ChatInterface from "@/components/ChatInterface"
import { MessageCircle } from "lucide-react"

export default function EmpChatPage() {
    return (
        <div className="h-full">
            <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-blue-500" />
                Team Chat
            </h1>
            <ChatInterface currentUserRole="EMPLOYEE" />
        </div>
    )
}
