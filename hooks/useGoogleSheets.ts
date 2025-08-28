/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { parseCSV } from "@/utils/parseCSV";

export interface ColumnConfig {
  name: string;
  visible: boolean;
  filterable: boolean;
}

export interface FilterConfig {
  column: string;
  value: string;
  enabled: boolean;
}

export const useGoogleSheets = (spreadsheetId: string, sheetGid: string) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]);
  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}&t=${Date.now()}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const text = await response.text();
      if (!text.trim()) throw new Error("No se encontraron datos");

      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error("CSV vacío");

      const headers = rows[0].map(h => h.trim());
      setColumns(headers);

      const newColumnConfig = headers.map(header => ({
        name: header,
        visible: true,
        filterable: true,
      }));
      setColumnConfig(newColumnConfig);

      const newFilterConfig = headers.map(header => ({
        column: header,
        value: "",
        enabled: false,
      }));
      setFilterConfig(newFilterConfig);

      const formattedData = rows.slice(1).map((row, idx) => {
        const obj: any = { id: idx };
        headers.forEach((header, i) => {
          obj[header] = (row[i] || "").trim();
        });
        return obj;
      });

      setData(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetGid]);

  return { data, columns, columnConfig, setColumnConfig, filterConfig, setFilterConfig, loading, error, fetchData };
};
