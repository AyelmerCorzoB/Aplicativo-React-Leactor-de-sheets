/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"

export interface GoogleSheetsConfig {
  spreadsheetId: string
  sheetName?: string
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig

  constructor(config: GoogleSheetsConfig) {
    this.config = config
  }

  async fetchData(): Promise<any[]> {
    try {
      // Usar el formato de exportación CSV público
      const url = `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/export?format=csv${this.config.sheetName ? `&gid=${this.config.sheetName}` : ''}`

      const response = await fetch(url)
      const text = await response.text()

      if (!text) {
        throw new Error("No data found in the spreadsheet")
      }

      // Convertir CSV a objetos
      const rows = text.trim().split("\n").map((r) => r.split(","));
      const [headers, ...dataRows] = rows;

      return dataRows.map((row) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim().toLowerCase().replace(/\s+/g, "_")] = row[index] || "";
        });
        return obj;
      });
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error)
      throw error
    }
  }
}

// Hook para usar el servicio de Google Sheets
export function useGoogleSheets(config: GoogleSheetsConfig) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const service = new GoogleSheetsService(config)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await service.fetchData()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, fetchData }
}