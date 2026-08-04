// @ts-nocheck
import ExcelJS from 'exceljs';
import fs from 'fs-extra';

export class ExcelTool {
  async read(filePath: string, sheetName?: string): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const targetSheet = sheetName || workbook.getWorksheet(workbook.worksheets[0]?.id || 1)?.name || 'Sheet1';
      const worksheet = workbook.getWorksheet(targetSheet);
      if (!worksheet) return `Sheet "${targetSheet}" not found`;

      const rows: string[][] = [];
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        rows.push(row.values.filter((v) => v !== undefined && v !== null).map(String));
      });

      return rows.slice(0, 100).map((r) => r.join(',')).join('\n') || 'Empty sheet';
    } catch (error: any) {
      return `Error reading Excel: ${error.message}`;
    }
  }

  async write(filePath: string, data: any[][], sheetName = 'Sheet1'): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);
      for (const row of data) {
        worksheet.addRow(row);
      }
      await workbook.xlsx.writeFile(filePath);
      return `Written ${data.length} rows to ${filePath}`;
    } catch (error: any) {
      return `Error writing Excel: ${error.message}`;
    }
  }

  async listSheets(filePath: string): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const names = workbook.worksheets.map((ws) => ws.name);
      return `Sheets: ${names.join(', ')}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async toCsv(filePath: string, outputPath?: string): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return 'No sheets found';

      const rows: string[][] = [];
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        rows.push(row.values.filter((v) => v !== undefined && v !== null).map(String));
      });

      const csv = rows.map((r) => r.join(',')).join('\n');
      const out = outputPath || filePath.replace(/\.xlsx?$/i, '.csv');
      await fs.writeFile(out, csv, 'utf-8');
      return `Converted to CSV: ${out}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

export const excelTool = new ExcelTool();
