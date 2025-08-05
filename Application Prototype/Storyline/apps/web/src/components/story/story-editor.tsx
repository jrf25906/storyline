"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "src/components/ui/button"
import { Input } from "src/components/ui/input"
import { Textarea } from "src/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card"
import { Badge } from "src/components/ui/badge"
import { Separator } from "src/components/ui/separator"
import {
  Save,
  Eye,
  Share2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Quote,
} from "lucide-react"
import { GearIcon, FontBoldIcon, FontItalicIcon, UnderlineIcon } from "@radix-ui/react-icons"

export default function StoryEditor() {
  const [title, setTitle] = useState("Untitled Story")
  const [content, setContent] = useState("")
  const [wordCount, setWordCount] = useState(0)

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setContent(text)
    setWordCount(
      text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Editor Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 bg-transparent"
                placeholder="Story title..."
              />
              <Badge variant="secondary">Draft</Badge>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{wordCount} words</span>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm">
                <GearIcon className="w-4 h-4" />
              </Button>
              <Button size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card className="min-h-[600px]">
              <CardHeader className="border-b">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <FontBoldIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <FontItalicIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <UnderlineIcon className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button variant="ghost" size="sm">
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <AlignRight className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button variant="ghost" size="sm">
                    <List className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Quote className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start writing your story..."
                  className="min-h-[500px] border-none resize-none focus-visible:ring-0 text-lg leading-relaxed p-8"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Story Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Genre</label>
                  <Input placeholder="e.g., Fantasy, Romance" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                  <Input placeholder="Add tags..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  <Textarea placeholder="Brief description of your story..." className="h-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Writing Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Words</span>
                  <span className="font-semibold">{wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Characters</span>
                  <span className="font-semibold">{content.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reading time</span>
                  <span className="font-semibold">{Math.ceil(wordCount / 200)} min</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chapter Outline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                    Chapter 1: The Beginning
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-500">
                    + Add Chapter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
