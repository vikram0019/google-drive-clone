import Link from 'next/link';
import { HomeIcon, ChevronRight } from 'lucide-react';

interface Folder {
  _id: string;
  name: string;
}

interface BreadcrumbsProps {
  folders: Folder[];
  onFolderClick: (folder: Folder) => void;
  onHomeClick: () => void;
}

export function Breadcrumbs({ folders, onFolderClick, onHomeClick }: BreadcrumbsProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <li>
          <button
            onClick={onHomeClick}
            className="flex items-center rounded-md p-1 hover:bg-muted"
          >
            <HomeIcon className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </button>
        </li>
        
        {folders.map((folder, index) => (
          <li key={folder._id} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => onFolderClick(folder)}
              className={`flex items-center rounded-md px-2 py-1 text-sm hover:bg-muted ${
                index === folders.length - 1
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {folder.name}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}