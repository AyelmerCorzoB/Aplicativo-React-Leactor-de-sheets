/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  
  interface ColumnConfig {
    name: string
    visible: boolean
    filterable: boolean
  }
  
  interface DataTableProps {
    data: any[]
    columns: string[]
    columnConfig: ColumnConfig[]
    loading: boolean
    error: string | null
  }
  
  export const DataTable = ({ data, columns, columnConfig, loading, error }: DataTableProps) => {
    if (loading) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          Cargando datos...
        </div>
      )
    }
  
    if (error) {
      return (
        <div className="p-4 text-center text-red-500">
          Error: {error}
        </div>
      )
    }
  
    if (!data.length) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          No hay datos disponibles
        </div>
      )
    }
  
    const visibleColumns = columns.filter(
      (col) => columnConfig.find((c) => c.name === col)?.visible
    )
  
    return (
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                {visibleColumns.map((col) => (
                  <TableCell key={col}>{row[col]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }
  