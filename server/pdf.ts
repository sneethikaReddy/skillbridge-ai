// PDF text extraction utility
import { PDFParse } from 'pdf-parse';

export interface PdfExtractResult {
  text: string;
  numPages: number;
  isScannedOrEmpty: boolean;
  notes?: string;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Provided PDF file buffer is empty.');
  }

  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const cleanedText = (textResult.text || '').replace(/\r\n/g, '\n').trim();
    const numPages = textResult.pages?.length || 1;

    if (cleanedText.length < 50) {
      return {
        text: cleanedText,
        numPages,
        isScannedOrEmpty: true,
        notes:
          'Extracted text is very short or empty. This may be an image-only (scanned) PDF or an encrypted document. You can paste your resume text manually using the Manual Text Entry tab.',
      };
    }

    return {
      text: cleanedText,
      numPages,
      isScannedOrEmpty: false,
    };
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to read PDF document: ${error?.message || 'Unsupported format'}. Please try pasting text directly.`);
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
}
