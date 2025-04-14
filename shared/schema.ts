import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Repository model
export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull().unique(),
  remoteUrl: text("remote_url"),
  lastSyncedAt: timestamp("last_synced_at"),
});

export const insertRepositorySchema = createInsertSchema(repositories).omit({
  id: true,
  lastSyncedAt: true,
});

export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type Repository = typeof repositories.$inferSelect;

// Define Git operation response types
export const branchSchema = z.object({
  name: z.string(),
  current: z.boolean(),
  commitHash: z.string(),
});
export type Branch = z.infer<typeof branchSchema>;

export const commitSchema = z.object({
  hash: z.string(),
  shortHash: z.string(),
  author: z.string(),
  email: z.string(),
  date: z.string(),
  message: z.string(),
});
export type Commit = z.infer<typeof commitSchema>;

export const fileSchema = z.object({
  path: z.string(),
  type: z.enum(["file", "directory"]),
  status: z.enum(["unmodified", "modified", "added", "deleted", "renamed", "untracked"]).optional(),
});
export type File = z.infer<typeof fileSchema>;

export const statusSchema = z.object({
  branch: z.string(),
  isClean: z.boolean(),
  stagedChanges: z.array(fileSchema).optional(),
  unstagedChanges: z.array(fileSchema).optional(),
  untrackedFiles: z.array(fileSchema).optional(),
});
export type Status = z.infer<typeof statusSchema>;

export const tagSchema = z.object({
  name: z.string(),
  commitHash: z.string(),
});
export type Tag = z.infer<typeof tagSchema>;
