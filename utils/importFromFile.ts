/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from "xlsx"
import { parseCSV } from "./parseCSV"

interface ImportResult {
  success: boolean
  data?: any[]
  columns?: string[]
  errors?: string[]
  warnings?: string[]
  preview?: any[]
}

export const importFromFile = async (file: File): Promise<ImportResult> => {
  try {
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    switch (fileExtension) {
      case "csv":
        return await importFromCSV(file)
      case "xlsx":
      case "xls":
        return await importFromExcel(file)
      case "json":
        return await importFromJSON(file)
      default:
        return {
          success: false,
          errors: [`Formato de archivo no soportado: ${fileExtension}`],
        }
    }
  } catch (error) {
    return {
      success: false,
      errors: [`Error al procesar el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`],
    }
  }
}

const importFromCSV = async (file: File): Promise<ImportResult> => {
  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length === 0) {
    return {
      success: false,
      errors: ["El archivo CSV está vacío"],
    }
  }

  const columns = rows[0].map((col) => col.trim()).filter(Boolean)
  if (columns.length === 0) {
    return {
      success: false,
      errors: ["No se encontraron columnas válidas en el archivo"],
    }
  }

  const data = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell && cell.trim()))
    .map((row, index) => {
      const obj: any = { id: index }
      columns.forEach((col, i) => {
        obj[col] = (row[i] || "").trim()
      })
      return obj
    })

  const warnings = []
  if (data.length < rows.length - 1) {
    warnings.push(`Se omitieron ${rows.length - 1 - data.length} filas vacías`)
  }

  return {
    success: true,
    data,
    columns,
    warnings,
    preview: data.slice(0, 10),
  }
}

const importFromExcel = async (file: File): Promise<ImportResult> => {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return {
      success: false,
      errors: ["No se encontraron hojas en el archivo Excel"],
    }
  }

  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

  if (jsonData.length === 0) {
    return {
      success: false,
      errors: ["La hoja de Excel está vacía"],
    }
  }

  const columns = jsonData[0].map((col) => String(col || "").trim()).filter(Boolean)
  if (columns.length === 0) {
    return {
      success: false,
      errors: ["No se encontraron columnas válidas en el archivo"],
    }
  }

  const data = jsonData
    .slice(1)
    .filter((row) => row.some((cell) => cell != null && String(cell).trim()))
    .map((row, index) => {
      const obj: any = { id: index }
      columns.forEach((col, i) => {
        obj[col] = row[i] != null ? String(row[i]).trim() : ""
      })
      return obj
    })

  const warnings = []
  if (workbook.SheetNames.length > 1) {
    warnings.push(`El archivo contiene ${workbook.SheetNames.length} hojas. Solo se importó la primera: "${sheetName}"`)
  }

  return {
    success: true,
    data,
    columns,
    warnings,
    preview: data.slice(0, 10),
  }
}

const importFromJSON = async (file: File): Promise<ImportResult> => {
  const text = await file.text()
  let jsonData: any

  try {
    jsonData = JSON.parse(text)
  } catch (error) {
    return {
      success: false,
      errors: ["El archivo JSON no tiene un formato válido"],
    }
  }

  // Handle different JSON structures
  let data: any[]
  if (Array.isArray(jsonData)) {
    data = jsonData
  } else if (jsonData.data && Array.isArray(jsonData.data)) {
    data = jsonData.data
  } else if (typeof jsonData === "object") {
    data = [jsonData]
  } else {
    return {
      success: false,
      errors: ["El archivo JSON no contiene un array de datos válido"],
    }
  }

  if (data.length === 0) {
    return {
      success: false,
      errors: ["El archivo JSON no contiene datos"],
    }
  }

  // Extract columns from first object
  const columns = Object.keys(data[0]).filter((key) => key !== "id")

  // Ensure all objects have an id
  const processedData = data.map((item, index) => ({
    id: item.id || index,
    ...item,
  }))

  return {
    success: true,
    data: processedData,
    columns,
    preview: processedData.slice(0, 10),
  }
}
