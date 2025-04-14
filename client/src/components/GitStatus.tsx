import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { getStatus } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

interface GitStatusProps {
  repositoryId: number;
}

export default function GitStatus({ repositoryId }: GitStatusProps) {
  const { 
    data: status, 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/repositories', repositoryId, 'status'],
    enabled: !!repositoryId,
  });

  // Count the total number of changes
  const totalChanges = status ? (
    (status.stagedChanges?.length || 0) + 
    (status.unstagedChanges?.length || 0) + 
    (status.untrackedFiles?.length || 0)
  ) : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <span>Git Status</span>
          {status && !status.isClean && (
            <span className="ml-2 px-2 py-0.5 bg-warning/20 text-warning rounded-full text-xs flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Changes detected
            </span>
          )}
        </h2>
        
        {isLoading ? (
          <StatusSkeleton />
        ) : isError ? (
          <div className="py-4 text-center text-sm text-destructive">
            Error loading status: {(error as Error).message}
          </div>
        ) : status ? (
          <>
            <div className="text-sm mb-4">
              <div className="text-muted-foreground mb-1">Current Branch</div>
              <div className="font-mono">{status.branch}</div>
            </div>
            
            {!status.isClean ? (
              <div className="rounded-md bg-muted/30 border border-border p-3 font-mono text-sm overflow-x-auto custom-scrollbar">
                <pre className="text-foreground">
                  {`On branch ${status.branch}\n`}
                  {status.unstagedChanges && status.unstagedChanges.length > 0 && `
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
${status.unstagedChanges.map(file => `        modified:   ${file.path}`).join('\n')}
`}
                  {status.untrackedFiles && status.untrackedFiles.length > 0 && `
Untracked files:
  (use "git add <file>..." to include in what will be committed)
${status.untrackedFiles.map(file => `        ${file.path}`).join('\n')}
`}
                </pre>
              </div>
            ) : (
              <div className="rounded-md bg-muted/30 border border-border p-3 font-mono text-sm">
                <pre className="text-foreground">
                  {`On branch ${status.branch}\n`}
                  Your working directory is clean.
                </pre>
              </div>
            )}
          </>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Status information unavailable
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
