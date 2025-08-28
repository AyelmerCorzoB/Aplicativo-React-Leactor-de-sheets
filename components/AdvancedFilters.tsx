/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Filter, Plus, X, CalendarIcon, Save, Trash2, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export interface AdvancedFilter {
  id: string
  column: string
  operator: string
  value: string | number | Date | [Date, Date] | string[]
  enabled: boolean
  type: "text" | "number" | "date" | "dateRange" | "multiSelect"
}

export interface FilterPreset {
  id: string
  name: string
  filters: AdvancedFilter[]
  created: Date
}

interface AdvancedFiltersProps {
  columns: string[]
  data: any[]
  filters: AdvancedFilter[]
  setFilters: (filters: AdvancedFilter[]) => void
  presets: FilterPreset[]
  setPresets: (presets: FilterPreset[]) => void
  onApplyFilters: (filters: AdvancedFilter[]) => void
}

const OPERATORS = {
  text: [
    { value: "contains", label: "Contiene" },
    { value: "equals", label: "Igual a" },
    { value: "startsWith", label: "Comienza con" },
    { value: "endsWith", label: "Termina con" },
    { value: "notContains", label: "No contiene" },
    { value: "isEmpty", label: "Está vacío" },
    { value: "isNotEmpty", label: "No está vacío" },
  ],
  number: [
    { value: "equals", label: "Igual a" },
    { value: "greaterThan", label: "Mayor que" },
    { value: "lessThan", label: "Menor que" },
    { value: "greaterThanOrEqual", label: "Mayor o igual que" },
    { value: "lessThanOrEqual", label: "Menor o igual que" },
    { value: "between", label: "Entre" },
    { value: "isEmpty", label: "Está vacío" },
    { value: "isNotEmpty", label: "No está vacío" },
  ],
  date: [
    { value: "equals", label: "Igual a" },
    { value: "before", label: "Antes de" },
    { value: "after", label: "Después de" },
    { value: "between", label: "Entre" },
    { value: "isEmpty", label: "Está vacío" },
    { value: "isNotEmpty", label: "No está vacío" },
  ],
}

export function AdvancedFilters({
  columns,
  data,
  filters,
  setFilters,
  presets,
  setPresets,
  onApplyFilters,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [searchSuggestions, setSearchSuggestions] = useState<Record<string, string[]>>({})
  const [logicOperator, setLogicOperator] = useState<"AND" | "OR">("AND")

  // Analyze column types
  const columnTypes = useMemo(() => {
    const types: Record<string, "text" | "number" | "date"> = {}

    columns.forEach((column) => {
      const values = data.map((row) => row[column]).filter(Boolean)

      // Check if it's a date
      const dateValues = values.filter((val) => !isNaN(Date.parse(String(val))))
      if (dateValues.length > values.length * 0.5) {
        types[column] = "date"
        return
      }

      // Check if it's a number
      const numericValues = values.filter((val) => !isNaN(Number(val)) && String(val).trim() !== "")
      if (numericValues.length > values.length * 0.7) {
        types[column] = "number"
        return
      }

      // Default to text
      types[column] = "text"
    })

    return types
  }, [columns, data])

  // Generate suggestions for text fields
  const generateSuggestions = (column: string) => {
    if (searchSuggestions[column]) return searchSuggestions[column]

    const values = data
      .map((row) => String(row[column] || "").trim())
      .filter(Boolean)
      .filter((val, index, arr) => arr.indexOf(val) === index)
      .sort()
      .slice(0, 10)

    setSearchSuggestions((prev) => ({ ...prev, [column]: values }))
    return values
  }

  const addFilter = () => {
    const newFilter: AdvancedFilter = {
      id: Date.now().toString(),
      column: columns[0],
      operator: "contains",
      value: "",
      enabled: true,
      type: "text",
    }
    setFilters([...filters, newFilter])
  }

  const updateFilter = (id: string, updates: Partial<AdvancedFilter>) => {
    setFilters(
      filters.map((filter) =>
        filter.id === id
          ? {
              ...filter,
              ...updates,
              // Reset value when column or operator changes
              ...(updates.column || updates.operator ? { value: "" } : {}),
            }
          : filter,
      ),
    )
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter((filter) => filter.id !== id))
  }

  const savePreset = () => {
    if (!newPresetName.trim()) return

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      filters: filters.filter((f) => f.enabled),
      created: new Date(),
    }

    setPresets([...presets, newPreset])
    setNewPresetName("")
  }

  const loadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters)
    onApplyFilters(preset.filters)
  }

  const deletePreset = (id: string) => {
    setPresets(presets.filter((p) => p.id !== id))
  }

  const clearAllFilters = () => {
    setFilters([])
    onApplyFilters([])
  }

  const applyFilters = () => {
    onApplyFilters(filters.filter((f) => f.enabled))
    setIsOpen(false)
  }

  const activeFiltersCount = filters.filter((f) => f.enabled).length

  const renderFilterValue = (filter: AdvancedFilter) => {
    const columnType = columnTypes[filter.column] || "text"

    if (filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
      return null
    }

    switch (columnType) {
      case "date":
        if (filter.operator === "between") {
          return (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {Array.isArray(filter.value) && filter.value[0]
                      ? format(filter.value[0], "dd/MM/yyyy", { locale: es })
                      : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={Array.isArray(filter.value) ? filter.value[0] : undefined}
                    onSelect={(date) =>
                      updateFilter(filter.id, {
                        value: [date || new Date(), Array.isArray(filter.value) ? filter.value[1] : new Date()],
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {Array.isArray(filter.value) && filter.value[1]
                      ? format(filter.value[1], "dd/MM/yyyy", { locale: es })
                      : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={Array.isArray(filter.value) ? filter.value[1] : undefined}
                    onSelect={(date) =>
                      updateFilter(filter.id, {
                        value: [Array.isArray(filter.value) ? filter.value[0] : new Date(), date || new Date()],
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )
        } else {
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filter.value instanceof Date
                    ? format(filter.value, "dd/MM/yyyy", { locale: es })
                    : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filter.value instanceof Date ? filter.value : undefined}
                  onSelect={(date) => updateFilter(filter.id, { value: date || new Date() })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )
        }

      case "number":
        if (filter.operator === "between") {
          return (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Desde"
                value={Array.isArray(filter.value) ? filter.value[0] : ""}
                onChange={(e) =>
                  updateFilter(filter.id, {
                    value: [Number(e.target.value), Array.isArray(filter.value) ? filter.value[1] : 0],
                  })
                }
                className="w-24"
              />
              <Input
                type="number"
                placeholder="Hasta"
                value={Array.isArray(filter.value) ? filter.value[1] : ""}
                onChange={(e) =>
                  updateFilter(filter.id, {
                    value: [Array.isArray(filter.value) ? filter.value[0] : 0, Number(e.target.value)],
                  })
                }
                className="w-24"
              />
            </div>
          )
        } else {
          return (
            <Input
              type="number"
              placeholder="Valor"
              value={typeof filter.value === "number" ? filter.value : ""}
              onChange={(e) => updateFilter(filter.id, { value: Number(e.target.value) })}
              className="w-32"
            />
          )
        }

      default:
        const suggestions = generateSuggestions(filter.column)
        return (
          <div className="relative">
            <Input
              placeholder="Valor"
              value={typeof filter.value === "string" ? filter.value : ""}
              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
              className="w-48"
              list={`suggestions-${filter.id}`}
            />
            <datalist id={`suggestions-${filter.id}`}>
              {suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>
        )
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="relative bg-transparent">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avanzados
            {activeFiltersCount > 0 && (
              <Badge
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                style={{ backgroundColor: "#F26B76", color: "white" }}
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Filtros Avanzados</DialogTitle>
            <DialogDescription>Configura filtros personalizados para tus datos</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[60vh]">
            {/* Filters Configuration */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Label>Lógica de filtros:</Label>
                  <Select value={logicOperator} onValueChange={(value: "AND" | "OR") => setLogicOperator(value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">Y</SelectItem>
                      <SelectItem value="OR">O</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addFilter} size="sm" style={{ backgroundColor: "#0BC4D9", color: "white" }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Filtro
                </Button>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {filters.map((filter, index) => (
                    <Card key={filter.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={filter.enabled}
                          onCheckedChange={(enabled) => updateFilter(filter.id, { enabled })}
                        />

                        {index > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {logicOperator}
                          </Badge>
                        )}

                        <Select value={filter.column} onValueChange={(column) => updateFilter(filter.id, { column })}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((column) => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={filter.operator}
                          onValueChange={(operator) => updateFilter(filter.id, { operator })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS[columnTypes[filter.column] || "text"].map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {renderFilterValue(filter)}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(filter.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}

                  {filters.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hay filtros configurados</p>
                      <p className="text-sm">Haz clic en &quot;Agregar Filtro&quot; para comenzar</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Presets */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Filtros Guardados</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Nombre del preset"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={savePreset}
                    size="sm"
                    disabled={!newPresetName.trim() || filters.length === 0}
                    style={{ backgroundColor: "#03A66A", color: "white" }}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <Card key={preset.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{preset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {preset.filters.length} filtros • {format(preset.created, "dd/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => loadPreset(preset)}>
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePreset(preset.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {presets.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <Save className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay presets guardados</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={clearAllFilters}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Todo
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={applyFilters} style={{ backgroundColor: "#F26B76", color: "white" }}>
                Aplicar Filtros ({activeFiltersCount})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick filter indicators */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters
            .filter((f) => f.enabled)
            .slice(0, 3)
            .map((filter) => (
              <Badge
                key={filter.id}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeFilter(filter.id)}
                style={{ backgroundColor: "#0BC4D9", color: "white" }}
              >
                {filter.column}:{" "}
                {OPERATORS[columnTypes[filter.column] || "text"].find((op) => op.value === filter.operator)?.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          {activeFiltersCount > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{activeFiltersCount - 3} más
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
