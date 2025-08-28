"use client"
import { useState, useMemo } from "react"
import { Filter, BarChart3 } from "lucide-react"
import { useGoogleSheets } from "@/hooks/useGoogleSheets"
import { DataTable } from "@/components/ui/datatable"
import { SettingsPanel } from "@/components/SettingsPanel"
import { Header } from "@/components/Header"
import { DataVisualization } from "@/components/DataVisualization"
import { ResponsiveLayout } from "@/components/ResponsiveLayout"
import { exportToExcel } from "@/utils/exportToExcel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const SPREADSHEET_ID = "1oGIHqw14DrjWUztuXUBCgDazO-Po8tb4mSPoLPnqSEg"

const AVAILABLE_SHEETS = [
  { name: "AFILIADOS", gid: "0" },
  { name: "ALIADOS", gid: "860527074" },
  { name: "TODOS", gid: "1038443642" }
]

export default function GoogleSheetsApp() {
  const [selectedSheet, setSelectedSheet] = useState(AVAILABLE_SHEETS[0].gid)
  const [globalSearch, setGlobalSearch] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState("data")

  const {
    data,
    columns,
    columnConfig,
    setColumnConfig,
    filterConfig,
    setFilterConfig,
    loading,
    error,
    fetchData,
    forceRefresh,
  } = useGoogleSheets(SPREADSHEET_ID, selectedSheet)

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

  const headerComponent = (
    <Header
      globalSearch={globalSearch}
      setGlobalSearch={setGlobalSearch}
      availableSheets={AVAILABLE_SHEETS}
      selectedSheet={selectedSheet}
      setSelectedSheet={setSelectedSheet}
      fetchData={forceRefresh}
      exportToCSV={handleExport}
      showSettings={showSettings}
      setShowSettings={setShowSettings}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onExport={handleExport}
    />
  )

  const sidebarComponent = showSettings ? (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Configuración</h3>
      <SettingsPanel
        columns={columns}
        columnConfig={columnConfig}
        setColumnConfig={setColumnConfig}
        filterConfig={filterConfig}
        setFilterConfig={setFilterConfig}
      />
    </div>
  ) : null

  return (
    <ResponsiveLayout header={headerComponent} sidebar={sidebarComponent} className="min-h-screen">
      <div className="space-y-4 md:space-y-6">
        {showSettings && (
          <div className="md:hidden bg-card border-2 border-secondary/20 rounded-lg p-4 shadow-sm">
            <SettingsPanel
              columns={columns}
              columnConfig={columnConfig}
              setColumnConfig={setColumnConfig}
              filterConfig={filterConfig}
              setFilterConfig={setFilterConfig}
            />
          </div>
        )}

        <Tabs
          value={activeTab === "analytics" ? "analytics" : "table"}
          onValueChange={(value) => setActiveTab(value === "analytics" ? "analytics" : "data")}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Datos</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Análisis</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            <DataTable
              data={filteredData}
              columns={columns}
              columnConfig={columnConfig}
              setColumnConfig={setColumnConfig}
              filterConfig={filterConfig}
              setFilterConfig={setFilterConfig}
              globalSearch={globalSearch}
              setGlobalSearch={setGlobalSearch}
              onRefresh={forceRefresh}
              onExport={handleExport}
              loading={loading}
              error={error}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <DataVisualization data={filteredData} columns={columns} />
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  )
}
