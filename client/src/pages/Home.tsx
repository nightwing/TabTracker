import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { listRepositories } from "@/lib/api";
import { Repository } from "@shared/schema";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { 
    data: repositories, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/repositories'],
    staleTime: 10000, // 10 seconds
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading repositories...</span>
      </div>
    );
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load repositories",
      variant: "destructive",
    });
  }

  const handleRepositorySelect = (repository: Repository) => {
    setSelectedRepository(repository);
    setSelectedBranch(null); // Reset branch when changing repository
  };

  const handleBranchSelect = (branchName: string) => {
    setSelectedBranch(branchName);
  };

  return (
    <div className="flex h-screen">
      <Sidebar 
        repositories={repositories || []} 
        selectedRepository={selectedRepository} 
        onSelectRepository={handleRepositorySelect}
        selectedBranch={selectedBranch}
        onSelectBranch={handleBranchSelect}
      />
      
      <MainContent 
        selectedRepository={selectedRepository}
        selectedBranch={selectedBranch}
      />
    </div>
  );
}
