import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "src/components/ui/card"
import { Button } from "src/components/ui/button"
import { Badge } from "src/components/ui/badge"
import { Progress } from "src/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "src/components/ui/tabs"
import VoicePanel from "./voice-panel"
import { BookOpen, Clock, TrendingUp, Eye, Mic, Volume2 } from "lucide-react"
import { PlusIcon } from "@radix-ui/react-icons"

const recentStories = [
  {
    title: "The Midnight Garden",
    lastEdited: "2 hours ago",
    wordCount: 2847,
    status: "Draft",
    progress: 65,
    voiceCommands: 12,
  },
  {
    title: "Chronicles of Tomorrow",
    lastEdited: "1 day ago",
    wordCount: 5432,
    status: "In Review",
    progress: 90,
    voiceCommands: 8,
  },
  {
    title: "Whispers in the Wind",
    lastEdited: "3 days ago",
    wordCount: 1203,
    status: "Published",
    progress: 100,
    voiceCommands: 15,
  },
]

const stats = [
  { label: "Total Stories", value: "12", icon: BookOpen, change: "+2 this month" },
  { label: "Words Written", value: "45,231", icon: TrendingUp, change: "+3,421 this week" },
  { label: "Voice Commands", value: "247", icon: Mic, change: "+35 this week" },
  { label: "Total Views", value: "8,923", icon: Eye, change: "+892 this week" },
]

export default function VoiceDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Voice Panel */}
      <VoicePanel context="dashboard" />

      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Writer!</h1>
                <p className="text-gray-600">Continue your storytelling journey with voice commands</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <Mic className="w-3 h-3 mr-1" />
                  Voice Active
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Audio Feedback On
                </Badge>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stories">My Stories</TabsTrigger>
              <TabsTrigger value="voice-analytics">Voice Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                      <stat.icon
                        className={`w-4 h-4 ${stat.label === "Voice Commands" ? "text-green-500" : "text-gray-400"}`}
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Stories with Voice Integration */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Recent Stories</CardTitle>
                        <CardDescription>Continue where you left off or use voice commands</CardDescription>
                      </div>
                      <Button>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        New Story
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {recentStories.map((story, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{story.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {story.lastEdited}
                              </span>
                              <span>{story.wordCount.toLocaleString()} words</span>
                              <span className="flex items-center text-green-600">
                                <Mic className="w-3 h-3 mr-1" />
                                {story.voiceCommands} voice commands
                              </span>
                              <Badge variant={story.status === "Published" ? "default" : "secondary"}>
                                {story.status}
                              </Badge>
                            </div>
                            <Progress value={story.progress} className="mt-2 h-2" />
                          </div>
                          <Button variant="ghost" size="sm">
                            Continue
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Writing Goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900">847</div>
                          <div className="text-sm text-gray-500">words today</div>
                        </div>
                        <Progress value={84.7} className="h-3" />
                        <div className="text-sm text-gray-600 text-center">
                          153 words to reach your daily goal of 1,000
                        </div>
                        <div className="text-xs text-green-600 text-center">
                          <Mic className="w-3 h-3 inline mr-1" />
                          Say "Show my progress" for details
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Voice Usage Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Commands used</span>
                          <span className="font-semibold">35</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Time saved</span>
                          <span className="font-semibold text-green-600">12 min</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Accuracy</span>
                          <span className="font-semibold">94%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="voice-analytics">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Most Used Voice Commands</CardTitle>
                    <CardDescription>Your top voice interactions this week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { command: "Save my work", count: 45, percentage: 85 },
                        { command: "Create new chapter", count: 23, percentage: 65 },
                        { command: "Read my story", count: 18, percentage: 45 },
                        { command: "Show statistics", count: 12, percentage: 30 },
                        { command: "Start writing", count: 8, percentage: 20 },
                      ].map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">"{item.command}"</span>
                            <span className="text-gray-500">{item.count} times</span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Voice Recognition Accuracy</CardTitle>
                    <CardDescription>Weekly accuracy trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-600">94%</div>
                        <div className="text-sm text-gray-500">Average accuracy this week</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Monday</span>
                          <span>92%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tuesday</span>
                          <span>95%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Wednesday</span>
                          <span>96%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Thursday</span>
                          <span>93%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Today</span>
                          <span className="font-semibold">94%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
