"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, Download, RefreshCw, Settings, Search } from "lucide-react"
import { SheetSelector } from "./SheetSelector"

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
}: HeaderProps) => {
  return (
    <header className="bg-card border rounded-lg p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <img className="h-6 w-6 text-primary" src="/FONCO_BLANCO_RMV.png"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Gestión de Datos</h1>
            <p className="text-sm text-muted-foreground">
              {availableSheets.find((s) => s.gid === selectedSheet)?.name || "Cargando..."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Sheet Selector */}
          <SheetSelector availableSheets={availableSheets} value={selectedSheet} onChange={setSelectedSheet} />

          {/* Search Bar */}
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar en todos los campos..."
              className="pl-9 pr-4"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="flex items-center gap-2 bg-transparent">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-transparent"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button
              variant={showSettings ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{showSettings ? "Ocultar" : "Configurar"}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
