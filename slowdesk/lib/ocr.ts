import Tesseract from 'tesseract.js';

export async function extractTextFromImage(imageData: string | File): Promise<string> {
  try {
    const worker = await Tesseract.createWorker('eng');
    const { data: { text } } = await worker.recognize(imageData);
    await worker.terminate();
    return text.trim();
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error('Failed to extract text from image. Please try again.');
  }
}
