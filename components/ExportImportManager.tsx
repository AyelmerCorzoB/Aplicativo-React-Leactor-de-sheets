/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  FileJson,
  FileImage,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react"
import { exportToExcel } from "@/utils/exportToExcel"
import { exportToCSV } from "@/utils/exportToCSV"
import { exportToPDF } from "@/utils/exportToPDF"
import { exportToJSON } from "@/utils/exportToJSON"
import { importFromFile } from "@/utils/importFromFile"

interface ExportImportManagerProps {
  data: any[]
  columns: string[]
  columnConfig: { name: string; visible: boolean }[]
  onDataImported: (newData: any[], newColumns: string[]) => void
}

interface ExportOptions {
  format: "excel" | "csv" | "pdf" | "json"
  includeHeaders: boolean
  includeFilters: boolean
  selectedColumns: string[]
  filename: string
  dateFormat: string
  encoding: string
}

interface ImportResult {
  success: boolean
  data?: any[]
  columns?: string[]
  errors?: string[]
  warnings?: string[]
  preview?: any[]
}

export function ExportImportManager({ data, columns, columnConfig, onDataImported }: ExportImportManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("export")
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "excel",
    includeHeaders: true,
    includeFilters: false,
    selectedColumns: columns.filter((col) => columnConfig.find((c) => c.name === col)?.visible),
    filename: "datos-exportados",
    dateFormat: "DD/MM/YYYY",
    encoding: "UTF-8",
  })

  const formatOptions = [
    { value: "excel", label: "Excel (.xlsx)", icon: <FileSpreadsheet className="h-4 w-4" />, color: "#03A66A" },
    { value: "csv", label: "CSV (.csv)", icon: <FileText className="h-4 w-4" />, color: "#0BC4D9" },
    { value: "json", label: "JSON (.json)", icon: <FileJson className="h-4 w-4" />, color: "#F2D750" },
    { value: "pdf", label: "PDF (.pdf)", icon: <FileImage className="h-4 w-4" />, color: "#F26B76" },
  ]

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const exportData = data.map((row) => {
        const filteredRow: any = {}
        exportOptions.selectedColumns.forEach((col) => {
          filteredRow[col] = row[col]
        })
        return filteredRow
      })

      const filename = `${exportOptions.filename}.${exportOptions.format === "excel" ? "xlsx" : exportOptions.format}`

      switch (exportOptions.format) {
        case "excel":
          await exportToExcel(exportData, exportOptions.selectedColumns, columnConfig, filename)
          break
        case "csv":
          await exportToCSV(exportData, exportOptions.selectedColumns, filename, exportOptions.encoding)
          break
        case "json":
          await exportToJSON(exportData, filename)
          break
        case "pdf":
          await exportToPDF(exportData, exportOptions.selectedColumns, filename, {
            includeHeaders: exportOptions.includeHeaders,
            dateFormat: exportOptions.dateFormat,
          })
          break
      }

      setIsOpen(false)
    } catch (error) {
      console.error("Error exporting data:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportProgress(0)
    setImportResult(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const result = await importFromFile(file)

      clearInterval(progressInterval)
      setImportProgress(100)
      setImportResult(result)

      if (result.success && result.data && result.columns) {
        setShowPreview(true)
      }
    } catch (error) {
      setImportResult({
        success: false,
        errors: [`Error al procesar el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`],
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const confirmImport = () => {
    if (importResult?.success && importResult.data && importResult.columns) {
      onDataImported(importResult.data, importResult.columns)
      setIsOpen(false)
      setImportResult(null)
      setShowPreview(false)
    }
  }

  const cancelImport = () => {
    setImportResult(null)
    setShowPreview(false)
    setImportProgress(0)
  }

  const downloadTemplate = () => {
    const templateData = [columns.reduce((acc, col) => ({ ...acc, [col]: `Ejemplo ${col}` }), {})]
    exportToCSV(templateData, columns, "plantilla-importacion.csv", "UTF-8")
  }

  const toggleColumnSelection = (column: string) => {
    setExportOptions((prev) => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(column)
        ? prev.selectedColumns.filter((col) => col !== column)
        : [...prev.selectedColumns, column],
    }))
  }

  const selectAllColumns = () => {
    const visibleColumns = columns.filter((col) => columnConfig.find((c) => c.name === col)?.visible)
    setExportOptions((prev) => ({
      ...prev,
      selectedColumns: prev.selectedColumns.length === visibleColumns.length ? [] : visibleColumns,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar/Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Gestión de Datos</DialogTitle>
          <DialogDescription>Exporta o importa datos en diferentes formatos</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[70vh]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 h-full overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Export Options */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Opciones de Exportación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Format Selection */}
                    <div className="space-y-2">
                      <Label>Formato de archivo</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {formatOptions.map((format) => (
                          <Button
                            key={format.value}
                            variant={exportOptions.format === format.value ? "default" : "outline"}
                            onClick={() => setExportOptions((prev) => ({ ...prev, format: format.value as any }))}
                            className="justify-start"
                            style={{
                              backgroundColor: exportOptions.format === format.value ? format.color : undefined,
                            }}
                          >
                            {format.icon}
                            <span className="ml-2">{format.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Filename */}
                    <div className="space-y-2">
                      <Label>Nombre del archivo</Label>
                      <Input
                        value={exportOptions.filename}
                        onChange={(e) => setExportOptions((prev) => ({ ...prev, filename: e.target.value }))}
                        placeholder="nombre-archivo"
                      />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Incluir encabezados</Label>
                        <Switch
                          checked={exportOptions.includeHeaders}
                          onCheckedChange={(checked) =>
                            setExportOptions((prev) => ({ ...prev, includeHeaders: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Incluir información de filtros</Label>
                        <Switch
                          checked={exportOptions.includeFilters}
                          onCheckedChange={(checked) =>
                            setExportOptions((prev) => ({ ...prev, includeFilters: checked }))
                          }
                        />
                      </div>

                      {exportOptions.format === "csv" && (
                        <div className="space-y-2">
                          <Label>Codificación</Label>
                          <Select
                            value={exportOptions.encoding}
                            onValueChange={(value) => setExportOptions((prev) => ({ ...prev, encoding: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTF-8">UTF-8</SelectItem>
                              <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                              <SelectItem value="Windows-1252">Windows-1252</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(exportOptions.format === "pdf" || exportOptions.format === "excel") && (
                        <div className="space-y-2">
                          <Label>Formato de fecha</Label>
                          <Select
                            value={exportOptions.dateFormat}
                            onValueChange={(value) => setExportOptions((prev) => ({ ...prev, dateFormat: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Column Selection */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Columnas</CardTitle>
                      <Button variant="outline" size="sm" onClick={selectAllColumns}>
                        {exportOptions.selectedColumns.length ===
                        columns.filter((col) => columnConfig.find((c) => c.name === col)?.visible).length
                          ? "Deseleccionar todo"
                          : "Seleccionar todo"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {columns
                          .filter((col) => columnConfig.find((c) => c.name === col)?.visible)
                          .map((column) => (
                            <div key={column} className="flex items-center space-x-2">
                              <Checkbox
                                id={`export-${column}`}
                                checked={exportOptions.selectedColumns.includes(column)}
                                onCheckedChange={() => toggleColumnSelection(column)}
                              />
                              <label htmlFor={`export-${column}`} className="text-sm font-medium">
                                {column}
                              </label>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Export Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Registros:</span>
                      <Badge variant="secondary">{data.length}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Columnas:</span>
                      <Badge variant="secondary">{exportOptions.selectedColumns.length}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Formato:</span>
                      <Badge
                        style={{ backgroundColor: formatOptions.find((f) => f.value === exportOptions.format)?.color }}
                      >
                        {formatOptions.find((f) => f.value === exportOptions.format)?.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 h-full overflow-hidden">
            {!showPreview ? (
              <div className="space-y-6">
                {/* File Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Seleccionar Archivo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Arrastra un archivo aquí o haz clic para seleccionar</p>
                        <p className="text-sm text-muted-foreground">
                          Formatos soportados: Excel (.xlsx, .xls), CSV (.csv), JSON (.json)
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv,.json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4"
                        disabled={isImporting}
                        style={{ backgroundColor: "#0BC4D9", color: "white" }}
                      >
                        Seleccionar Archivo
                      </Button>
                    </div>

                    {isImporting && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Procesando archivo...</span>
                          <span>{importProgress}%</span>
                        </div>
                        <Progress value={importProgress} />
                      </div>
                    )}

                    {importResult && !importResult.success && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p className="font-medium">Error al importar archivo:</p>
                            {importResult.errors?.map((error, index) => (
                              <p key={index} className="text-sm">
                                • {error}
                              </p>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Template Download */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Plantilla de Importación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Descarga una plantilla con la estructura correcta para importar datos.
                    </p>
                    <Button variant="outline" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Plantilla CSV
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Import Preview */
              <div className="space-y-4 h-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Vista Previa de Importación</h3>
                    <p className="text-sm text-muted-foreground">Revisa los datos antes de importar</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={cancelImport}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>

                {importResult?.warnings && importResult.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Advertencias:</p>
                        {importResult.warnings.map((warning, index) => (
                          <p key={index} className="text-sm">
                            • {warning}
                          </p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold" style={{ color: "#F26B76" }}>
                        {importResult?.data?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Registros</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold" style={{ color: "#0BC4D9" }}>
                        {importResult?.columns?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Columnas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold" style={{ color: "#03A66A" }}>
                        {importResult?.errors?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Errores</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold" style={{ color: "#F2D750" }}>
                        {importResult?.warnings?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Advertencias</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="flex-1 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">Datos a Importar</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-64">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {importResult?.columns?.map((column) => (
                                <th key={column} className="p-2 text-left font-medium">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importResult?.preview?.slice(0, 10).map((row, index) => (
                              <tr key={index} className="border-b">
                                {importResult.columns?.map((column) => (
                                  <td key={column} className="p-2">
                                    <div className="max-w-[150px] truncate">{String(row[column] || "")}</div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            {activeTab === "export" && (
              <Button
                onClick={handleExport}
                disabled={isExporting || exportOptions.selectedColumns.length === 0}
                style={{ backgroundColor: "#F26B76", color: "white" }}
              >
                {isExporting ? "Exportando..." : "Exportar Datos"}
              </Button>
            )}
            {activeTab === "import" && showPreview && (
              <Button
                onClick={confirmImport}
                disabled={!importResult?.success}
                style={{ backgroundColor: "#03A66A", color: "white" }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Importación
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
