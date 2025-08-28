// utils/parseCSV.ts
export const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentValue = "";
    let insideQuotes = false;
  
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
  
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentValue += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentValue.trim());
        currentValue = "";
      } else if (char === '\n' && !insideQuotes) {
        currentRow.push(currentValue.trim());
        rows.push(currentRow);
        currentRow = [];
        currentValue = "";
        if (nextChar === '\r') i++;
      } else if (char !== '\r') {
        currentValue += char;
      }
    }
  
    if (currentValue !== "" || currentRow.length > 0) {
      currentRow.push(currentValue.trim());
      rows.push(currentRow);
    }
  
    return rows;
  };
  