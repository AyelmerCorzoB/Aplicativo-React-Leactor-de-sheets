/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { SortAsc, SortDesc, Eye, MoreHorizontal, RefreshCw } from "lucide-react"
import { AdvancedFilters, type AdvancedFilter, type FilterPreset } from "@/components/AdvancedFilters"
import { SmartSearch } from "@/components/SmartSearch"
import { ExportImportManager } from "@/components/ExportImportManager"
import type { ColumnConfig, FilterConfig } from "@/hooks/useGoogleSheets"

interface DataManagementProps {
  data: any[]
  columns: string[]
  columnConfig: ColumnConfig[]
  setColumnConfig: (config: ColumnConfig[]) => void
  filterConfig: FilterConfig[]
  setFilterConfig: (config: FilterConfig[]) => void
  globalSearch: string
  setGlobalSearch: (search: string) => void
  onRefresh: () => void
  onExport: () => void
  onDataImported?: (newData: any[], newColumns: string[]) => void
}

export function DataManagement({
  data,
  columns,
  columnConfig,
  setColumnConfig,
  filterConfig,
  setFilterConfig,
  globalSearch,
  setGlobalSearch,
  onRefresh,
  onExport,
  onDataImported,
}: DataManagementProps) {
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: "asc" | "desc" } | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewMode, setViewMode] = useState<"table" | "cards" | "compact">("table")

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilter[]>([])
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([])

  const sortedAndFilteredData = useMemo(() => {
    let filtered = [...data]

    const activeAdvancedFilters = advancedFilters.filter((f) => f.enabled)
    if (activeAdvancedFilters.length > 0) {
      filtered = filtered.filter((row) => {
        return activeAdvancedFilters.every((filter) => {
          const cellValue = String(row[filter.column] || "").toLowerCase()
          const filterValue = String(filter.value || "").toLowerCase()

          switch (filter.operator) {
            case "contains":
              return cellValue.includes(filterValue)
            case "equals":
              return cellValue === filterValue
            case "startsWith":
              return cellValue.startsWith(filterValue)
            case "endsWith":
              return cellValue.endsWith(filterValue)
            case "notContains":
              return !cellValue.includes(filterValue)
            case "isEmpty":
              return cellValue === ""
            case "isNotEmpty":
              return cellValue !== ""
            case "greaterThan":
              return Number(cellValue) > Number(filterValue)
            case "lessThan":
              return Number(cellValue) < Number(filterValue)
            case "greaterThanOrEqual":
              return Number(cellValue) >= Number(filterValue)
            case "lessThanOrEqual":
              return Number(cellValue) <= Number(filterValue)
            case "between":
              if (Array.isArray(filter.value)) {
                const num = Number(cellValue)
                return num >= Number(filter.value[0]) && num <= Number(filter.value[1])
              }
              return false
            case "before":
              if (filter.value instanceof Date) {
                const cellDate = new Date(cellValue)
                return cellDate < filter.value
              }
              return false
            case "after":
              if (filter.value instanceof Date) {
                const cellDate = new Date(cellValue)
                return cellDate > filter.value
              }
              return false
            default:
              return true
          }
        })
      })
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = String(a[sortConfig.column] || "")
        const bVal = String(b[sortConfig.column] || "")

        const comparison = aVal.localeCompare(bVal, undefined, { numeric: true })
        return sortConfig.direction === "asc" ? comparison : -comparison
      })
    }

    return filtered
  }, [data, advancedFilters, sortConfig])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedAndFilteredData.slice(startIndex, startIndex + pageSize)
  }, [sortedAndFilteredData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedAndFilteredData.length / pageSize)

  const handleSort = (column: string) => {
    setSortConfig((prev) => {
      if (prev?.column === column) {
        return prev.direction === "asc" ? { column, direction: "desc" } : null
      }
      return { column, direction: "asc" }
    })
  }

  const toggleColumnVisibility = (columnName: string) => {
    setColumnConfig((prev) => prev.map((col) => (col.name === columnName ? { ...col, visible: !col.visible } : col)))
  }

  const toggleRowSelection = (index: number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const selectAllRows = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedData.map((_, index) => index)))
    }
  }

  const handleSmartSearch = (query: string, filters?: any[]) => {
    setGlobalSearch(query)
    if (filters && filters.length > 0) {
      const newAdvancedFilters: AdvancedFilter[] = filters.map((filter, index) => ({
        id: `smart-${Date.now()}-${index}`,
        column: filter.column,
        operator: filter.operator,
        value: filter.value,
        enabled: true,
        type: "text",
      }))
      setAdvancedFilters((prev) => [...prev, ...newAdvancedFilters])
    }
  }

  const visibleColumns = columns.filter((col) => columnConfig.find((c) => c.name === col)?.visible)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <SmartSearch
            data={data}
            columns={columns}
            onSearch={handleSmartSearch}
            placeholder="Búsqueda inteligente..."
          />

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>

            <ExportImportManager
              data={sortedAndFilteredData}
              columns={columns}
              columnConfig={columnConfig}
              onDataImported={onDataImported || (() => {})}
            />

            <AdvancedFilters
              columns={columns}
              data={data}
              filters={advancedFilters}
              setFilters={setAdvancedFilters}
              presets={filterPresets}
              setPresets={setFilterPresets}
              onApplyFilters={(filters) => setAdvancedFilters(filters)}
            />

            {/* Column Visibility - Mobile Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden bg-transparent">
                  <Eye className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Columnas Visibles</SheetTitle>
                  <SheetDescription>Selecciona qué columnas mostrar en la tabla</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-200px)] mt-4">
                  <div className="space-y-3">
                    {columns.map((column) => {
                      const config = columnConfig.find((c) => c.name === column)
                      return (
                        <div key={column} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mobile-${column}`}
                            checked={config?.visible || false}
                            onCheckedChange={() => toggleColumnVisibility(column)}
                          />
                          <label htmlFor={`mobile-${column}`} className="text-sm font-medium">
                            {column}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Column Visibility - Desktop Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex bg-transparent">
                  <Eye className="h-4 w-4 mr-2" />
                  Columnas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Gestionar Columnas</DialogTitle>
                  <DialogDescription>Selecciona qué columnas mostrar en la tabla</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {columns.map((column) => {
                      const config = columnConfig.find((c) => c.name === column)
                      return (
                        <div key={column} className="flex items-center space-x-2">
                          <Checkbox
                            id={column}
                            checked={config?.visible || false}
                            onCheckedChange={() => toggleColumnVisibility(column)}
                          />
                          <label htmlFor={column} className="text-sm font-medium">
                            {column}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex gap-1">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            style={{ backgroundColor: viewMode === "table" ? "#F26B76" : undefined }}
          >
            Tabla
          </Button>
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
            style={{ backgroundColor: viewMode === "cards" ? "#F26B76" : undefined }}
          >
            Tarjetas
          </Button>
          <Button
            variant={viewMode === "compact" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("compact")}
            style={{ backgroundColor: viewMode === "compact" ? "#F26B76" : undefined }}
          >
            Compacto
          </Button>
        </div>
      </div>

      {/* Data Display */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">
                      <Checkbox
                        checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                        onCheckedChange={selectAllRows}
                      />
                    </th>
                    {visibleColumns.map((column) => (
                      <th key={column} className="p-2 text-left">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(column)}
                          className="h-auto p-0 font-medium hover:bg-transparent"
                        >
                          {column}
                          {sortConfig?.column === column &&
                            (sortConfig.direction === "asc" ? (
                              <SortAsc className="ml-1 h-3 w-3" />
                            ) : (
                              <SortDesc className="ml-1 h-3 w-3" />
                            ))}
                        </Button>
                      </th>
                    ))}
                    <th className="p-2 text-left w-12">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <Checkbox checked={selectedRows.has(index)} onCheckedChange={() => toggleRowSelection(index)} />
                      </td>
                      {visibleColumns.map((column) => (
                        <td key={column} className="p-2 text-sm">
                          <div className="max-w-[200px] truncate" title={String(row[column] || "")}>
                            {String(row[column] || "")}
                          </div>
                        </td>
                      ))}
                      <td className="p-2">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map((row, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {String(row[visibleColumns[0]] || `Registro ${index + 1}`)}
                  </CardTitle>
                  <Checkbox checked={selectedRows.has(index)} onCheckedChange={() => toggleRowSelection(index)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {visibleColumns.slice(1, 4).map((column) => (
                  <div key={column} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">{column}:</span>
                    <span className="text-sm truncate max-w-[150px]" title={String(row[column] || "")}>
                      {String(row[column] || "")}
                    </span>
                  </div>
                ))}
                {visibleColumns.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{visibleColumns.length - 4} más campos
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === "compact" && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {paginatedData.map((row, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Checkbox checked={selectedRows.has(index)} onCheckedChange={() => toggleRowSelection(index)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {String(row[visibleColumns[0]] || `Registro ${index + 1}`)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {visibleColumns
                          .slice(1, 3)
                          .map((col) => String(row[col] || ""))
                          .join(" • ")}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrando</span>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>de {sortedAndFilteredData.length} registros</span>
          {selectedRows.size > 0 && (
            <Badge variant="secondary" style={{ backgroundColor: "#0BC4D9", color: "white" }}>
              {selectedRows.size} seleccionados
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                  style={{ backgroundColor: currentPage === page ? "#F26B76" : undefined }}
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
