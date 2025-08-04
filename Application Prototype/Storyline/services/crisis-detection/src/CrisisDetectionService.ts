export interface CrisisAnalysis {
  isCrisis: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  suggestedResponse?: string;
}

export interface CrisisDetectionResult {
  hasCriticalContent: boolean;
  detectedPhrases: string[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  requiresImmediateAction: boolean;
}

export class CrisisDetectionService {
  private criticalPhrases = [
    'end it all',
    'ending everything',
    'can\'t go on',
    'no point in living',
    'ending my life',
    'hurt myself',
    'hurting myself',
    'wish i wasn\'t here',
    'better off without me',
    'don\'t want to wake up',
    'don\'t want to wake up tomorrow',
    'suicide',
    'kill myself',
    'self harm',
    'cutting',
    'want to die',
    'better off dead'
  ];

  async analyzeInput(input: string): Promise<CrisisAnalysis> {
    const lowerInput = input.toLowerCase();
    const isCrisis = this.criticalPhrases.some(phrase => 
      lowerInput.includes(phrase)
    );

    return {
      isCrisis,
      severity: isCrisis ? 'critical' : 'none',
      suggestedResponse: isCrisis ? 'I hear you and I\'m concerned about you. You don\'t have to go through this alone.' : undefined
    };
  }

  async detectCrisis(text: string): Promise<CrisisDetectionResult> {
    const lowerText = text.toLowerCase();
    const detectedPhrases: string[] = [];
    
    for (const phrase of this.criticalPhrases) {
      if (lowerText.includes(phrase)) {
        detectedPhrases.push(phrase);
      }
    }

    const hasCriticalContent = detectedPhrases.length > 0;
    const severity = this.determineSeverity(detectedPhrases);
    
    return {
      hasCriticalContent,
      detectedPhrases,
      severity,
      requiresImmediateAction: severity === 'critical' || severity === 'high'
    };
  }

  private determineSeverity(detectedPhrases: string[]): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (detectedPhrases.length === 0) return 'none';
    
    const criticalKeywords = ['suicide', 'kill myself', 'end it all', 'ending my life'];
    const hasCriticalKeyword = detectedPhrases.some(phrase => 
      criticalKeywords.some(keyword => phrase.includes(keyword))
    );
    
    if (hasCriticalKeyword) return 'critical';
    if (detectedPhrases.length >= 2) return 'high';
    return 'medium';
  }

  async getSupportResources(location: string = 'US'): Promise<string> {
    const resources: Record<string, string> = {
      'US': '988 Suicide & Crisis Lifeline - Call or text 988',
      'UK': 'Samaritans - Call 116 123',
      'CA': 'Talk Suicide Canada - Call 1-833-456-4566',
      'AU': 'Lifeline - Call 13 11 14'
    };

    return resources[location] || resources['US'];
  }
}