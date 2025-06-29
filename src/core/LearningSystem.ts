// Machine learning-inspired system for continuous improvement
export interface Learning {
  context: string;
  outcome: 'success' | 'failure';
  factors: Record<string, any>;
  timestamp: Date;
}

export interface Prediction {
  recommendation: string;
  confidence: number;
  basedOn: number; // number of similar cases
}

export interface Insight {
  pattern: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export class LearningSystem {
  private learnings: Learning[] = [];
  private patterns: Map<string, Insight> = new Map();
  
  constructor() {}
  
  recordLearning(
    context: string,
    outcome: 'success' | 'failure',
    factors?: Record<string, any>
  ): void {
    this.learnings.push({
      context,
      outcome,
      factors: factors || {},
      timestamp: new Date()
    });
    
    // Update patterns
    this.updatePatterns();
  }
  
  predict(context: string, factors?: Record<string, any>): Prediction {
    // Find similar past learnings
    const similar = this.learnings.filter(l => 
      l.context.toLowerCase().includes(context.toLowerCase())
    );
    
    if (similar.length === 0) {
      return {
        recommendation: 'No historical data available',
        confidence: 0,
        basedOn: 0
      };
    }
    
    const successRate = similar.filter(l => l.outcome === 'success').length / similar.length;
    
    return {
      recommendation: successRate > 0.7 ? 'Likely to succeed' : 'May face challenges',
      confidence: Math.min(similar.length / 10, 1), // Confidence increases with more data
      basedOn: similar.length
    };
  }
  
  getInsights(): Insight[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  private updatePatterns(): void {
    // Simple pattern detection based on context keywords
    this.learnings.forEach(learning => {
      const words = learning.context.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) { // Ignore short words
          const existing = this.patterns.get(word) || {
            pattern: word,
            frequency: 0,
            impact: 'neutral'
          };
          
          existing.frequency++;
          
          // Determine impact based on outcomes
          const relatedLearnings = this.learnings.filter(l => 
            l.context.toLowerCase().includes(word)
          );
          const successRate = relatedLearnings.filter(l => l.outcome === 'success').length / relatedLearnings.length;
          
          if (successRate > 0.7) existing.impact = 'positive';
          else if (successRate < 0.3) existing.impact = 'negative';
          else existing.impact = 'neutral';
          
          this.patterns.set(word, existing);
        }
      });
    });
  }
}