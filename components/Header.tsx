"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, Download, RefreshCw, Settings, Search } from 'lucide-react'
import { SheetSelector } from "./SheetSelector"
import { MobileNavigation } from "./MobileNavigation"

interface HeaderProps {
  globalSearch: string
  setGlobalSearch: (value: string) => void
  availableSheets: { name: string; gid: string }[]
  selectedSheet: string
  setSelectedSheet: (gid: string) => void
  fetchData: () => void
  exportToCSV: () => void
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  // Added mobile navigation props
  activeTab?: string
  setActiveTab?: (tab: string) => void
  onExport?: () => void
}

export const Header = ({
  globalSearch,
  setGlobalSearch,
  availableSheets,
  selectedSheet,
  setSelectedSheet,
  fetchData,
  exportToCSV,
  showSettings,
  setShowSettings,
  // Added mobile navigation props
  activeTab = "data",
  setActiveTab = () => {},
  onExport = exportToCSV,
}: HeaderProps) => {
  return (
    <header className="bg-card border rounded-lg p-3 md:p-6 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#03A66A20" }}
            >
              <FileSpreadsheet className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#03A66A" }} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">Gestión de Datos</h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate max-w-[200px] md:max-w-none">
                {availableSheets.find((s) => s.gid === selectedSheet)?.name || "Cargando..."}
              </p>
            </div>
          </div>
          
          {/* Added mobile navigation */}
          <MobileNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fetchData={fetchData}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            onExport={onExport}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Sheet Selector - Hidden on mobile, shown in mobile nav */}
          <div className="hidden md:block">
            <SheetSelector availableSheets={availableSheets} value={selectedSheet} onChange={setSelectedSheet} />
          </div>

          {/* Search Bar */}
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-9 pr-4 border-2 focus:border-secondary text-sm"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>

          {/* Action Buttons - Hidden on mobile, shown in mobile nav */}
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="flex items-center gap-2 border-2 hover:border-secondary hover:text-secondary bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden lg:inline">Actualizar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2 border-2 hover:border-accent hover:text-accent bg-transparent"
            >
              <Download className="h-4 w-4" />
              <span className="hidden lg:inline">Exportar</span>
            </Button>
            <Button
              variant={showSettings ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 ${
                showSettings ? "bg-primary hover:bg-primary/90" : "border-2 hover:border-primary hover:text-primary"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline">{showSettings ? "Ocultar" : "Configurar"}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
