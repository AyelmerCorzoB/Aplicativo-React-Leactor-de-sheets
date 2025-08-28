/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Download, RefreshCw, FileSpreadsheet, Filter, Settings, Columns, Sheet } from "lucide-react";

// Configuración de Google Sheets
const SPREADSHEET_ID = "1i62vYPPfk6vQr1IRXIzrvthu1CFs-WSyBI61Dk4rZgI";

// Lista de hojas disponibles con sus nombres y IDs
const AVAILABLE_SHEETS = [
  { name: "DATOS CLIENTES", gid: "0" },
  { name: "DATOS CLIENTES2", gid: "673856019" },
  // Agrega más hojas según necesites
];

interface ColumnConfig {
  name: string;
  visible: boolean;
  filterable: boolean;
}

interface FilterConfig {
  column: string;
  value: string;
  enabled: boolean;
}

// Función mejorada para parsear CSV
const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let insideQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Comilla escapada
        currentValue += '"';
        i++; // Saltar la siguiente comilla
      } else {
        // Comilla de inicio/fin
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Fin de valor
      currentRow.push(currentValue.trim());
      currentValue = "";
    } else if (char === '\n' && !insideQuotes) {
      // Fin de fila
      currentRow.push(currentValue.trim());
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      
      // Saltar retorno de carro si existe (para CRLF)
      if (nextChar === '\r') i++;
    } else if (char !== '\r') {
      // Ignorar retorno de carro y agregar carácter al valor actual
      currentValue += char;
    }
  }
  
  // Agregar la última fila si existe
  if (currentValue !== "" || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    rows.push(currentRow);
  }
  
  return rows;
};

export default function GoogleSheetsApp() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]);
  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFilterColumn, setSelectedFilterColumn] = useState("all");
  const [selectedSheet, setSelectedSheet] = useState(AVAILABLE_SHEETS[0].gid);

  // Cargar datos desde Google Sheets
  const fetchData = async (sheetGid: string = selectedSheet) => {
    setLoading(true);
    setError(null);
    
    try {
      // URL con la hoja seleccionada dinámicamente
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${sheetGid}&t=${Date.now()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const text = await response.text();

      if (!text || text.trim().length === 0) {
        throw new Error("No se encontraron datos en la hoja de cálculo");
      }

      // Parsear CSV con nuestra función mejorada
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error("No se pudieron parsear datos del CSV");
      }
      
      const headers = rows[0];
      const dataRows = rows.slice(1);

      if (dataRows.length === 0) {
        throw new Error("No hay registros en la hoja de cálculo");
      }

      // Configurar columnas
      const processedHeaders = headers.map(header => header.trim());
      setColumns(processedHeaders);
      
      const newColumnConfig: ColumnConfig[] = processedHeaders.map(header => ({
        name: header,
        visible: true,
        filterable: true
      }));
      setColumnConfig(newColumnConfig);

      // Configurar filtros
      const newFilterConfig: FilterConfig[] = processedHeaders.map(header => ({
        column: header,
        value: "",
        enabled: false
      }));
      setFilterConfig(newFilterConfig);

      // Procesar datos
      const formattedData = dataRows.map((row, index) => {
        const obj: any = { id: index }; // Agregar ID único
        processedHeaders.forEach((header, i) => {
          obj[header] = (row[i] || "").trim();
        });
        return obj;
      });

      setData(formattedData);
      setFilteredData(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cuando cambia la hoja seleccionada
  const handleSheetChange = (sheetGid: string) => {
    setSelectedSheet(sheetGid);
    fetchData(sheetGid);
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aplicar filtros cuando cambian los datos o la configuración
  useEffect(() => {
    let result = [...data];
    
    // Aplicar búsqueda global
    if (globalSearch) {
      result = result.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(globalSearch.toLowerCase())
        )
      );
    }
    
    // Aplicar filtros específicos por columna
    filterConfig.forEach(filter => {
      if (filter.enabled && filter.value) {
        if (selectedFilterColumn === "all" || selectedFilterColumn === filter.column) {
          result = result.filter(item => 
            String(item[filter.column] || "").toLowerCase().includes(filter.value.toLowerCase())
          );
        }
      }
    });
    
    setFilteredData(result);
  }, [data, globalSearch, filterConfig, selectedFilterColumn]);

  // Manejar cambios en la configuración de columnas
  const toggleColumnVisibility = (columnName: string) => {
    setColumnConfig(prev => 
      prev.map(col => 
        col.name === columnName ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Manejar cambios en la configuración de filtros
  const updateFilter = (columnName: string, updates: Partial<FilterConfig>) => {
    setFilterConfig(prev => 
      prev.map(filter => 
        filter.column === columnName ? { ...filter, ...updates } : filter
      )
    );
  };

  // Exportar a CSV
  const handleExport = () => {
    if (filteredData.length === 0) return;
    
    const visibleColumns = columnConfig.filter(col => col.visible).map(col => col.name);
    
    const csvContent = [
      visibleColumns, // headers
      ...filteredData.map(item => visibleColumns.map(col => item[col] || "")),
    ]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "datos-google-sheets.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Restablecer todos los filtros
  const resetFilters = () => {
    setGlobalSearch("");
    setFilterConfig(prev => prev.map(filter => ({ ...filter, value: "", enabled: false })));
    setSelectedFilterColumn("all");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Google Sheets App</h1>
              <p className="text-muted-foreground">Datos en vivo desde tu hoja de Google</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
            <Button variant="outline" onClick={() => fetchData()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button onClick={handleExport} disabled={filteredData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Selector de hoja */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sheet className="h-5 w-5" />
              Seleccionar Hoja
            </CardTitle>
            <CardDescription>
              Elige qué hoja del documento quieres visualizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedSheet} onValueChange={handleSheetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una hoja" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_SHEETS.map((sheet) => (
                  <SelectItem key={sheet.gid} value={sheet.gid}>
                    {sheet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Panel de configuración */}
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de columnas y filtros
              </CardTitle>
              <CardDescription>
                Personaliza qué columnas mostrar y configurar filtros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuración de columnas */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Columns className="h-4 w-4" />
                    Columnas visibles
                  </h3>
                  <div className="space-y-3">
                    {columnConfig.map((column) => (
                      <div key={column.name} className="flex items-center justify-between">
                        <Label htmlFor={`col-${column.name}`} className="flex-1">
                          {column.name}
                        </Label>
                        <Switch
                          id={`col-${column.name}`}
                          checked={column.visible}
                          onCheckedChange={() => toggleColumnVisibility(column.name)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configuración de filtros */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros por columna
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Seleccionar columna para filtrar</Label>
                      <Select value={selectedFilterColumn} onValueChange={setSelectedFilterColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas las columnas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las columnas</SelectItem>
                          {columns.map((column) => (
                            <SelectItem key={column} value={column}>{column}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedFilterColumn !== "all" && (
                      <div className="space-y-2">
                        <Label>Valor para filtrar</Label>
                        <Input
                          placeholder={`Filtrar por ${selectedFilterColumn}`}
                          value={filterConfig.find(f => f.column === selectedFilterColumn)?.value || ""}
                          onChange={(e) => 
                            updateFilter(selectedFilterColumn, { 
                              value: e.target.value,
                              enabled: e.target.value !== ""
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Búsqueda global */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar en todos los campos..."
                className="pl-8"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Mensajes de estado */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive">Error: {error}</div>
              <Button onClick={() => fetchData()} className="mt-4">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de Google Sheets</CardTitle>
            <CardDescription>
              {filteredData.length} de {data.length} registros
              {loading && " - Cargando..."}
              {AVAILABLE_SHEETS.find(s => s.gid === selectedSheet)?.name && 
                ` - Hoja: ${AVAILABLE_SHEETS.find(s => s.gid === selectedSheet)?.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {columnConfig
                        .filter(col => col.visible)
                        .map((col) => (
                          <th key={col.name} className="text-left py-3 px-4 font-medium">
                            {col.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                        {columnConfig
                          .filter(col => col.visible)
                          .map((col) => (
                            <td key={`${item.id}-${col.name}`} className="py-3 px-4">
                              {String(item[col.name] || "")}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron resultados
                    {globalSearch && ` para "${globalSearch}"`}
                    {selectedFilterColumn !== "all" && ` en la columna "${selectedFilterColumn}"`}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                {loading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse bg-muted h-4 w-3/4 mx-auto rounded"></div>
                    <div className="animate-pulse bg-muted h-4 w-1/2 mx-auto rounded"></div>
                    <div className="animate-pulse bg-muted h-4 w-2/3 mx-auto rounded"></div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}