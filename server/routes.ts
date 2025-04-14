import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as gitCommands from "./gitCommands";
import * as fs from "fs";
import * as path from "path";
import { insertRepositorySchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for repository management
  app.get("/api/repositories", async (req: Request, res: Response) => {
    try {
      const repositories = await storage.listRepositories();
      res.json(repositories);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch repositories: ${error}` });
    }
  });

  app.post("/api/repositories", async (req: Request, res: Response) => {
    try {
      const repoData = insertRepositorySchema.parse(req.body);
      
      // Verify the path exists
      if (!fs.existsSync(repoData.path)) {
        return res.status(400).json({ error: "Repository path does not exist" });
      }
      
      // Verify the path is a git repository
      if (!fs.existsSync(path.join(repoData.path, ".git"))) {
        return res.status(400).json({ error: "Not a git repository" });
      }
      
      // Get the remote URL if available
      const remoteUrl = await gitCommands.getRemoteUrl(repoData.path);
      
      const repository = await storage.addRepository({
        ...repoData,
        remoteUrl: remoteUrl || undefined,
      });
      
      res.status(201).json(repository);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: `Failed to add repository: ${error}` });
    }
  });

  app.get("/api/repositories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid repository ID" });
      }
      
      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }
      
      res.json(repository);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch repository: ${error}` });
    }
  });

  app.delete("/api/repositories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid repository ID" });
      }
      
      const success = await storage.removeRepository(id);
      if (!success) {
        return res.status(404).json({ error: "Repository not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: `Failed to delete repository: ${error}` });
    }
  });

  // Git operations routes
  app.get("/api/repositories/:id/branches", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid repository ID" });
      }
      
      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }
      
      const branches = await gitCommands.getBranches(repository.path);
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch branches: ${error}` });
    }
  });

  app.get("/api/repositories/:id/commits", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid repository ID" });
      }
      
      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }
      
      const branch = req.query.branch as string || "HEAD";
      const limit = parseInt(req.query.limit as string || "10");
      
      const commits = await gitCommands.getCommits(repository.path, branch, limit);
      res.json(commits);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch commits: ${error}` });
    }
  });

  app.get("/api/repositories/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid repository ID" });
      }
      
      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }
      
      const status = await gitCommands.getStatus(repository.path);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch status: ${error}` });
    }
  });

  app.get("/api/repositories/:id/files", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid repository ID" });
      }
      
      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }
      
      const ref = req.query.ref as string || "HEAD";
      const files = await gitCommands.getFileTree(repository.path, ref);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch files: ${error}` });
    }
  });

  app.get("/api/repositories/:id/file-content", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid repository ID" });
      }
      
      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }
      
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: "File path is required" });
      }
      
      const ref = req.query.ref as string || "HEAD";
      const content = await gitCommands.getFileContent(repository.path, filePath, ref);
      res.send(content);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch file content: ${error}` });
    }
  });

  app.get("/api/repositories/:id/tags", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid repository ID" });
      }
      
      const repository = await storage.getRepository(id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }
      
      const tags = await gitCommands.getTags(repository.path);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch tags: ${error}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
