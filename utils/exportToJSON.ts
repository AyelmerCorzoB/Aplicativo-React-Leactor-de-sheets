/* eslint-disable @typescript-eslint/no-explicit-any */

export const exportToJSON = async (data: any[], filename = "export.json") => {
    if (!data.length) return
  
    const jsonContent = JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalRecords: data.length,
        data: data,
      },
      null,
      2,
    )
  
    const blob = new Blob([jsonContent], { type: "application/json" })
    const url = URL.createObjectURL(blob)
  
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  