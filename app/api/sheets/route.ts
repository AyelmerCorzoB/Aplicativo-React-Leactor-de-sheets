/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url =
      "https://docs.google.com/spreadsheets/d/1i62vYPPfk6vQr1IRXIzrvthu1CFs-WSyBI61Dk4rZgI/export?format=csv";

    const response = await fetch(url);
    const text = await response.text();

    const rows = text.trim().split("\n").map((r) => r.split(","));
    const [headers, ...dataRows] = rows;

    const formattedData = dataRows.map((row) => {
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h.trim().toLowerCase().replace(/\s+/g, "_")] = row[i] || "";
      });
      return obj;
    });

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching Google Sheets data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheets" },
      { status: 500 }
    );
  }
}
