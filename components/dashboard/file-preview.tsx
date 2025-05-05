'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';
import { FileText, Download, Trash2, X } from 'lucide-react';

interface File {
  _id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

interface FilePreviewProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function FilePreview({ file, isOpen, onClose, onDelete }: FilePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');

  const publicPath = file.path.replace('public', '');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = publicPath;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="flex h-full items-center justify-center overflow-hidden">
          <img
            src={publicPath}
            alt={file.originalName}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <iframe
          src={`${publicPath}#toolbar=0`}
          className="h-full w-full"
          title={file.originalName}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={publicPath}
          controls
          className="h-full max-h-[500px] w-full"
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <div className="rounded-full bg-primary/10 p-6">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <audio controls src={publicPath} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="rounded-full bg-primary/10 p-6">
          <FileText className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-medium">{file.originalName}</h3>
        <p className="text-muted-foreground">
          {formatBytes(file.size)} • {file.mimeType}
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-[600px]",
          isFullscreen && "fixed inset-0 max-w-none rounded-none"
        )}
      >
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-medium line-clamp-1">
            {file.originalName}
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="mt-4 flex h-[400px] items-center justify-center rounded-md border bg-muted/50">
          {renderPreview()}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>{formatBytes(file.size)} • {new Date(file.createdAt).toLocaleString()}</p>
        </div>
        
        <DialogFooter className="mt-4 flex justify-between sm:justify-between">
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}