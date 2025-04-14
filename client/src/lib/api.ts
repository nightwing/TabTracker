import { apiRequest } from "./queryClient";
import { 
  InsertRepository, 
  Repository, 
  Branch,
  Commit,
  Status,
  File,
  Tag 
} from "@shared/schema";

// Repository management
export async function listRepositories(): Promise<Repository[]> {
  const res = await apiRequest("GET", "/api/repositories");
  return res.json();
}

export async function addRepository(repository: InsertRepository): Promise<Repository> {
  const res = await apiRequest("POST", "/api/repositories", repository);
  return res.json();
}

export async function getRepository(id: number): Promise<Repository> {
  const res = await apiRequest("GET", `/api/repositories/${id}`);
  return res.json();
}

export async function deleteRepository(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/repositories/${id}`);
}

// Git operations
export async function getBranches(repositoryId: number): Promise<Branch[]> {
  const res = await apiRequest("GET", `/api/repositories/${repositoryId}/branches`);
  return res.json();
}

export async function getCommits(
  repositoryId: number, 
  branch: string = "HEAD", 
  limit: number = 10
): Promise<Commit[]> {
  const res = await apiRequest(
    "GET", 
    `/api/repositories/${repositoryId}/commits?branch=${branch}&limit=${limit}`
  );
  return res.json();
}

export async function getStatus(repositoryId: number): Promise<Status> {
  const res = await apiRequest("GET", `/api/repositories/${repositoryId}/status`);
  return res.json();
}

export async function getFiles(
  repositoryId: number, 
  ref: string = "HEAD"
): Promise<File[]> {
  const res = await apiRequest(
    "GET", 
    `/api/repositories/${repositoryId}/files?ref=${ref}`
  );
  return res.json();
}

export async function getFileContent(
  repositoryId: number, 
  filePath: string, 
  ref: string = "HEAD"
): Promise<string> {
  const res = await apiRequest(
    "GET", 
    `/api/repositories/${repositoryId}/file-content?path=${encodeURIComponent(filePath)}&ref=${ref}`
  );
  return res.text();
}

export async function getTags(repositoryId: number): Promise<Tag[]> {
  const res = await apiRequest("GET", `/api/repositories/${repositoryId}/tags`);
  return res.json();
}
