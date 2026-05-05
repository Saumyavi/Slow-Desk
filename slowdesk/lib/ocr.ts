import Tesseract from 'tesseract.js';

/**
 * Extract text from an image using Tesseract.js OCR
 * @param imageData - Base64 string or File object
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Extracted text from the image
 */
export async function extractTextFromImage(
  imageData: string | File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Create worker without logger to avoid cloning issues
    const worker = await Tesseract.createWorker('eng');

    // Recognize text from image
    const { data: { text } } = await worker.recognize(imageData);

    // Cleanup
    await worker.terminate();

    return text.trim();
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error('Failed to extract text from image. Please try again.');
  }
}

/**
 * Preprocess image for better OCR accuracy (optional enhancement)
 * Can be used to improve contrast, remove noise, etc.
 */
export function preprocessImage(imageData: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageData);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Increase contrast (optional)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const contrast = 1.2; // Contrast multiplier
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;     // Red
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
      }

      ctx.putImageData(imageData, 0, 0);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.src = imageData;
  });
}
