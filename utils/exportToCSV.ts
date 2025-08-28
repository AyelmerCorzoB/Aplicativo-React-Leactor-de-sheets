/* eslint-disable @typescript-eslint/no-explicit-any */

export const exportToCSV = async (data: any[], columns: string[], filename = "export.csv", encoding = "UTF-8") => {
    if (!data.length) return
  
    // Create CSV content
    const csvContent = [
      // Headers
      columns
        .map((col) => `"${col.replace(/"/g, '""')}"`)
        .join(","),
      // Data rows
      ...data.map((row) =>
        columns
          .map((col) => {
            const value = row[col] || ""
            return `"${String(value).replace(/"/g, '""')}"`
          })
          .join(","),
      ),
    ].join("\n")
  
    // Create blob with proper encoding
    const BOM = encoding === "UTF-8" ? "\uFEFF" : ""
    const blob = new Blob([BOM + csvContent], {
      type: `text/csv;charset=${encoding}`,
    })
  
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  