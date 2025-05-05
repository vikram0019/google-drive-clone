import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string) {
  const type = mimeType.split('/')[0];
  const subType = mimeType.split('/')[1];

  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'application':
      switch (subType) {
        case 'pdf':
          return 'pdf';
        case 'msword':
        case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
          return 'word';
        case 'vnd.ms-excel':
        case 'vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          return 'excel';
        case 'vnd.ms-powerpoint':
        case 'vnd.openxmlformats-officedocument.presentationml.presentation':
          return 'powerpoint';
        case 'zip':
        case 'x-zip-compressed':
        case 'x-rar-compressed':
        case 'x-7z-compressed':
          return 'archive';
        default:
          return 'file';
      }
    default:
      return 'file';
  }
}

export function buildFolderPath(folderIds: string[] = []) {
  return folderIds.length > 0 ? `/${folderIds.join('/')}` : '/';
}