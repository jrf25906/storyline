"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "src/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "src/components/ui/sheet"
import { Menu, BookOpen, PenTool, Home } from "lucide-react"
import { PersonIcon, GearIcon } from "@radix-ui/react-icons"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/stories", label: "My Stories", icon: BookOpen },
    { href: "/write", label: "Write", icon: PenTool },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="Storyline" width={32} height={32} />
          <span className="text-2xl font-bold text-gray-900 font-serif">Storyline</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.slice(1, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          ))}
          <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium">
            Get Started
          </Button>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col space-y-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 text-lg text-gray-600 hover:text-gray-900 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <Button className="mt-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium">
                Get Started
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
