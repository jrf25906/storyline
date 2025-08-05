import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "src/components/ui/button"
import { Input } from "src/components/ui/input"
import { Textarea } from "src/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card"
import { Badge } from "src/components/ui/badge"
import { Separator } from "src/components/ui/separator"
import { Alert, AlertDescription } from "src/components/ui/alert"
import VoicePanel from "./voice-panel"
import {
  Save,
  Eye,
  Share2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Quote,
  CheckCircle
} from "lucide-react"
import { GearIcon, FontBoldIcon, FontItalicIcon, UnderlineIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"

interface VoiceNotification {
  id: string
  type: "success" | "info" | "warning"
  message: string
  timestamp: Date
}

export default function VoiceEnhancedEditor() {
  const [title, setTitle] = useState("The Midnight Garden")
  const [content, setContent] = useState(
    "Chapter 1: The Beginning\n\nThe old garden had been abandoned for decades, its once-manicured paths now overgrown with wild roses and forgotten dreams. Elara stepped through the rusted gate, feeling an inexplicable pull toward the garden's mysterious heart.\n\nSomething about this place called to her, as if the very air whispered secrets of stories yet untold.",
  )
  const [wordCount, setWordCount] = useState(0)
  const [notifications, setNotifications] = useState<VoiceNotification[]>([])

  useEffect(() => {
    const text = content
    setWordCount(
      text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
    )
  }, [content])

  const addNotification = (type: "success" | "info" | "warning", message: string) => {
    const notification: VoiceNotification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    }
    setNotifications((prev) => [notification, ...prev.slice(0, 2)])

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    }, 5000)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Leo Voice Panel */}
      <VoicePanel context="editor" />

      {/* Main Content */}
      <div className="flex-1">
        {/* Voice Notifications */}
        {notifications.length > 0 && (
          <div className="fixed top-20 right-4 z-50 space-y-2 w-80">
            {notifications.map((notification) => (
              <Alert
                key={notification.id}
                className={`
                ${notification.type === "success" ? "border-green-200 bg-green-50" : ""}
                ${notification.type === "info" ? "border-amber-200 bg-amber-50" : ""}
                ${notification.type === "warning" ? "border-orange-200 bg-orange-50" : ""}
                animate-in slide-in-from-right duration-300 shadow-sm
              `}
              >
                {notification.type === "success" && <CheckCircle className="w-4 h-4 text-green-600" />}
                {notification.type === "info" && (
                  <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                  </svg>
                )}
                {notification.type === "warning" && <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />}
                <AlertDescription className="text-sm font-medium">{notification.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Editor Header - Brand consistent */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="h-16 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-bold border-none shadow-none focus-visible:ring-0 bg-transparent px-0 font-serif"
                placeholder="Story title..."
              />
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium">
                Draft
              </Badge>
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 font-medium">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                </svg>
                Leo is ready
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 font-medium">{wordCount} words</span>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 font-medium">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 font-medium">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <GearIcon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="min-h-[600px] shadow-sm border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <FontBoldIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <FontItalicIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <UnderlineIcon className="w-4 h-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <AlignRight className="w-4 h-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <List className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <Quote className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                    </svg>
                    <span className="font-medium">Highlight text and ask Leo for help</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start writing your story... Leo is here to help you brainstorm, develop characters, and refine your narrative."
                  className="min-h-[500px] border-none resize-none focus-visible:ring-0 text-lg leading-relaxed p-8 bg-white font-serif"
                />
              </CardContent>
            </Card>

            {/* Writing Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card className="p-4 text-center border-gray-200 shadow-sm">
                <CardTitle className="text-2xl font-bold text-gray-900">{wordCount}</CardTitle>
                <p className="text-sm text-gray-500 font-medium">Words</p>
              </Card>
              <Card className="p-4 text-center border-gray-200 shadow-sm">
                <CardTitle className="text-2xl font-bold text-gray-900">{Math.ceil(wordCount / 200)}</CardTitle>
                <p className="text-sm text-gray-500 font-medium">Minutes to read</p>
              </Card>
              <Card className="p-4 text-center border-gray-200 shadow-sm">
                <CardTitle className="text-2xl font-bold text-amber-600">12</CardTitle>
                <p className="text-sm text-gray-500 font-medium">Leo conversations</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
