import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { getCommits } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CommitHistoryProps {
  repositoryId: number;
  branch: string | null;
  limit?: number;
}

export default function CommitHistory({ 
  repositoryId, 
  branch = "HEAD",
  limit = 10 
}: CommitHistoryProps) {
  const [viewAll, setViewAll] = useState(false);
  const actualLimit = viewAll ? 50 : limit;
  
  const { 
    data: commits, 
    isLoading,
    isError,
    error 
  } = useQuery({
    queryKey: ['/api/repositories', repositoryId, 'commits', branch, actualLimit],
    enabled: !!repositoryId,
  });

  const toggleViewAll = () => {
    setViewAll(!viewAll);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-3">
          {limit === 5 ? 'Recent Commits' : 'Commit History'}
        </h2>
        
        {isLoading ? (
          <CommitSkeleton count={3} />
        ) : isError ? (
          <div className="py-4 text-center text-sm text-destructive">
            Error loading commits: {(error as Error).message}
          </div>
        ) : commits && commits.length > 0 ? (
          <div className="space-y-3">
            {commits.map((commit, index) => (
              <div 
                key={commit.hash} 
                className={`flex border-b border-border pb-3 ${
                  index === commits.length - 1 ? 'border-b-0 pb-0' : ''
                }`}
              >
                <div className="w-8 flex-shrink-0 flex justify-center">
                  <div className="w-4 h-4 rounded-full bg-primary mt-1"></div>
                </div>
                <div className="flex-grow">
                  <div className="font-medium">{commit.message}</div>
                  <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-3 mt-1">
                    <span>{commit.author}</span>
                    <span>{formatDate(commit.date)}</span>
                    <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{commit.shortHash}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No commits found
          </div>
        )}
        
        {limit === 5 && commits && commits.length >= 5 && (
          <div className="mt-3 text-center">
            <Button 
              variant="link" 
              className="text-primary"
              onClick={toggleViewAll}
            >
              {viewAll ? 'Show less' : 'View all commits'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommitSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="flex">
          <div className="w-8 flex-shrink-0 flex justify-center">
            <Skeleton className="w-4 h-4 rounded-full mt-1" />
          </div>
          <div className="flex-grow">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // If more than 30 days, show the actual date
  return date.toLocaleDateString();
}
