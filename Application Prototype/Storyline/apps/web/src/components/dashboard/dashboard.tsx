import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "src/components/ui/card"
import { Button } from "src/components/ui/button"
import { Badge } from "src/components/ui/badge"
import { Progress } from "src/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "src/components/ui/tabs"
import { BookOpen, Clock, TrendingUp, Users, Eye } from "lucide-react"
import { PlusIcon } from "@radix-ui/react-icons"

const recentStories = [
  {
    title: "The Midnight Garden",
    lastEdited: "2 hours ago",
    wordCount: 2847,
    status: "Draft",
    progress: 65,
  },
  {
    title: "Chronicles of Tomorrow",
    lastEdited: "1 day ago",
    wordCount: 5432,
    status: "In Review",
    progress: 90,
  },
  {
    title: "Whispers in the Wind",
    lastEdited: "3 days ago",
    wordCount: 1203,
    status: "Published",
    progress: 100,
  },
]

const stats = [
  { label: "Total Stories", value: "12", icon: BookOpen, change: "+2 this month" },
  { label: "Words Written", value: "45,231", icon: TrendingUp, change: "+3,421 this week" },
  { label: "Readers", value: "1,847", icon: Users, change: "+156 this month" },
  { label: "Total Views", value: "8,923", icon: Eye, change: "+892 this week" },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Writer!</h1>
          <p className="text-gray-600">Continue your storytelling journey</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stories">My Stories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                    <stat.icon className="w-4 h-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Stories */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Stories</CardTitle>
                      <CardDescription>Continue where you left off</CardDescription>
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
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Community</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">New followers</span>
                        <span className="font-semibold">+12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Story likes</span>
                        <span className="font-semibold">+47</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Comments</span>
                        <span className="font-semibold">+8</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stories">
            <Card>
              <CardHeader>
                <CardTitle>All Stories</CardTitle>
                <CardDescription>Manage your complete story collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Your stories will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Track your writing progress and reader engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Analytics data will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
