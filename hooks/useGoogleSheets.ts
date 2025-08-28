"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react"
import { parseCSV } from "@/utils/parseCSV"

export interface ColumnConfig {
  name: string
  visible: boolean
  filterable: boolean
}

export interface FilterConfig {
  column: string
  value: string
  enabled: boolean
}

const dataCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useGoogleSheets = (spreadsheetId: string, sheetGid: string) => {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([])
  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = useMemo(() => `${spreadsheetId}-${sheetGid}`, [spreadsheetId, sheetGid])

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      setLoading(true)
      setError(null)

      try {
        if (!forceRefresh) {
          const cached = dataCache.get(cacheKey)
          if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            const { data: cachedData, columns: cachedColumns } = cached.data
            setData(cachedData)
            setColumns(cachedColumns)
            setLoading(false)
            return
          }
        }

        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}&t=${Date.now()}`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Cache-Control": forceRefresh ? "no-cache" : "max-age=300",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
        }

        const text = await response.text()
        if (!text.trim()) {
          throw new Error("No se encontraron datos en la hoja seleccionada")
        }

        const rows = parseCSV(text)
        if (rows.length === 0) {
          throw new Error("La hoja está vacía o no contiene datos válidos")
        }

        const headers = rows[0].map((h) => h.trim()).filter((h) => h)
        if (headers.length === 0) {
          throw new Error("No se encontraron columnas válidas")
        }

        setColumns(headers)

        setColumnConfig((prev) => {
          const prevHeaders = prev.map((c) => c.name)
          if (JSON.stringify(prevHeaders) === JSON.stringify(headers)) {
            return prev
          }
          return headers.map((header) => ({
            name: header,
            visible: true,
            filterable: true,
          }))
        })

        setFilterConfig((prev) => {
          const prevHeaders = prev.map((f) => f.column)
          if (JSON.stringify(prevHeaders) === JSON.stringify(headers)) {
            return prev
          }
          return headers.map((header) => ({
            column: header,
            value: "",
            enabled: false,
          }))
        })

        const formattedData = rows
          .slice(1)
          .filter((row) => row.some((cell) => cell && cell.trim()))
          .map((row, idx) => {
            const obj: any = { id: idx }
            headers.forEach((header, i) => {
              obj[header] = (row[i] || "").trim()
            })
            return obj
          })

        setData(formattedData)

        dataCache.set(cacheKey, {
          data: { data: formattedData, columns: headers },
          timestamp: Date.now(),
        })
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            setError("La solicitud tardó demasiado tiempo. Inténtalo de nuevo.")
          } else {
            setError(err.message)
          }
        } else {
          setError("Error desconocido al cargar los datos")
        }
        console.error("Error fetching Google Sheets data:", err)
      } finally {
        setLoading(false)
      }
    },
    [spreadsheetId, sheetGid, cacheKey],
  )

  const forceRefresh = useCallback(() => {
    dataCache.delete(cacheKey)
    fetchData(true)
  }, [cacheKey, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return useMemo(
    () => ({
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
    }),
    [data, columns, columnConfig, filterConfig, loading, error, fetchData, forceRefresh],
  )
}
