"use client"

import ChatInterface from "@/components/ChatInterface"
import { MessageCircle } from "lucide-react"

export default function AdminChatPage() {
    return (
        <div className="h-full p-4 md:p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-blue-500" />
                General Channel
            </h1>
            <ChatInterface currentUserRole="ADMIN" />
        </div>
    )
}
