/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf"

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export const exportToPDF = async (
  data: any[],
  columns: string[],
  filename = "export.pdf",
  options: {
    includeHeaders?: boolean
    dateFormat?: string
  } = {},
) => {
  if (!data.length) return

  const { includeHeaders = true, dateFormat = "DD/MM/YYYY" } = options

  const doc = new jsPDF()

  // Add title
  doc.setFontSize(16)
  doc.text("Reporte de Datos", 14, 15)

  // Add date
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 25)

  // Prepare table data
  const tableData = data.map((row) => columns.map((col) => String(row[col] || "")))

  // Generate table
  doc.autoTable({
    head: includeHeaders ? [columns] : undefined,
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [242, 107, 118], // #F26B76
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    margin: { top: 35, right: 14, bottom: 20, left: 14 },
  })

  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
  }

  doc.save(filename)
}
