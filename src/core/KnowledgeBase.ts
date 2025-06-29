// Knowledge base for storing and retrieving domain knowledge
export interface Knowledge {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  confidence: number;
  source: string;
  timestamp: Date;
  relatedIds: string[];
}

export interface HistoryAnalysis {
  topCategories: Array<{category: string, count: number}>;
  topTags: Array<{tag: string, count: number}>;
  knowledgeGrowth: Array<{date: string, count: number}>;
  averageConfidence: number;
}

export class KnowledgeBase {
  private knowledge: Map<string, Knowledge> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  
  constructor() {}
  
  addKnowledge(
    category: string,
    title: string,
    content: string,
    options?: {
      tags?: string[];
      confidence?: number;
      source?: string;
      relatedIds?: string[];
    }
  ): string {
    const id = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const knowledge: Knowledge = {
      id,
      category,
      title,
      content,
      tags: options?.tags || [],
      confidence: options?.confidence || 0.5,
      source: options?.source || 'system',
      timestamp: new Date(),
      relatedIds: options?.relatedIds || []
    };
    
    this.knowledge.set(id, knowledge);
    
    // Update indexes
    knowledge.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(id);
    });
    
    if (!this.categoryIndex.has(category)) {
      this.categoryIndex.set(category, new Set());
    }
    this.categoryIndex.get(category)!.add(id);
    
    return id;
  }
  
  getRelatedKnowledge(query: string, limit: number = 5): Knowledge[] {
    const results: Array<{knowledge: Knowledge, score: number}> = [];
    
    // Search by content, title, and tags
    this.knowledge.forEach((knowledge) => {
      let score = 0;
      const queryLower = query.toLowerCase();
      
      if (knowledge.title.toLowerCase().includes(queryLower)) {
        score += 3;
      }
      if (knowledge.content.toLowerCase().includes(queryLower)) {
        score += 2;
      }
      knowledge.tags.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 1;
        }
      });
      
      if (score > 0) {
        results.push({ knowledge, score });
      }
    });
    
    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.knowledge);
  }
  
  analyzeHistory(): HistoryAnalysis {
    const categoryCount = new Map<string, number>();
    const tagCount = new Map<string, number>();
    const dateCount = new Map<string, number>();
    let totalConfidence = 0;
    
    this.knowledge.forEach((knowledge) => {
      // Count categories
      categoryCount.set(knowledge.category, (categoryCount.get(knowledge.category) || 0) + 1);
      
      // Count tags
      knowledge.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
      
      // Count by date
      const dateKey = knowledge.timestamp.toISOString().split('T')[0];
      dateCount.set(dateKey, (dateCount.get(dateKey) || 0) + 1);
      
      // Sum confidence
      totalConfidence += knowledge.confidence;
    });
    
    return {
      topCategories: Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topTags: Array.from(tagCount.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      knowledgeGrowth: Array.from(dateCount.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      averageConfidence: this.knowledge.size > 0 ? totalConfidence / this.knowledge.size : 0
    };
  }
}