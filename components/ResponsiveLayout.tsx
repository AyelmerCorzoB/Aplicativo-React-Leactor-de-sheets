"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  className?: string
}

export const ResponsiveLayout = ({ children, sidebar, header, className }: ResponsiveLayoutProps) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header */}
      {header && (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-2">{header}</div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        {sidebar && !isMobile && (
          <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 bg-card border-r">
            <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
          </aside>
        )}

        {/* Main content */}
        <main className={cn("flex-1 overflow-x-hidden", sidebar && !isMobile ? "md:ml-64" : "", header ? "pt-4" : "")}>
          <div className="container mx-auto px-4 py-4 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
