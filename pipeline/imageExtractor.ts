import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { IMAGES_DIR } from './config.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function getPdfjs() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // Point to worker file using file:// URL so Node.js can load it
  const workerPath = path.resolve(
    __dirname,
    '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, '/')}`;

  return pdfjsLib;
}

export async function extractPageAsPng(
  pdfPath: string,
  pageNumber: number,
  outputPath: string
): Promise<void> {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const pdfjsLib = await getPdfjs();
  const { createCanvas } = await import('canvas');

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data, verbosity: 0 }).promise;

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Page ${pageNumber} out of range (PDF has ${pdf.numPages} pages)`);
  }

  const page = await pdf.getPage(pageNumber);
  const scale = 2.0;
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext('2d');

  await page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise;

  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
}

export function getImageOutputPath(id: string): string {
  return path.join(IMAGES_DIR, `${id}.png`);
}
