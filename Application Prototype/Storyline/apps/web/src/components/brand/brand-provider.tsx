"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { brandTokens, brandGradients, componentVariants } from "src/lib/brand-tokens"

interface BrandContextType {
  tokens: typeof brandTokens
  gradients: typeof brandGradients
  variants: typeof componentVariants
}

const BrandContext = createContext<BrandContextType | undefined>(undefined)

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const value = {
    tokens: brandTokens,
    gradients: brandGradients,
    variants: componentVariants,
  }

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export function useBrand() {
  const context = useContext(BrandContext)
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider")
  }
  return context
}

// Utility hooks for specific brand elements
export function useBrandColors() {
  const { tokens } = useBrand()
  return tokens.colors
}

export function useBrandTypography() {
  const { tokens } = useBrand()
  return tokens.typography
}

export function useBrandSpacing() {
  const { tokens } = useBrand()
  return tokens.spacing
}

export function useBrandGradients() {
  const { gradients } = useBrand()
  return gradients
}

export function useComponentVariants() {
  const { variants } = useBrand()
  return variants
}
