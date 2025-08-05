import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "src/components/ui/card"
import { PenTool, BookOpen, Users, Zap, Shield, Palette } from "lucide-react"

const features = [
  {
    icon: PenTool,
    title: "Intuitive Editor",
    description: "Write with our distraction-free editor designed for creativity and flow.",
    color: "text-blue-600",
  },
  {
    icon: BookOpen,
    title: "Story Organization",
    description: "Keep your stories organized with chapters, tags, and custom collections.",
    color: "text-green-600",
  },
  {
    icon: Users,
    title: "Collaborative Writing",
    description: "Work together with other writers and get feedback from the community.",
    color: "text-purple-600",
  },
  {
    icon: Zap,
    title: "AI-Powered Insights",
    description: "Get writing suggestions and insights to improve your storytelling.",
    color: "text-yellow-600",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your stories are private by default. Share only when you're ready.",
    color: "text-red-600",
  },
  {
    icon: Palette,
    title: "Beautiful Themes",
    description: "Customize your writing environment with beautiful themes and layouts.",
    color: "text-indigo-600",
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Write</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful tools and features designed to help you focus on what matters most - your story.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
