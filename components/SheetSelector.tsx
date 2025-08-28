import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SheetSelectorProps {
  availableSheets: { name: string; gid: string }[]
  value: string
  onChange: (value: string) => void
}

export const SheetSelector = ({ availableSheets, value, onChange }: SheetSelectorProps) => {
  return (
    <div className="mb-4 max-w-sm">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una hoja" />
        </SelectTrigger>
        <SelectContent>
          {availableSheets.map((sheet) => (
            <SelectItem key={sheet.gid} value={sheet.gid}>
              {sheet.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
