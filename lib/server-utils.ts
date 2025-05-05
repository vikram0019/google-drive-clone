import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
/**
 * Ensures that a directory exists. If it doesn't, it creates the directory.
 */
export function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generates a unique filename by appending a UUID to the sanitized original filename.
 */
export function generateUniqueFilename(originalFilename: string) {
  const ext = path.extname(originalFilename);
  const name = path.basename(originalFilename, ext);
  const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${sanitizedName}-${uuidv4()}${ext}`;
}


