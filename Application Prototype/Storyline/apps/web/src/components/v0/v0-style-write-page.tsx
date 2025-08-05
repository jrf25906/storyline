import { useState, useEffect } from "react"
import { Button } from "src/components/ui/button"
import { Input } from "src/components/ui/input"
import { Textarea } from "src/components/ui/textarea"
import { Badge } from "src/components/ui/badge"
import { Separator } from "src/components/ui/separator"
import {
  RotateCcw,
  Share,
  Save,
  Eye,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  FileText,
  Download,
  RefreshCw
} from "lucide-react"
import { VoicePanelConnected } from "./voice-panel-connected"
import { ChevronLeftIcon, ChevronRightIcon, GearIcon, FontBoldIcon, FontItalicIcon, UnderlineIcon, DotsHorizontalIcon, CopyIcon, ReloadIcon } from "@radix-ui/react-icons"

export function V0StyleWritePage() {
  const [isClient, setIsClient] = useState(false)
  const [storyTitle, setStoryTitle] = useState("The Midnight Garden")
  const [storyContent, setStoryContent] = useState(`Chapter 1: The Beginning

The old garden had been abandoned for decades, its once-manicured paths now overgrown with wild roses and forgotten dreams. Elara stepped through the rusted gate, feeling an inexplicable pull toward the garden's mysterious heart.

Something about this place called to her, as if the very air whispered secrets of stories yet untold.

The moonlight filtered through the ancient oak trees, casting ethereal shadows that seemed to dance with purpose. Each step forward felt like crossing a threshold between worlds—the mundane reality she knew and something far more magical.

As she ventured deeper into the garden's embrace, Elara noticed the flowers seemed to glow with an inner light, their petals shimmering like captured starlight. The air hummed with an energy she couldn't quite name, but it filled her with a sense of belonging she had never experienced before.`)
  const [wordCount, setWordCount] = useState(156)

  useEffect(() => {
    // This ensures the component only renders its full content on the client side.
    setIsClient(true)
  }, [])

  if (!isClient) {
    // Render a loading state or null on the server to prevent SSR errors.
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <ReloadIcon className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Project info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 font-serif">Storyline</span>
                    <Badge variant="outline" className="text-xs font-medium">
                      Private
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="font-medium">
                <GearIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="font-medium">
                <Share className="w-4 h-4 mr-2" />
                Share
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
      </div>

      {/* File Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200">
              <ChevronLeftIcon className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200">
              <ChevronRightIcon className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200">
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <span className="font-mono font-medium">/write</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>v1.0</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area - 1/3 and 2/3 layout */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-[1fr_2fr] gap-6 h-[calc(100vh-220px)]">
          {/* Left Panel - Leo Chat (1/3 width) */}
          <VoicePanelConnected />

          {/* Right Panel - Editor/Preview (2/3 width) */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
            {/* Editor Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Input
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    className="text-xl font-bold border-none shadow-none focus-visible:ring-0 bg-transparent p-0 font-serif"
                  />
                  <Badge variant="secondary" className="font-medium">
                    Draft
                  </Badge>
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 font-medium">
                    + Leo is ready
                  </Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500 font-medium">{wordCount} words</span>
                  <Button variant="ghost" size="sm" className="font-medium">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="ghost" size="sm" className="font-medium">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm">
                    <DotsHorizontalIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <FontBoldIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <FontItalicIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <UnderlineIcon className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-4 mx-2" />
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <AlignRight className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-4 mx-2" />
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <List className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <DotsHorizontalIcon className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                  </svg>
                  <span className="font-medium">Highlight text and ask Leo for help</span>
                </div>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-8">
              <Textarea
                value={storyContent}
                onChange={(e) => {
                  setStoryContent(e.target.value)
                  const words = e.target.value
                    .trim()
                    .split(/\s+/)
                    .filter((word) => word.length > 0).length
                  setWordCount(words)
                }}
                placeholder="Start writing your story... Leo is here to help you brainstorm, develop characters, and refine your narrative."
                className="w-full h-full border-none resize-none focus-visible:ring-0 text-lg leading-relaxed font-serif bg-transparent placeholder:text-gray-400"
              />
            </div>

            {/* Editor Footer */}
            <div className="px-8 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">Characters: {storyContent.length}</span>
                  <span className="font-medium">Reading time: {Math.ceil(wordCount / 200)} min</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    <CopyIcon className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
