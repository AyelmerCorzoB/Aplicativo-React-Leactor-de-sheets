"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, FileSpreadsheet, BarChart3, Filter, Download, Settings, RefreshCw } from "lucide-react"

interface MobileNavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  fetchData: () => void
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  onExport: () => void
}

export const MobileNavigation = ({
  activeTab,
  setActiveTab,
  fetchData,
  showSettings,
  setShowSettings,
  onExport,
}: MobileNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { id: "data", label: "Datos", icon: FileSpreadsheet },
    { id: "analytics", label: "Análisis", icon: BarChart3 },
    { id: "filters", label: "Filtros", icon: Filter },
  ]

  const actions = [
    { label: "Actualizar", icon: RefreshCw, action: fetchData },
    { label: "Exportar", icon: Download, action: onExport },
    { label: "Configuración", icon: Settings, action: () => setShowSettings(!showSettings) },
  ]

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="border-2 bg-transparent">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" style={{ color: "#03A66A" }} />
              Gestión de Datos
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Navigation */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Navegación</h3>
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setActiveTab(item.id)
                      setIsOpen(false)
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Acciones</h3>
              <div className="space-y-1">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      action.action()
                      setIsOpen(false)
                    }}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
