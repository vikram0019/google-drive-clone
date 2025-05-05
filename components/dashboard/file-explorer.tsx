'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FolderIcon,
  FileIcon,
  PlusIcon,
  Upload,
  ArrowLeft,
  FolderPlus,
  FileUp,
  Image as ImageIcon,
  FileText,
  AlignJustify,
  Grid,
  SlidersHorizontal,
  Search,
  MoreVertical,
  File as FileIconOutline,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatBytes, getFileIcon } from '@/lib/utils';
import { LoadingSpinner } from '@/components/dashboard/loading-spinner';
import { FilePreview } from '@/components/dashboard/file-preview';
import { Breadcrumbs } from '@/components/dashboard/breadcrumbs';

export interface Folder {
  _id: string;
  name: string;
  path: string;
  parentId: string | null;
  createdAt: string;
}

interface File {
  _id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  folderId: string | null;
  createdAt: string;
}

export function FileExplorer() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folder');
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [parentFolders, setParentFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);

  // Load folders and files
  useEffect(() => {
    if (session?.user) {
      fetchFoldersAndFiles();
    }
  }, [session, folderId]);

  const fetchFoldersAndFiles = async () => {
    setIsLoading(true);
    try {
      // Fetch current folder if ID is provided
      if (folderId) {
        const folderResponse = await fetch(`/api/folders/${folderId}`);
        if (folderResponse.ok) {
          const folderData = await folderResponse.json();
          setCurrentFolder(folderData);
          
          // Build breadcrumb path
          await fetchParentFolders(folderData);
        }
      } else {
        setCurrentFolder(null);
        setParentFolders([]);
      }
      
      // Fetch folders in current location
      const foldersResponse = await fetch(`/api/folders?parentId=${folderId || ''}`);
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json();
        setFolders(foldersData);
      }
      
      // Fetch files in current location
      const filesResponse = await fetch(`/api/files?folderId=${folderId || ''}`);
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load files and folders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParentFolders = async (folder: Folder) => {
    const parentFoldersList: Folder[] = [];
    let currentParentId = folder.parentId;
    
    while (currentParentId) {
      try {
        const response = await fetch(`/api/folders/${currentParentId}`);
        if (response.ok) {
          const parentFolder = await response.json();
          parentFoldersList.unshift(parentFolder);
          currentParentId = parentFolder.parentId;
        } else {
          break;
        }
      } catch (error) {
        console.error('Error fetching parent folder:', error);
        break;
      }
    }
    
    setParentFolders(parentFoldersList);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty');
      return;
    }
    
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName,
          parentId: folderId || null,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create folder');
      }
      
      toast.success('Folder created successfully');
      setNewFolderName('');
      setIsCreatingFolder(false);
      fetchFoldersAndFiles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create folder');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    debugger;
    const files = event.target.files;
    console.log('Uploading files:', files);
    if (!files || files.length === 0) return;
   
    setIsUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      
      if (folderId) {
        formData.append('folderId', folderId);
      }
      
      try {
        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }
        
        toast.success(`${file.name} uploaded successfully`);
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
    
    setIsUploading(false);
    fetchFoldersAndFiles();
    
    // Reset the input value so the same file can be uploaded again
    event.target.value = '';
  };

  const handleFolderClick = (folder: Folder) => {
    router.push(`/dashboard?folder=${folder._id}`);
  };

  const handleFileClick = (file: File) => {
    setSelectedFile(file);
    setIsFilePreviewOpen(true);
  };

  const handleDeleteFile = async (file: File) => {
    if (!confirm(`Are you sure you want to delete ${file.originalName}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/files/${file._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file');
      }
      
      toast.success('File deleted successfully');
      fetchFoldersAndFiles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete file');
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Are you sure you want to delete ${folder.name} and all its contents?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/folders/${folder._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete folder');
      }
      
      toast.success('Folder deleted successfully');
      fetchFoldersAndFiles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete folder');
    }
  };

  const handleGoBack = () => {
    if (parentFolders.length > 0) {
      const parentFolder = parentFolders[parentFolders.length - 1];
      router.push(`/dashboard?folder=${parentFolder._id}`);
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoToFolder = (folder: Folder) => {
    router.push(`/dashboard?folder=${folder._id}`);
  };

  const handleGoToRoot = () => {
    router.push('/dashboard');
  };

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredFiles = files.filter(file => 
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFileIcon = (file: File) => {
    const iconType = getFileIcon(file.mimeType);
    
    switch (iconType) {
      case 'image':
        return <ImageIcon className="h-6 w-6 text-blue-500" />;
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'word':
        return <FileText className="h-6 w-6 text-blue-600" />;
      case 'excel':
        return <FileText className="h-6 w-6 text-green-600" />;
      case 'powerpoint':
        return <FileText className="h-6 w-6 text-orange-500" />;
      case 'archive':
        return <FileText className="h-6 w-6 text-yellow-500" />;
      default:
        return <FileIconOutline className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2">
          {(currentFolder || parentFolders.length > 0) && (
            <Button variant="outline" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <div className="flex-1">
            <Breadcrumbs
              folders={[...parentFolders, ...(currentFolder ? [currentFolder] : [])]}
              onFolderClick={handleGoToFolder}
              onHomeClick={handleGoToRoot}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <AlignJustify className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsCreatingFolder(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <label className="flex w-full cursor-pointer items-center">
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload File
                  <Input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
          <div className="rounded-full bg-muted p-3">
            {searchQuery ? (
              <Search className="h-6 w-6 text-muted-foreground" />
            ) : (
              <FileIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium">
              {searchQuery ? 'No results found' : 'No files or folders'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `No matching files or folders found for "${searchQuery}"`
                : 'Get started by creating a folder or uploading files'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsCreatingFolder(true)}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
            <Button asChild>
              <label className="flex cursor-pointer items-center">
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
                <Input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 overflow-auto rounded-md border bg-muted/30">
          {isUploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <div className="flex flex-col items-center space-y-2 rounded-lg bg-card p-6 shadow-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">Uploading files...</p>
              </div>
            </div>
          )}
          
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredFolders.map((folder) => (
                <div
                  key={folder._id}
                  onClick={() => handleFolderClick(folder)}
                  className="group flex cursor-pointer flex-col items-center rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="mb-2 rounded-lg p-2">
                    <FolderIcon className="h-10 w-10 text-yellow-400" />
                  </div>
                  <span className="mt-1 text-center font-medium line-clamp-1">
                    {folder.name}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {new Date(folder.createdAt).toLocaleDateString()}
                  </span>
                  <div className="mt-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              
              {filteredFiles.map((file) => (
                <div
                  key={file._id}
                  onClick={() => handleFileClick(file)}
                  className="group flex cursor-pointer flex-col items-center rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="mb-2 rounded-lg p-2">
                    {renderFileIcon(file)}
                  </div>
                  <span className="mt-1 text-center font-medium line-clamp-1">
                    {file.originalName}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </span>
                  <div className="mt-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {filteredFolders.map((folder) => (
                <div
                  key={folder._id}
                  onClick={() => handleFolderClick(folder)}
                  className="group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center space-x-4">
                    <FolderIcon className="h-6 w-6 text-yellow-400" />
                    <div>
                      <p className="font-medium">{folder.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Folder • {new Date(folder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              
              {filteredFiles.map((file) => (
                <div
                  key={file._id}
                  onClick={() => handleFileClick(file)}
                  className="group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center space-x-4">
                    {renderFileIcon(file)}
                    <div>
                      <p className="font-medium">{file.originalName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingFolder(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      {selectedFile && (
        <FilePreview
          file={selectedFile}
          isOpen={isFilePreviewOpen}
          onClose={() => {
            setIsFilePreviewOpen(false);
            setSelectedFile(null);
          }}
          onDelete={() => {
            handleDeleteFile(selectedFile);
            setIsFilePreviewOpen(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
}