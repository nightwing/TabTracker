import { Repository } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, GitFork, GitCommit } from "lucide-react";

interface RepositoryInfoProps {
  repository: Repository;
}

export default function RepositoryInfo({ repository }: RepositoryInfoProps) {
  // Calculate time ago for last sync
  const timeAgo = repository.lastSyncedAt 
    ? formatTimeAgo(new Date(repository.lastSyncedAt))
    : "Unknown";

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-3">Repository Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Repository Path</div>
            <div className="font-mono text-sm">{repository.path}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Remote Origin</div>
            <div className="font-mono text-sm">{repository.remoteUrl || "No remote configured"}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-border rounded-md p-3">
            <div className="text-sm text-muted-foreground mb-1 flex items-center">
              <GitFork className="h-4 w-4 mr-1" />
              Branches
            </div>
            <div className="text-lg font-semibold">-</div>
          </div>
          <div className="border border-border rounded-md p-3">
            <div className="text-sm text-muted-foreground mb-1 flex items-center">
              <GitCommit className="h-4 w-4 mr-1" />
              Commits
            </div>
            <div className="text-lg font-semibold">-</div>
          </div>
          <div className="border border-border rounded-md p-3">
            <div className="text-sm text-muted-foreground mb-1 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Last Updated
            </div>
            <div className="text-lg font-semibold">{timeAgo}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format relative time
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
}
