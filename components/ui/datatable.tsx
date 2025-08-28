/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense } from "react"

const LazyDataManagement = React.lazy(() =>
  import("@/components/DataManagement").then((module) => ({ default: module.DataManagement })),
)

interface ColumnConfig {
  name: string
  visible: boolean
  filterable: boolean
}

interface FilterConfig {
  column: string
  value: string
  enabled: boolean
}

interface DataTableProps {
  data: any[]
  columns: string[]
  columnConfig: ColumnConfig[]
  setColumnConfig?: (config: ColumnConfig[]) => void
  filterConfig?: FilterConfig[]
  setFilterConfig?: (config: FilterConfig[]) => void
  globalSearch?: string
  setGlobalSearch?: (search: string) => void
  onRefresh?: () => void
  onExport?: () => void
  loading: boolean
  error: string | null
}

const LoadingComponent = React.memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#F26B76" }}></div>
      <p className="text-muted-foreground">Cargando datos...</p>
    </div>
  </div>
))

LoadingComponent.displayName = "LoadingComponent"

const ErrorComponent = React.memo(({ error }: { error: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="text-red-500 mb-2">Error al cargar los datos</div>
      <p className="text-sm text-muted-foreground">{error}</p>
    </div>
  </div>
))

ErrorComponent.displayName = "ErrorComponent"

const EmptyStateComponent = React.memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <p className="text-muted-foreground mb-2">No hay datos disponibles</p>
      <p className="text-sm text-muted-foreground">Intenta actualizar o verificar la conexión</p>
    </div>
  </div>
))

EmptyStateComponent.displayName = "EmptyStateComponent"

export const DataTable = React.memo(
  ({
    data,
    columns,
    columnConfig,
    setColumnConfig,
    filterConfig,
    setFilterConfig,
    globalSearch = "",
    setGlobalSearch = () => {},
    onRefresh = () => {},
    onExport = () => {},
    loading,
    error,
  }: DataTableProps) => {
    if (loading) {
      return <LoadingComponent />
    }

    if (error) {
      return <ErrorComponent error={error} />
    }

    if (!data.length) {
      return <EmptyStateComponent />
    }

    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyDataManagement
          data={data}
          columns={columns}
          columnConfig={columnConfig}
          setColumnConfig={setColumnConfig || (() => {})}
          filterConfig={filterConfig || []}
          setFilterConfig={setFilterConfig || (() => {})}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          onRefresh={onRefresh}
          onExport={onExport}
        />
      </Suspense>
    )
  },
)

DataTable.displayName = "DataTable"
