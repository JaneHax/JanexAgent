// @ts-nocheck
import pdf from 'pdf-parse';
import fs from 'fs-extra';

export class PDFTool {
  async read(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text.slice(0, 10000);
    } catch (error: any) {
      return `Error reading PDF: ${error.message}`;
    }
  }

  async extractText(filePath: string, maxLength = 5000): Promise<string> {
    const text = await this.read(filePath);
    return text.slice(0, maxLength);
  }

  async info(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return JSON.stringify({
        pages: data.numpages,
        version: data.version,
        info: data.info,
        metadata: data.metadata
      }, null, 2);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

export const pdfTool = new PDFTool();
