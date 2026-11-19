import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { ExtractedTable } from '../types';

interface TextItemWithCoords {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extract table data from a PDF page using text coordinate clustering
 */
export async function extractTableFromPage(
  pdfBytes: ArrayBuffer,
  pageNumber: number,
  boxFilter?: { x: number; y: number; width: number; height: number } // Optional selection box
): Promise<ExtractedTable> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });

  const items: TextItemWithCoords[] = [];

  for (const item of textContent.items as any[]) {
    if (!item.str || item.str.trim() === '') continue;
    
    // transform: [scaleX, skewY, skewX, scaleY, transX, transY]
    const x = item.transform[4];
    const y = viewport.height - item.transform[5]; // Flip y for standard top-to-bottom

    if (boxFilter) {
      if (
        x < boxFilter.x ||
        x > boxFilter.x + boxFilter.width ||
        y < boxFilter.y ||
        y > boxFilter.y + boxFilter.height
      ) {
        continue;
      }
    }

    items.push({
      text: item.str.trim(),
      x,
      y,
      width: item.width || 20,
      height: item.height || 10,
    });
  }

  if (items.length === 0) {
    return { headers: [], rows: [] };
  }

  // 1. Group items into rows by Y coordinate (tolerance threshold ~8px)
  items.sort((a, b) => a.y - b.y);
  const rows: TextItemWithCoords[][] = [];
  let currentRow: TextItemWithCoords[] = [items[0]];

  for (let i = 1; i < items.length; i++) {
    const prevItem = items[i - 1];
    const currItem = items[i];

    if (Math.abs(currItem.y - prevItem.y) < 8) {
      currentRow.push(currItem);
    } else {
      // Sort the completed row from left to right (X coordinate)
      currentRow.sort((a, b) => a.x - b.x);
      rows.push(currentRow);
      currentRow = [currItem];
    }
  }
  if (currentRow.length > 0) {
    currentRow.sort((a, b) => a.x - b.x);
    rows.push(currentRow);
  }

  // 2. Format into clean string matrix
  const formattedRows: string[][] = rows.map((r) => r.map((c) => c.text));

  // Treat first row as headers, remaining as rows
  const headers = formattedRows[0] || [];
  const bodyRows = formattedRows.slice(1);

  return {
    headers,
    rows: bodyRows.length > 0 ? bodyRows : [['(Only one row detected)']],
  };
}

/**
 * Export extracted table data to an Excel (.xlsx) file
 */
export function exportTableToExcel(table: ExtractedTable, fileName = 'extracted_table.xlsx') {
  const fullData = [table.headers, ...table.rows];
  const worksheet = XLSX.utils.aoa_to_sheet(fullData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export extracted table to CSV format
 */
export function exportTableToCSV(table: ExtractedTable, fileName = 'extracted_table.csv') {
  const fullData = [table.headers, ...table.rows];
  const worksheet = XLSX.utils.aoa_to_sheet(fullData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
