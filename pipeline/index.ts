import 'dotenv/config';
import {
  discoverPdfs,
  type PdfDescriptor,
} from './config.js';
import {
  loadState,
  isComplete,
  markUploading,
  markExtracting,
  markDone,
  markError,
  getCachedFileUri,
  type PipelineState,
} from './state.js';
import { uploadPdf, extractQuestionsFromPdf } from './gemini.js';
import { processRawQuestions } from './extractor.js';
import { extractPageAsPng, getImageOutputPath } from './imageExtractor.js';
import { openDatabase, insertQuestion } from './db.js';
import { exportAllToJson } from './exporter.js';
import type Database from 'better-sqlite3';

async function processPdf(
  desc: PdfDescriptor,
  state: PipelineState,
  db: Database.Database
): Promise<void> {
  const { filename, subject, year, filepath } = desc;
  console.log(`\nProcessing: ${filename}`);

  // Step 1: Upload (or reuse cached URI)
  let fileUri = getCachedFileUri(state, filename);
  if (!fileUri) {
    markUploading(state, filename, '');
    fileUri = await uploadPdf(filepath, filename);
    markUploading(state, filename, fileUri);
  } else {
    console.log(`  Reusing cached file URI`);
  }

  // Step 2: Extract
  markExtracting(state, filename);
  const raw = await extractQuestionsFromPdf(fileUri, subject, year, filename);
  console.log(`  Gemini returned ${raw.length} raw questions`);

  // Step 3: Validate + assign IDs
  const { valid, errors } = processRawQuestions(raw, subject, year, filename);
  if (errors.length > 0) {
    console.warn(`  ${errors.length} validation errors:`);
    for (const e of errors) {
      console.warn(`    Q${e.number ?? '?'} (index ${e.index}): ${e.reason}`);
    }
  }
  console.log(`  ${valid.length} valid questions`);

  // Step 4: Extract images for questions with hasImage=true
  for (const q of valid) {
    if (q.has_image && q.page_number) {
      const outPath = getImageOutputPath(q.id);
      try {
        await extractPageAsPng(filepath, q.page_number, outPath);
        console.log(`  Extracted image for ${q.id} (page ${q.page_number})`);
      } catch (e) {
        console.warn(`  Failed to extract image for ${q.id}: ${(e as Error).message}`);
        // Keep has_image=1 so frontend knows a diagram exists; image_path stays null
        q.image_path = null;
      }
    }
  }

  // Step 5: Insert into SQLite
  const insert = db.transaction(() => {
    for (const q of valid) insertQuestion(db, q);
  });
  insert();
  console.log(`  Saved ${valid.length} questions to database`);

  markDone(state, filename, valid.length);
}

async function main() {
  console.log('A-Level Question Bank Pipeline');
  console.log('==============================');

  const pdfs = discoverPdfs();
  console.log(`Found ${pdfs.length} in-scope PDFs`);

  const state = loadState();
  const db = openDatabase();

  let processed = 0;
  let skipped = 0;

  for (const desc of pdfs) {
    if (isComplete(state, desc.filename)) {
      console.log(`Skipping ${desc.filename} (already done)`);
      skipped++;
      continue;
    }

    try {
      await processPdf(desc, state, db);
      processed++;
    } catch (e) {
      console.error(`ERROR processing ${desc.filename}: ${(e as Error).message}`);
      markError(state, desc.filename, (e as Error).message);
    }
  }

  console.log(`\nPipeline complete: ${processed} processed, ${skipped} skipped`);

  console.log('\nExporting JSON files...');
  exportAllToJson(db);
  console.log('Done.');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
