import { useState } from "react";
import { Repository } from "@shared/schema";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import RepositoryInfo from "./RepositoryInfo";
import CommitHistory from "./CommitHistory";
import FileTree from "./FileTree";
import GitStatus from "./GitStatus";

interface MainContentProps {
  selectedRepository: Repository | null;
  selectedBranch: string | null;
}

export default function MainContent({ 
  selectedRepository,
  selectedBranch
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  if (!selectedRepository) {
    return (
      <div className="flex-grow flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-muted-foreground">No Repository Selected</h2>
          <p className="text-muted-foreground max-w-md">
            Select a repository from the sidebar or add a new one to get started.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="flex-grow overflow-hidden flex flex-col">
      {/* TopBar */}
      <div className="bg-card border-b border-border px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Selected Repository: <span className="font-medium text-foreground">{selectedRepository.name}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {selectedBranch && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="3" x2="6" y2="15"></line>
                  <circle cx="18" cy="6" r="3"></circle>
                  <circle cx="6" cy="18" r="3"></circle>
                  <path d="M18 9a9 9 0 0 1-9 9"></path>
                </svg>
                {selectedBranch}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" title="Refresh">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col overflow-hidden">
        <div className="bg-card border-b border-border px-4">
          <TabsList className="h-auto p-0">
            <TabsTrigger 
              value="overview" 
              className="py-2 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="commits"
              className="py-2 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              Commits
            </TabsTrigger>
            <TabsTrigger 
              value="files"
              className="py-2 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              Files
            </TabsTrigger>
            <TabsTrigger 
              value="branches"
              className="py-2 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              Branches
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Content Area */}
        <div className="flex-grow overflow-auto p-4 custom-scrollbar">
          <TabsContent value="overview" className="space-y-4 mt-0">
            <RepositoryInfo repository={selectedRepository} />
            <GitStatus repositoryId={selectedRepository.id} />
            <CommitHistory repositoryId={selectedRepository.id} branch={selectedBranch} limit={5} />
            <FileTree repositoryId={selectedRepository.id} ref={selectedBranch || undefined} />
          </TabsContent>
          
          <TabsContent value="commits" className="mt-0">
            <CommitHistory repositoryId={selectedRepository.id} branch={selectedBranch} limit={20} />
          </TabsContent>
          
          <TabsContent value="files" className="mt-0">
            <FileTree repositoryId={selectedRepository.id} ref={selectedBranch || undefined} expanded />
          </TabsContent>
          
          <TabsContent value="branches" className="mt-0">
            <div className="bg-card rounded-lg shadow-sm border border-border p-4">
              <h2 className="text-lg font-semibold mb-4">Branch Visualization</h2>
              <div className="text-center text-muted-foreground py-8">
                Branch visualization feature coming soon
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
