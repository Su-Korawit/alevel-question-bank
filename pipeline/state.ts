import fs from 'fs';
import path from 'path';
import { STATE_PATH } from './config.js';

export type FileStatus = 'pending' | 'uploading' | 'extracting' | 'done' | 'error';

export interface FileState {
  status: FileStatus;
  fileUri?: string;
  questionsExtracted?: number;
  completedAt?: string;
  error?: string;
}

export interface PipelineState {
  version: number;
  files: Record<string, FileState>;
}

export function loadState(): PipelineState {
  if (!fs.existsSync(STATE_PATH)) {
    return { version: 1, files: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    return { version: 1, files: {} };
  }
}

export function saveState(state: PipelineState): void {
  const tmpPath = STATE_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpPath, STATE_PATH);
}

export function isComplete(state: PipelineState, filename: string): boolean {
  return state.files[filename]?.status === 'done';
}

export function markUploading(state: PipelineState, filename: string, fileUri: string): void {
  state.files[filename] = { status: 'uploading', fileUri };
  saveState(state);
}

export function markExtracting(state: PipelineState, filename: string): void {
  state.files[filename] = { ...state.files[filename], status: 'extracting' };
  saveState(state);
}

export function markDone(state: PipelineState, filename: string, count: number): void {
  state.files[filename] = {
    ...state.files[filename],
    status: 'done',
    questionsExtracted: count,
    completedAt: new Date().toISOString(),
  };
  saveState(state);
}

export function markError(state: PipelineState, filename: string, error: string): void {
  state.files[filename] = { ...state.files[filename], status: 'error', error };
  saveState(state);
}

export function getCachedFileUri(state: PipelineState, filename: string): string | undefined {
  return state.files[filename]?.fileUri;
}
