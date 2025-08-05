"use client"

import type React from "react"

import { Button } from "src/components/ui/button"

interface SuggestionChipProps {
  onClick: () => void
  children: React.ReactNode
}

export function SuggestionChip({ onClick, children }: SuggestionChipProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-auto whitespace-normal text-left justify-start bg-white hover:bg-amber-50 hover:border-amber-300 text-gray-700 border-amber-200 text-xs py-2 font-medium shadow-sm"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
