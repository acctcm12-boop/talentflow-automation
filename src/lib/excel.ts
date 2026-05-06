import * as XLSX from "xlsx";

export function downloadExcel(filename: string, sheets: { name: string; rows: any[] }[], meta?: Record<string, any>) {
  const wb = XLSX.utils.book_new();
  if (meta) {
    const metaRows = Object.entries(meta).map(([k, v]) => ({ Field: k, Value: String(v ?? "") }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metaRows), "Report info");
  }
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows.length ? s.rows : [{ "(no data)": "" }]);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}
