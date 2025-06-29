// Stub implementation for MemoryIndex
export interface QueryResult {
  key: string;
  score: number;
}

export interface IndexNode {
  term: string;
  documents: string[];
}

export class MemoryIndex {
  constructor() {}
  
  addDocument(key: string, content: string): void {
    // Stub
  }
  
  search(query: string): QueryResult[] {
    return [];
  }
}