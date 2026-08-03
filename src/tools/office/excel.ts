// @ts-nocheck
import * as XLSX from 'xlsx';
import fs from 'fs-extra';

export class ExcelTool {
  async read(filePath: string, sheetName?: string): Promise<string> {
    try {
      const workbook = XLSX.readFile(filePath);
      const targetSheet = sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[targetSheet];

      if (!worksheet) return `Sheet "${targetSheet}" not found`;

      const data = XLSX.utils.sheet_to_csv(worksheet);
      return data.slice(0, 10000);
    } catch (error: any) {
      return `Error reading Excel: ${error.message}`;
    }
  }

  async write(filePath: string, data: any[][], sheetName = 'Sheet1'): Promise<string> {
    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, filePath);
      return `Written ${data.length} rows to ${filePath}`;
    } catch (error: any) {
      return `Error writing Excel: ${error.message}`;
    }
  }

  async listSheets(filePath: string): Promise<string> {
    try {
      const workbook = XLSX.readFile(filePath);
      return `Sheets: ${workbook.SheetNames.join(', ')}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async toCsv(filePath: string, outputPath?: string): Promise<string> {
    try {
      const workbook = XLSX.readFile(filePath);
      const targetSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[targetSheet];
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      const out = outputPath || filePath.replace(/\.xlsx?$/i, '.csv');
      await fs.writeFile(out, csv, 'utf-8');

      return `Converted to CSV: ${out}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

export const excelTool = new ExcelTool();
