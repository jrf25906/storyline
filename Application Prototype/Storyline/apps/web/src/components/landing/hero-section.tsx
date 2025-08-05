import { Button } from "src/components/ui/button"
import { Sparkles } from "lucide-react"
import { ArrowRightIcon } from "@radix-ui/react-icons"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 bg-white/80 rounded-full px-4 py-2 text-sm font-medium text-amber-800 border border-amber-200">
              <Sparkles className="w-4 h-4" />
              <span>Your stories, beautifully crafted</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight font-serif">
              Craft Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                {" "}
                Stories
              </span>
              <br />
              With Purpose
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed max-w-lg font-medium">
              Transform your ideas into compelling narratives with our intuitive writing platform. From first draft to
              published masterpiece.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium"
              >
                Start Writing
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium bg-transparent"
              >
                Explore Stories
              </Button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">10,000+ Active Writers</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="font-medium">50,000+ Stories Published</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-amber-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl transform -rotate-6 opacity-20"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
