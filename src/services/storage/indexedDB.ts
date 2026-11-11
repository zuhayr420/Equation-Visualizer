import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Project, HistoryItem } from '../../types';

interface MathVisionDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-updated': number };
  };
  history: {
    key: string;
    value: HistoryItem;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'mathvision_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MathVisionDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MathVisionDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const db = await getDB();
    const projects = await db.getAllFromIndex('projects', 'by-updated');
    return projects.reverse();
  } catch (error) {
    console.error('Failed to load projects from IndexedDB:', error);
    return [];
  }
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  try {
    const db = await getDB();
    return await db.get('projects', id);
  } catch (error) {
    console.error(`Failed to get project ${id}:`, error);
    return undefined;
  }
}

export async function saveProject(project: Project): Promise<void> {
  try {
    const db = await getDB();
    await db.put('projects', { ...project, updatedAt: Date.now() });
  } catch (error) {
    console.error('Failed to save project:', error);
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('projects', id);
  } catch (error) {
    console.error(`Failed to delete project ${id}:`, error);
  }
}

export async function getAllHistory(): Promise<HistoryItem[]> {
  try {
    const db = await getDB();
    const history = await db.getAllFromIndex('history', 'by-timestamp');
    return history.reverse();
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

export async function addHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem> {
  const fullItem: HistoryItem = {
    ...item,
    id: `calc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };
  try {
    const db = await getDB();
    await db.put('history', fullItem);
  } catch (error) {
    console.error('Failed to add history item:', error);
  }
  return fullItem;
}

export async function clearAllHistory(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('history');
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('history', id);
  } catch (error) {
    console.error(`Failed to delete history item ${id}:`, error);
  }
}
