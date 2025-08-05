import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "src/components/ui/button"
import { ScrollArea } from "src/components/ui/scroll-area"
import { Mic, Volume2, Lightbulb } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { SuggestionChip } from "./suggestion-chip"
import { GearIcon } from "@radix-ui/react-icons"

const pulseKeyframes = `
  @keyframes voice-pulse {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 0.6; }
    100% { transform: scale(1); opacity: 0.8; }
  }
  
  @keyframes voice-ripple {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 8px rgba(217, 119, 6, 0.3); }
    50% { box-shadow: 0 0 16px rgba(217, 119, 6, 0.5), 0 0 24px rgba(217, 119, 6, 0.3); }
  }
`

interface Message {
  id: number
  role: "user" | "assistant"
  content: React.ReactNode
}

const initialConversation: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: (
      <div className="space-y-2">
        <p className="font-medium text-gray-900">Hello! I'm Leo, your writing companion.</p>
        <p className="text-gray-600">
          I'm here to help you brainstorm ideas, develop characters, and refine your story. What would you like to
          explore today?
        </p>
      </div>
    ),
  },
]

const writingPrompts = [
  "Help me develop my main character",
  "I'm stuck on this scene",
  "What's a good plot twist?",
  "How can I improve this dialogue?",
]

export default function VoicePanel({ context = "editor" }: { context?: "dashboard" | "editor" }) {
  const [isListening, setIsListening] = useState(false)
  const [conversation, setConversation] = useState<Message[]>(initialConversation)
  const [isTyping, setIsTyping] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [conversation])

  const handleUserMessage = (text: string) => {
    const newUserMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    }
    setConversation((prev) => [...prev, newUserMessage])
    setIsTyping(true)

    // Simulate assistant response with typing indicator
    setTimeout(() => {
      setIsTyping(false)
      let assistantResponse: Message

      if (text.toLowerCase().includes("character")) {
        assistantResponse = {
          id: Date.now() + 1,
          role: "assistant",
          content: (
            <div className="space-y-3">
              <p className="text-gray-900">
                Great question! A compelling character needs depth and motivation. Let's explore what drives your
                character.
              </p>
              <p className="text-gray-600">
                What does your character want more than anything else? And what's stopping them from getting it?
              </p>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <SuggestionChip onClick={() => handleUserMessage("Tell me about character motivations")}>
                  Tell me about character motivations
                </SuggestionChip>
                <SuggestionChip onClick={() => handleUserMessage("Help me create character flaws")}>
                  Help me create character flaws
                </SuggestionChip>
              </div>
            </div>
          ),
        }
      } else if (text.toLowerCase().includes("stuck")) {
        assistantResponse = {
          id: Date.now() + 1,
          role: "assistant",
          content: (
            <div className="space-y-3">
              <p className="text-gray-900">Writer's block happens to everyone! Let's work through this together.</p>
              <p className="text-gray-600">
                Can you tell me what scene you're working on? Sometimes talking through the problem helps unlock new
                ideas.
              </p>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <SuggestionChip onClick={() => handleUserMessage("Give me some writing prompts")}>
                  Give me some writing prompts
                </SuggestionChip>
                <SuggestionChip onClick={() => handleUserMessage("Help me brainstorm plot ideas")}>
                  Help me brainstorm plot ideas
                </SuggestionChip>
              </div>
            </div>
          ),
        }
      } else {
        assistantResponse = {
          id: Date.now() + 1,
          role: "assistant",
          content: (
            <div className="space-y-2">
              <p className="text-gray-900">That's an interesting point! Tell me more about what you're thinking.</p>
              <p className="text-gray-600">I'm here to help you explore your ideas and develop your story further.</p>
            </div>
          ),
        }
      }
      setConversation((prev) => [...prev, assistantResponse])
    }, 1500)
  }

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
      // Simulate voice recognition result
      setTimeout(() => {
        handleUserMessage("I'm feeling stuck on my main character's motivation.")
      }, 500)
    } else {
      setIsListening(true)
    }
  }

  return (
    <div className="w-80 h-full bg-gradient-to-b from-amber-50 to-orange-50 border-r border-amber-200 flex flex-col">
      <style jsx>{pulseKeyframes}</style>

      {/* Header - Brand consistent */}
      <div className="h-16 px-4 border-b border-amber-200 flex items-center justify-between bg-white/80 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
              </svg>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 font-serif">Leo</h2>
            <p className="text-xs text-gray-600 font-medium">Writing Companion</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="hover:bg-amber-100">
          <GearIcon className="w-4 h-4 text-gray-600" />
        </Button>
      </div>

      {/* Conversation Area */}
      <ScrollArea className="flex-1 p-4">
        <div ref={chatContainerRef} className="space-y-4">
          {conversation.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role}>
              {msg.content}
            </ChatMessage>
          ))}
          {isTyping && (
            <ChatMessage role="assistant">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-xs text-gray-500 ml-2 font-medium">Leo is thinking...</span>
              </div>
            </ChatMessage>
          )}
        </div>
      </ScrollArea>

      {/* Quick Prompts */}
      {conversation.length === 1 && (
        <div className="px-4 py-3 border-t border-amber-200 bg-white/50">
          <div className="flex items-center mb-3">
            <Lightbulb className="w-4 h-4 text-amber-600 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Try asking:</h3>
          </div>
          <div className="space-y-2">
            {writingPrompts.map((prompt, index) => (
              <SuggestionChip key={index} onClick={() => handleUserMessage(prompt)}>
                {prompt}
              </SuggestionChip>
            ))}
          </div>
        </div>
      )}

      {/* Voice Input Area */}
      <div className="p-4 border-t border-amber-200 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-center mb-3">
          <div className="relative">
            {isListening && (
              <>
                <div
                  className="absolute inset-0 rounded-full border-2 border-amber-400"
                  style={{ animation: "voice-ripple 2s infinite" }}
                />
                <div
                  className="absolute inset-0 rounded-full bg-amber-400 opacity-20"
                  style={{ animation: "voice-pulse 1.5s infinite" }}
                />
              </>
            )}
            <Button
              onClick={toggleListening}
              size="lg"
              className={`relative w-12 h-12 rounded-full transition-all duration-300 font-medium ${
                isListening
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg"
                  : "bg-gray-800 hover:bg-gray-900"
              }`}
              style={{
                animation: isListening ? "glow 2s infinite" : "none",
              }}
            >
              <Mic className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center mb-3 font-medium">
          {isListening ? "I'm listening..." : "Click to talk with Leo"}
        </p>

        {/* Voice Settings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">Voice feedback</span>
            <div className="flex items-center space-x-2">
              <Volume2 className="w-3 h-3 text-gray-500" />
              <div className="w-12 h-1.5 bg-gray-200 rounded-full">
                <div className="w-9 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
