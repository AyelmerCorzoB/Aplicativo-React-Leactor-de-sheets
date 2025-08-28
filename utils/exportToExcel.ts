/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from "exceljs"

export const exportToExcel = async (
  data: any[],
  columns: string[],
  columnConfig: { name: string; visible: boolean }[],
  filename = "export.xlsx"
) => {
  if (!data.length) return

  // Filtrar solo columnas visibles
  const visibleCols = columns.filter(
    (col) => columnConfig.find((c) => c.name === col)?.visible
  )

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Datos filtrados")

  // Encabezados
  sheet.addRow(visibleCols)

  // Filas con datos
  data.forEach((row) => {
    sheet.addRow(visibleCols.map((col) => row[col] || ""))
  })

  // Ajustar ancho de columnas automáticamente
  sheet.columns.forEach((col) => {
    let maxLength = 10
    col.eachCell({ includeEmpty: true }, (cell) => {
      maxLength = Math.max(maxLength, cell.value?.toString().length || 0)
    })
    col.width = maxLength + 2
  })

  // Generar archivo y descargar
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
