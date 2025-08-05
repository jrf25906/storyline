import type React from "react"
import { Avatar, AvatarFallback } from "src/components/ui/avatar"
import { PersonIcon } from "@radix-ui/react-icons"

interface ChatMessageProps {
  role: "user" | "assistant"
  children: React.ReactNode
}

export function ChatMessage({ role, children }: ChatMessageProps) {
  const isAssistant = role === "assistant"

  return (
    <div className={`flex items-start gap-3 ${isAssistant ? "" : "justify-end"}`}>
      {isAssistant && (
        <Avatar className="w-7 h-7 border border-amber-200 shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-amber-600 to-orange-600 text-white">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
            </svg>
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`rounded-lg px-3 py-2 text-sm max-w-[85%] font-medium ${
          isAssistant
            ? "bg-white border border-amber-200 text-gray-800 shadow-sm"
            : "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm"
        }`}
      >
        {children}
      </div>
      {!isAssistant && (
        <Avatar className="w-7 h-7 border border-gray-200 shadow-sm">
          <AvatarFallback className="bg-gray-100 text-gray-600">
            <PersonIcon className="w-3 h-3" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
