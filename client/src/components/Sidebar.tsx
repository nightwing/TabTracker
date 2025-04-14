import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Repository } from "@shared/schema";
import { getBranches, getTags, addRepository } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertRepositorySchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { GitBranch, Search, PlusCircle, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "./ui/theme-toggle";

interface SidebarProps {
  repositories: Repository[];
  selectedRepository: Repository | null;
  onSelectRepository: (repository: Repository) => void;
  selectedBranch: string | null;
  onSelectBranch: (branch: string) => void;
}

const addRepositorySchema = insertRepositorySchema.extend({
  path: z.string().min(1, "Repository path is required"),
});

export default function Sidebar({
  repositories,
  selectedRepository,
  onSelectRepository,
  selectedBranch,
  onSelectBranch
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof addRepositorySchema>>({
    resolver: zodResolver(addRepositorySchema),
    defaultValues: {
      name: "",
      path: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: addRepository,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Repository added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/repositories'] });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add repository",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof addRepositorySchema>) => {
    mutate(data);
  };

  // Fetch branches when a repository is selected
  const {
    data: branches,
    isLoading: isLoadingBranches,
  } = useQuery({
    queryKey: ['/api/repositories', selectedRepository?.id, 'branches'],
    enabled: !!selectedRepository,
  });

  // Fetch tags when a repository is selected
  const {
    data: tags,
    isLoading: isLoadingTags,
  } = useQuery({
    queryKey: ['/api/repositories', selectedRepository?.id, 'tags'],
    enabled: !!selectedRepository,
  });

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-64 bg-sidebar dark:bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="px-4 py-3 flex items-center justify-between border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-primary flex items-center">
          <GitBranch className="mr-2 h-5 w-5" />
          Git Viewer
        </h1>
        <ThemeToggle />
      </div>
      
      <div className="overflow-y-auto flex-grow custom-scrollbar">
        {/* Repository selector */}
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Repositories</h2>
          
          <div className="relative">
            <Input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-8 text-sm"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Repository list */}
          <div className="mt-3 space-y-1">
            {filteredRepositories.length > 0 ? (
              filteredRepositories.map((repo) => (
                <div
                  key={repo.id}
                  className={`repo-item p-2 rounded-md cursor-pointer hover:bg-sidebar-accent dark:hover:bg-sidebar-accent flex items-center justify-between repo-badge ${
                    selectedRepository?.id === repo.id ? 'bg-sidebar-accent dark:bg-sidebar-accent' : ''
                  } ${repo.id % 2 === 0 ? 'modified' : 'active'}`}
                  onClick={() => onSelectRepository(repo)}
                >
                  <div className="flex items-center">
                    <span className="text-sm">{repo.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">main</div>
                </div>
              ))
            ) : (
              <div className="py-2 text-center text-sm text-muted-foreground">
                No repositories found
              </div>
            )}
          </div>
        </div>
        
        {/* Branch selector - Shown when repo is selected */}
        {selectedRepository && (
          <div className="p-4 border-b border-sidebar-border">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Branches</h2>
            {isLoadingBranches ? (
              <div className="py-2 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-1">
                {branches && branches.length > 0 ? (
                  branches.map((branch) => (
                    <div
                      key={branch.name}
                      className={`branch-item p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent cursor-pointer flex items-center ${
                        selectedBranch === branch.name ? 'bg-sidebar-accent dark:bg-sidebar-accent' : ''
                      }`}
                      onClick={() => onSelectBranch(branch.name)}
                    >
                      <GitBranch className="mr-2 h-4 w-4" />
                      <span className="text-sm">{branch.name}</span>
                      {branch.current && (
                        <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 rounded-full">
                          current
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-center text-sm text-muted-foreground">
                    No branches found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Tags section */}
        {selectedRepository && (
          <div className="p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tags</h2>
            {isLoadingTags ? (
              <div className="py-2 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-1">
                {tags && tags.length > 0 ? (
                  tags.map((tag) => (
                    <div
                      key={tag.name}
                      className="tag-item p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent cursor-pointer flex items-center"
                    >
                      <Tag className="mr-2 h-4 w-4" />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-center text-sm text-muted-foreground">
                    No tags found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Repository</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository Name</FormLabel>
                      <FormControl>
                        <Input placeholder="my-project" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="path"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository Path</FormLabel>
                      <FormControl>
                        <Input placeholder="/path/to/repository" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Repository
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}

// Small loader component for reuse
function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
