import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { getFiles, getFileContent } from "@/lib/api";
import { ChevronRight, ChevronDown, FileIcon, FolderIcon, Code } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileTreeProps {
  repositoryId: number;
  ref?: string;
  expanded?: boolean;
}

interface FileItemProps {
  path: string;
  type: "file" | "directory";
  status?: string;
  children?: React.ReactNode;
  level: number;
  onClick: () => void;
  expanded: boolean;
}

export default function FileTree({ 
  repositoryId, 
  ref = "HEAD",
  expanded = false 
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { 
    data: files, 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/repositories', repositoryId, 'files', ref],
    enabled: !!repositoryId,
  });

  const {
    data: fileContent,
    isLoading: isLoadingContent
  } = useQuery({
    queryKey: ['/api/repositories', repositoryId, 'file-content', selectedFile, ref],
    enabled: !!selectedFile && isDialogOpen,
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleFileClick = (path: string) => {
    setSelectedFile(path);
    setIsDialogOpen(true);
  };

  // Build a nested file tree structure
  const buildFileTree = () => {
    if (!files) return null;
    
    const root: Record<string, any> = {};
    
    files.forEach(file => {
      const pathParts = file.path.split('/');
      let currentLevel = root;
      
      pathParts.forEach((part, index) => {
        const isLastPart = index === pathParts.length - 1;
        const currentPath = pathParts.slice(0, index + 1).join('/');
        
        if (!currentLevel[part]) {
          currentLevel[part] = {
            path: currentPath,
            type: isLastPart ? file.type : "directory",
            status: file.status,
            children: {}
          };
        }
        
        if (!isLastPart) {
          currentLevel = currentLevel[part].children;
        }
      });
    });
    
    return renderFileTree(root, 0);
  };
  
  const renderFileTree = (node: Record<string, any>, level: number) => {
    return Object.keys(node).sort((a, b) => {
      // Sort directories first, then files
      const aIsDir = node[a].type === "directory";
      const bIsDir = node[b].type === "directory";
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    }).map(key => {
      const item = node[key];
      const isExpanded = expandedFolders.has(item.path) || (expanded && level < 1);
      
      return (
        <FileItem 
          key={item.path}
          path={key}
          type={item.type}
          status={item.status}
          level={level}
          expanded={isExpanded}
          onClick={() => {
            if (item.type === "directory") {
              toggleFolder(item.path);
            } else {
              handleFileClick(item.path);
            }
          }}
        >
          {item.type === "directory" && isExpanded && 
            renderFileTree(item.children, level + 1)}
        </FileItem>
      );
    });
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-3">File Tree</h2>
          
          <div className="text-sm mb-2 flex items-center">
            <div className="text-muted-foreground">Showing files for commit:</div>
            <code className="ml-2 px-1.5 py-0.5 bg-muted rounded">{ref}</code>
          </div>
          
          <div className="rounded-md border border-border p-2 font-mono text-sm">
            {isLoading ? (
              <FileTreeSkeleton />
            ) : isError ? (
              <div className="p-4 text-center text-destructive">
                Error loading files: {(error as Error).message}
              </div>
            ) : files && files.length > 0 ? (
              buildFileTree()
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No files found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm truncate">
              {selectedFile}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-grow">
            <div className="p-4">
              {isLoadingContent ? (
                <Skeleton className="h-[60vh] w-full" />
              ) : (
                <pre className="text-sm p-4 bg-muted/30 rounded-md overflow-x-auto whitespace-pre-wrap">
                  {fileContent}
                </pre>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FileItem({ path, type, status, children, level, onClick, expanded }: FileItemProps) {
  const indent = level * 16;
  
  return (
    <>
      <div 
        className="flex items-center p-1 hover:bg-muted/50 rounded cursor-pointer"
        style={{ paddingLeft: `${indent}px` }}
        onClick={onClick}
      >
        {type === "directory" ? (
          <>
            {expanded ? 
              <ChevronDown className="h-4 w-4 mr-1" /> : 
              <ChevronRight className="h-4 w-4 mr-1" />
            }
            <FolderIcon className="h-4 w-4 mr-2 text-primary" />
          </>
        ) : (
          <>
            <span className="w-4 mr-1"></span>
            <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          </>
        )}
        <span>{path}</span>
        {status && (
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            status === 'modified' ? 'bg-warning/20 text-warning' :
            status === 'added' ? 'bg-success/20 text-success' :
            status === 'deleted' ? 'bg-destructive/20 text-destructive' :
            'bg-muted text-muted-foreground'
          }`}>
            {status}
          </span>
        )}
      </div>
      {children && (
        <div>{children}</div>
      )}
    </>
  );
}

function FileTreeSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center p-1">
        <ChevronRight className="h-4 w-4 mr-1 text-muted" />
        <FolderIcon className="h-4 w-4 mr-2 text-muted" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center p-1 ml-6">
        <FileIcon className="h-4 w-4 mr-2 text-muted" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center p-1">
        <ChevronRight className="h-4 w-4 mr-1 text-muted" />
        <FolderIcon className="h-4 w-4 mr-2 text-muted" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex items-center p-1">
        <FileIcon className="h-4 w-4 mr-2 ml-5 text-muted" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}
