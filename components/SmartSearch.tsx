/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, X, Clock, TrendingUp, Hash, Calendar, Type } from "lucide-react"

interface SmartSearchProps {
  data: any[]
  columns: string[]
  onSearch: (query: string, filters?: any[]) => void
  placeholder?: string
}

interface SearchSuggestion {
  type: "column" | "value" | "recent" | "popular"
  column?: string
  value: string
  count?: number
  icon?: React.ReactNode
}

export function SmartSearch({ data, columns, onSearch, placeholder = "Buscar..." }: SmartSearchProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)

  // Generate intelligent suggestions
  const suggestions = useMemo(() => {
    if (!query.trim()) {
      // Show recent searches and popular values when no query
      const recent: SearchSuggestion[] = recentSearches.slice(0, 5).map((search) => ({
        type: "recent",
        value: search,
        icon: <Clock className="h-4 w-4" />,
      }))

      // Get popular values from data
      const popularValues: SearchSuggestion[] = []
      columns.slice(0, 3).forEach((column) => {
        const values = data.map((row) => String(row[column] || "")).filter(Boolean)
        const counts = values.reduce(
          (acc, val) => {
            acc[val] = (acc[val] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .forEach(([value, count]) => {
            popularValues.push({
              type: "popular",
              column,
              value,
              count,
              icon: <TrendingUp className="h-4 w-4" />,
            })
          })
      })

      return [...recent, ...popularValues.slice(0, 10)]
    }

    const searchTerm = query.toLowerCase()
    const suggestions: SearchSuggestion[] = []

    // Column name suggestions
    columns
      .filter((col) => col.toLowerCase().includes(searchTerm))
      .forEach((column) => {
        suggestions.push({
          type: "column",
          column,
          value: `en:${column}`,
          icon: <Hash className="h-4 w-4" />,
        })
      })

    // Value suggestions from data
    const valueSuggestions = new Map<string, { count: number; column: string }>()

    columns.forEach((column) => {
      const columnType = detectColumnType(column)
      data.forEach((row) => {
        const value = String(row[column] || "").toLowerCase()
        if (value.includes(searchTerm) && value.length > 0) {
          const key = `${column}:${value}`
          if (!valueSuggestions.has(key)) {
            valueSuggestions.set(key, { count: 0, column })
          }
          valueSuggestions.get(key)!.count++
        }
      })
    })

    // Convert to suggestions array
    Array.from(valueSuggestions.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 15)
      .forEach(([key, { count, column }]) => {
        const value = key.split(":")[1]
        const columnType = detectColumnType(column)
        suggestions.push({
          type: "value",
          column,
          value,
          count,
          icon: getColumnTypeIcon(columnType),
        })
      })

    return suggestions.slice(0, 20)
  }, [query, data, columns, recentSearches])

  const detectColumnType = (column: string) => {
    const values = data.map((row) => row[column]).filter(Boolean)

    // Check for dates
    const dateValues = values.filter((val) => !isNaN(Date.parse(String(val))))
    if (dateValues.length > values.length * 0.5) return "date"

    // Check for numbers
    const numericValues = values.filter((val) => !isNaN(Number(val)))
    if (numericValues.length > values.length * 0.7) return "number"

    return "text"
  }

  const getColumnTypeIcon = (type: string) => {
    switch (type) {
      case "date":
        return <Calendar className="h-4 w-4" />
      case "number":
        return <Hash className="h-4 w-4" />
      default:
        return <Type className="h-4 w-4" />
    }
  }

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      setRecentSearches((prev) => {
        const updated = [searchQuery, ...prev.filter((s) => s !== searchQuery)].slice(0, 10)
        localStorage.setItem("smartSearchRecent", JSON.stringify(updated))
        return updated
      })

      // Parse advanced search syntax
      const filters = parseAdvancedQuery(searchQuery)
      onSearch(searchQuery, filters)
    } else {
      onSearch("")
    }
    setIsOpen(false)
  }

  const parseAdvancedQuery = (query: string) => {
    const filters: { column: string; operator: string; value: string }[] = []

    // Parse "column:value" syntax
    const columnMatches = query.match(/(\w+):([^,\s]+)/g)
    if (columnMatches) {
      columnMatches.forEach((match) => {
        const [column, value] = match.split(":")
        if (columns.includes(column)) {
          filters.push({
            column,
            operator: "contains",
            value: value.replace(/"/g, ""),
          })
        }
      })
    }

    return filters
  }

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    let searchQuery = ""

    if (suggestion.type === "column") {
      searchQuery = `${suggestion.column}:`
    } else if (suggestion.type === "value" && suggestion.column) {
      searchQuery = `${suggestion.column}:"${suggestion.value}"`
    } else {
      searchQuery = suggestion.value
    }

    setQuery(searchQuery)
    handleSearch(searchQuery)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedSuggestion((prev) => Math.max(prev - 1, -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        handleSuggestionSelect(suggestions[selectedSuggestion])
      } else {
        handleSearch(query)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setSelectedSuggestion(-1)
    }
  }

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("smartSearchRecent")
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error("Error loading recent searches:", e)
      }
    }
  }, [])

  return (
    <div className="relative w-full max-w-md">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsOpen(true)
                setSelectedSuggestion(-1)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              className="pl-10 pr-10"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("")
                  onSearch("")
                }}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandList>
              {suggestions.length === 0 ? (
                <CommandEmpty>No se encontraron sugerencias</CommandEmpty>
              ) : (
                <>
                  {recentSearches.length > 0 && !query && (
                    <CommandGroup heading="Búsquedas recientes">
                      {suggestions
                        .filter((s) => s.type === "recent")
                        .map((suggestion, index) => (
                          <CommandItem
                            key={`recent-${index}`}
                            onSelect={() => handleSuggestionSelect(suggestion)}
                            className={selectedSuggestion === index ? "bg-accent" : ""}
                          >
                            {suggestion.icon}
                            <span className="ml-2">{suggestion.value}</span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}

                  {suggestions.filter((s) => s.type === "column").length > 0 && (
                    <CommandGroup heading="Buscar en columnas">
                      {suggestions
                        .filter((s) => s.type === "column")
                        .map((suggestion, index) => (
                          <CommandItem
                            key={`column-${index}`}
                            onSelect={() => handleSuggestionSelect(suggestion)}
                            className={selectedSuggestion === index ? "bg-accent" : ""}
                          >
                            {suggestion.icon}
                            <span className="ml-2">Buscar en {suggestion.column}</span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}

                  {suggestions.filter((s) => s.type === "value").length > 0 && (
                    <CommandGroup heading="Valores encontrados">
                      {suggestions
                        .filter((s) => s.type === "value")
                        .map((suggestion, index) => (
                          <CommandItem
                            key={`value-${index}`}
                            onSelect={() => handleSuggestionSelect(suggestion)}
                            className={selectedSuggestion === index ? "bg-accent" : ""}
                          >
                            {suggestion.icon}
                            <div className="ml-2 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="truncate">{suggestion.value}</span>
                                {suggestion.count && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {suggestion.count}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">en {suggestion.column}</div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}

                  {suggestions.filter((s) => s.type === "popular").length > 0 && !query && (
                    <CommandGroup heading="Valores populares">
                      {suggestions
                        .filter((s) => s.type === "popular")
                        .map((suggestion, index) => (
                          <CommandItem
                            key={`popular-${index}`}
                            onSelect={() => handleSuggestionSelect(suggestion)}
                            className={selectedSuggestion === index ? "bg-accent" : ""}
                          >
                            {suggestion.icon}
                            <div className="ml-2 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="truncate">{suggestion.value}</span>
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {suggestion.count}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">en {suggestion.column}</div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Search syntax help */}
      {query.includes(":") && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <Card className="p-2">
            <CardContent className="p-0">
              <div className="text-xs text-muted-foreground">
                <p>
                  <strong>Sintaxis avanzada:</strong>
                </p>
                <p>• columna:valor - Buscar valor específico en columna</p>
                <p>• &quot;texto exacto&quot; - Búsqueda de texto exacto</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
