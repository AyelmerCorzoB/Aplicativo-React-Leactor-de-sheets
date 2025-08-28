"use client"
import { useState, useMemo } from "react"
import { Filter } from "lucide-react"
import { useGoogleSheets } from "@/hooks/useGoogleSheets"
import { DataTable } from "@/components/ui/datatable"
import { SettingsPanel } from "@/components/SettingsPanel"
import { Header } from "@/components/Header"
import { exportToExcel } from "@/utils/exportToExcel"

const SPREADSHEET_ID = "1i62vYPPfk6vQr1IRXIzrvthu1CFs-WSyBI61Dk4rZgI"

const AVAILABLE_SHEETS = [
  { name: "DATOS CLIENTES", gid: "0" },
  { name: "DATOS CLIENTES2", gid: "673856019" },
]

export default function GoogleSheetsApp() {
  const [selectedSheet, setSelectedSheet] = useState(AVAILABLE_SHEETS[0].gid)
  const [globalSearch, setGlobalSearch] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  const { data, columns, columnConfig, setColumnConfig, filterConfig, setFilterConfig, loading, error, fetchData } =
    useGoogleSheets(SPREADSHEET_ID, selectedSheet)

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []

    let filtered = [...data]

    // Apply global search
    if (globalSearch.trim()) {
      const searchTerm = globalSearch.toLowerCase().trim()
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm)),
      )
    }

    // Apply column filters
    const activeFilters = filterConfig.filter((f) => f.enabled && f.value.trim())
    activeFilters.forEach((filter) => {
      filtered = filtered.filter((row) =>
        String(row[filter.column] || "")
          .toLowerCase()
          .includes(filter.value.toLowerCase()),
      )
    })

    return filtered
  }, [data, globalSearch, filterConfig])

  const handleExport = () => {
    try {
      exportToExcel(filteredData, columns, columnConfig, "datos-clientes.xlsx")
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Header
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          availableSheets={AVAILABLE_SHEETS}
          selectedSheet={selectedSheet}
          setSelectedSheet={setSelectedSheet}
          fetchData={fetchData}
          exportToCSV={handleExport}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
        />

        {showSettings && (
          <div className="bg-card border-2 border-secondary/20 rounded-lg p-4 shadow-sm">
            <SettingsPanel
              columns={columns}
              columnConfig={columnConfig}
              setColumnConfig={setColumnConfig}
              filterConfig={filterConfig}
              setFilterConfig={setFilterConfig}
            />
          </div>
        )}

        <div className="space-y-4">
          {!loading && !error && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {filteredData.length} de {data.length} registros
                {globalSearch && ` (filtrado por: "${globalSearch}")`}
              </span>
              {filterConfig.some((f) => f.enabled) && (
                <span className="flex items-center gap-1" style={{ color: "#03A66A" }}>
                  <Filter className="h-3 w-3" />
                  {filterConfig.filter((f) => f.enabled).length} filtros activos
                </span>
              )}
            </div>
          )}

          <div className="bg-card border-2 border-primary/20 rounded-lg overflow-hidden shadow-sm">
            <DataTable
              data={filteredData}
              columns={columns}
              columnConfig={columnConfig}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
