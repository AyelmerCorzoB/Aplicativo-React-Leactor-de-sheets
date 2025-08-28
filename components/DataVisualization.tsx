"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { BarChart3, PieChartIcon, Activity, Users } from "lucide-react"

interface DataVisualizationProps {
  data: any[]
  columns: string[]
}

export function DataVisualization({ data, columns }: DataVisualizationProps) {
  const analytics = useMemo(() => {
    if (!data || data.length === 0) return null

    // Basic statistics
    const totalRecords = data.length
    const nonEmptyColumns = columns.filter((col) => data.some((row) => row[col] && String(row[col]).trim()))
    const completenessRate = (nonEmptyColumns.length / columns.length) * 100

    // Analyze numeric columns for charts
    const numericColumns = columns.filter((col) => {
      const values = data.map((row) => row[col]).filter((val) => val && !isNaN(Number(val)))
      return values.length > data.length * 0.3 // At least 30% numeric values
    })

    // Analyze categorical columns
    const categoricalColumns = columns.filter((col) => {
      const uniqueValues = new Set(data.map((row) => String(row[col] || "").trim()).filter(Boolean))
      return uniqueValues.size > 1 && uniqueValues.size <= Math.min(20, data.length * 0.8)
    })

    // Generate chart data for categorical columns
    const categoryCharts = categoricalColumns.slice(0, 4).map((col) => {
      const counts = data.reduce(
        (acc, row) => {
          const value = String(row[col] || "").trim()
          if (value) {
            acc[value] = (acc[value] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        column: col,
        data: Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, value]) => ({ name, value, percentage: (value / totalRecords) * 100 })),
      }
    })

    // Generate trend data if there's a date column
    const dateColumns = columns.filter((col) => {
      const values = data.map((row) => row[col]).filter(Boolean)
      return values.some((val) => !isNaN(Date.parse(String(val))))
    })

    let trendData = null
    if (dateColumns.length > 0) {
      const dateCol = dateColumns[0]
      const monthCounts = data.reduce(
        (acc, row) => {
          const dateStr = String(row[dateCol] || "").trim()
          if (dateStr) {
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
              acc[monthKey] = (acc[monthKey] || 0) + 1
            }
          }
          return acc
        },
        {} as Record<string, number>,
      )

      trendData = Object.entries(monthCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }))
    }

    return {
      totalRecords,
      completenessRate,
      numericColumns,
      categoricalColumns,
      categoryCharts,
      trendData,
    }
  }, [data, columns])

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" style={{ color: "#F26B76" }} />
            Dashboard de Análisis
          </CardTitle>
          <CardDescription>No hay datos disponibles para mostrar</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const colors = ["#F26B76", "#0BC4D9", "#03A66A", "#F2D750", "#F2F2F2"]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#F26B76" }}>
              {analytics.totalRecords.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Registros en la hoja actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Columnas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#0BC4D9" }}>
              {columns.length}
            </div>
            <p className="text-xs text-muted-foreground">Campos disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completitud</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#03A66A" }}>
              {analytics.completenessRate.toFixed(1)}%
            </div>
            <Progress value={analytics.completenessRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#F2D750" }}>
              {analytics.categoricalColumns.length}
            </div>
            <p className="text-xs text-muted-foreground">Campos categóricos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="categories">Distribución por Categorías</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          {analytics.categoryCharts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analytics.categoryCharts.map((chart, index) => (
                <Card key={chart.column}>
                  <CardHeader>
                    <CardTitle className="text-lg">{chart.column}</CardTitle>
                    <CardDescription>Distribución de valores ({chart.data.length} categorías)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chart.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) => [value, "Cantidad"]}
                            labelFormatter={(label) => `Categoría: ${label}`}
                          />
                          <Bar dataKey="value" fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No se encontraron columnas categóricas para visualizar</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {analytics.trendData && analytics.trendData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendencia Temporal</CardTitle>
                <CardDescription>Registros por mes ({analytics.trendData.length} períodos)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [value, "Registros"]}
                        labelFormatter={(label) => `Mes: ${label}`}
                      />
                      <Area type="monotone" dataKey="count" stroke="#0BC4D9" fill="#0BC4D9" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No se encontraron columnas de fecha para mostrar tendencias</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipos de Columnas</CardTitle>
                <CardDescription>Distribución por tipo de datos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Categóricas", value: analytics.categoricalColumns.length, color: "#F26B76" },
                          { name: "Numéricas", value: analytics.numericColumns.length, color: "#0BC4D9" },
                          {
                            name: "Otras",
                            value:
                              columns.length - analytics.categoricalColumns.length - analytics.numericColumns.length,
                            color: "#03A66A",
                          },
                        ].filter((item) => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: "Categóricas", value: analytics.categoricalColumns.length, color: "#F26B76" },
                          { name: "Numéricas", value: analytics.numericColumns.length, color: "#0BC4D9" },
                          {
                            name: "Otras",
                            value:
                              columns.length - analytics.categoricalColumns.length - analytics.numericColumns.length,
                            color: "#03A66A",
                          },
                        ]
                          .filter((item) => item.value > 0)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Column Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalles de Columnas</CardTitle>
                <CardDescription>Información detallada por campo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {columns.map((col, index) => {
                    const isNumeric = analytics.numericColumns.includes(col)
                    const isCategorical = analytics.categoricalColumns.includes(col)
                    const nonEmptyCount = data.filter((row) => row[col] && String(row[col]).trim()).length
                    const completeness = (nonEmptyCount / data.length) * 100

                    return (
                      <div key={col} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{col}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: isNumeric ? "#0BC4D9" : isCategorical ? "#F26B76" : "#03A66A",
                                color: "white",
                              }}
                            >
                              {isNumeric ? "Numérica" : isCategorical ? "Categórica" : "Texto"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{completeness.toFixed(0)}% completo</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{nonEmptyCount}</p>
                          <p className="text-xs text-muted-foreground">registros</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
