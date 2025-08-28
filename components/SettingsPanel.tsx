import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Filter } from "lucide-react"

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

interface SettingsPanelProps {
  columns: string[]
  columnConfig: ColumnConfig[]
  setColumnConfig: (config: ColumnConfig[]) => void
  filterConfig: FilterConfig[]
  setFilterConfig: (config: FilterConfig[]) => void
}

export const SettingsPanel = ({
  columns,
  columnConfig,
  setColumnConfig,
  filterConfig,
  setFilterConfig,
}: SettingsPanelProps) => {
  const toggleColumnVisibility = (col: string) => {
    setColumnConfig(
      columnConfig.map((c) =>
        c.name === col ? { ...c, visible: !c.visible } : c
      )
    )
  }

  const handleFilterChange = (col: string, value: string) => {
    setFilterConfig(
      filterConfig.map((f) =>
        f.column === col ? { ...f, value, enabled: true } : f
      )
    )
  }

  const toggleFilter = (col: string) => {
    setFilterConfig(
      filterConfig.map((f) =>
        f.column === col ? { ...f, enabled: !f.enabled } : f
      )
    )
  }

  return (
    <div className="mb-4 rounded-lg border p-4 shadow-sm">
      <h3 className="mb-2 flex items-center gap-2 font-semibold">
        <Filter className="h-4 w-4" /> Configuración de columnas y filtros
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {columns.map((col) => (
          <div key={col} className="space-y-2 rounded-md border p-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`col-${col}`}
                checked={columnConfig.find((c) => c.name === col)?.visible}
                onCheckedChange={() => toggleColumnVisibility(col)}
              />
              <Label htmlFor={`col-${col}`}>{col}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`filter-${col}`}
                checked={filterConfig.find((f) => f.column === col)?.enabled}
                onCheckedChange={() => toggleFilter(col)}
              />
              <Input
                type="text"
                placeholder={`Filtrar ${col}`}
                className="h-8"
                value={filterConfig.find((f) => f.column === col)?.value || ""}
                onChange={(e) => handleFilterChange(col, e.target.value)}
                disabled={!filterConfig.find((f) => f.column === col)?.enabled}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
