import { repositories, type Repository, type InsertRepository } from "@shared/schema";

export interface IStorage {
  listRepositories(): Promise<Repository[]>;
  getRepository(id: number): Promise<Repository | undefined>;
  addRepository(repository: InsertRepository): Promise<Repository>;
  removeRepository(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private repositories: Map<number, Repository>;
  private currentId: number;

  constructor() {
    this.repositories = new Map();
    this.currentId = 1;
  }

  async listRepositories(): Promise<Repository[]> {
    return Array.from(this.repositories.values());
  }

  async getRepository(id: number): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async addRepository(insertRepo: InsertRepository): Promise<Repository> {
    const id = this.currentId++;
    const now = new Date();
    const repository: Repository = { 
      ...insertRepo, 
      id, 
      lastSyncedAt: now 
    };
    this.repositories.set(id, repository);
    return repository;
  }

  async removeRepository(id: number): Promise<boolean> {
    return this.repositories.delete(id);
  }
}

export const storage = new MemStorage();
