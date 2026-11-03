import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export interface StoredProgram {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  source_code: string;
  language: string;
  category: string;
  tags: string[];
  folder_id?: string | null;
  is_favorite: boolean;
  visibility: "private" | "public";
  created_at: string;
  updated_at: string;
}

export interface StoredFolder {
  id: string;
  owner_id: string;
  name: string;
  parent_id?: string | null;
  created_at: string;
}

interface LocalDB {
  programs: StoredProgram[];
  folders: StoredFolder[];
}

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "workspace.json");

const DEFAULT_PROGRAMS: StoredProgram[] = [
  {
    id: "prog-default-1",
    owner_id: "default-user",
    title: "main.c",
    description: "Standard Hello World program",
    source_code: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
    language: "c",
    category: "General",
    tags: ["beginner", "hello-world"],
    folder_id: null,
    is_favorite: true,
    visibility: "private",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_FOLDERS: StoredFolder[] = [
  {
    id: "folder-default-1",
    owner_id: "default-user",
    name: "My Programs",
    created_at: new Date().toISOString(),
  },
];

async function ensureDB(): Promise<LocalDB> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const content = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    const initData: LocalDB = {
      programs: DEFAULT_PROGRAMS,
      folders: DEFAULT_FOLDERS,
    };
    await writeFile(DATA_FILE, JSON.stringify(initData, null, 2), "utf-8");
    return initData;
  }
}

async function saveDB(data: LocalDB): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getLocalPrograms(userId?: string): Promise<StoredProgram[]> {
  const db = await ensureDB();
  if (userId) {
    const userPrograms = db.programs.filter((p) => p.owner_id === userId || p.owner_id === "default-user");
    return userPrograms;
  }
  return db.programs;
}

export async function saveLocalProgram(
  program: Partial<StoredProgram> & { id?: string; title?: string }
): Promise<StoredProgram> {
  const db = await ensureDB();
  const id = program.id || randomUUID();
  const now = new Date().toISOString();

  const existingIndex = db.programs.findIndex((p) => p.id === id);

  if (existingIndex >= 0) {
    const existing = db.programs[existingIndex];
    const updated: StoredProgram = {
      ...existing,
      ...program,
      // CRITICAL: NEVER overwrite title with default if title was not explicitly updated
      title: program.title !== undefined ? program.title : existing.title,
      updated_at: now,
    };
    db.programs[existingIndex] = updated;
    await saveDB(db);
    return updated;
  } else {
    const newProgram: StoredProgram = {
      id,
      owner_id: program.owner_id || "default-user",
      title: program.title || "program.c",
      description: program.description || "",
      source_code: program.source_code || '#include <stdio.h>\n\nint main() {\n    printf("Hello from CodeSphere!\\n");\n    return 0;\n}',
      language: "c",
      category: program.category || "DSA",
      tags: program.tags || [],
      folder_id: program.folder_id || null,
      is_favorite: program.is_favorite || false,
      visibility: program.visibility || "private",
      created_at: now,
      updated_at: now,
    };
    db.programs.unshift(newProgram);
    await saveDB(db);
    return newProgram;
  }
}

export async function deleteLocalProgram(id: string): Promise<boolean> {
  const db = await ensureDB();
  const initialLen = db.programs.length;
  db.programs = db.programs.filter((p) => p.id !== id);
  if (db.programs.length !== initialLen) {
    await saveDB(db);
    return true;
  }
  return false;
}

export async function getLocalFolders(userId?: string): Promise<StoredFolder[]> {
  const db = await ensureDB();
  if (userId) {
    return db.folders.filter((f) => f.owner_id === userId || f.owner_id === "default-user");
  }
  return db.folders;
}

export async function saveLocalFolder(
  name: string,
  userId = "default-user",
  parent_id: string | null = null
): Promise<StoredFolder> {
  const db = await ensureDB();
  const newFolder: StoredFolder = {
    id: randomUUID(),
    owner_id: userId,
    name,
    parent_id: parent_id || null,
    created_at: new Date().toISOString(),
  };
  db.folders.push(newFolder);
  await saveDB(db);
  return newFolder;
}

export async function updateLocalFolder(
  id: string,
  updates: { name?: string; parent_id?: string | null }
): Promise<StoredFolder | null> {
  const db = await ensureDB();
  const idx = db.folders.findIndex((f) => f.id === id);
  if (idx < 0) return null;

  const updated: StoredFolder = {
    ...db.folders[idx],
    ...(updates.name !== undefined && { name: updates.name }),
    ...(updates.parent_id !== undefined && { parent_id: updates.parent_id }),
  };
  db.folders[idx] = updated;
  await saveDB(db);
  return updated;
}

export async function deleteLocalFolder(id: string): Promise<boolean> {
  const db = await ensureDB();
  const initialLen = db.folders.length;

  // Find all child folder IDs recursively
  const toDelete = new Set<string>([id]);
  let added = true;
  while (added) {
    added = false;
    for (const f of db.folders) {
      if (f.parent_id && toDelete.has(f.parent_id) && !toDelete.has(f.id)) {
        toDelete.add(f.id);
        added = true;
      }
    }
  }

  // Move all programs in these folders back to root (folder_id = null)
  db.programs = db.programs.map((p) => {
    if (p.folder_id && toDelete.has(p.folder_id)) {
      return { ...p, folder_id: null, updated_at: new Date().toISOString() };
    }
    return p;
  });

  // Remove deleted folders
  db.folders = db.folders.filter((f) => !toDelete.has(f.id));

  if (db.folders.length !== initialLen) {
    await saveDB(db);
    return true;
  }
  return false;
}
