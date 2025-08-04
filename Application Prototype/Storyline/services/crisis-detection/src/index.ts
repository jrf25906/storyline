export interface CrisisAnalysisResult {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical' | 'imminent';
  confidence: number;
  detected: boolean;
  requiresImmediate: boolean;
  category: string[];
  resources: CrisisResource[];
  protocol?: EmergencyProtocol;
  contextFactors?: string[];
  supportLevel?: string;
}

export interface CrisisResource {
  type: 'hotline' | 'text' | 'online' | 'app';
  name: string;
  number?: string;
  url?: string;
  availability: string;
  location?: string;
}

export interface EmergencyProtocol {
  actions: string[];
  priority: 'standard' | 'high' | 'highest';
  notifications: string[];
}

export class CrisisDetectionService {
  private criticalPhrases = [
    'want to end my life',
    'kill myself',
    'suicide',
    'nobody would care if I died',
    'overdose',
    'suicide note',
    'end it all',
    'not worth living',
    'better off dead'
  ];

  private imminentIndicators = [
    'tonight',
    'have a plan',
    'pills ready',
    'goodbye',
    'this is it',
    'going to do it'
  ];

  async analyze(content: string): Promise<CrisisAnalysisResult> {
    const lowerContent = content.toLowerCase();
    let riskLevel: CrisisAnalysisResult['riskLevel'] = 'low';
    let confidence = 0.9;
    const categories: string[] = [];

    // Check for critical phrases
    const hasCriticalPhrase = this.criticalPhrases.some(phrase => 
      lowerContent.includes(phrase)
    );

    const hasImminentIndicator = this.imminentIndicators.some(indicator =>
      lowerContent.includes(indicator)
    );

    if (hasCriticalPhrase && hasImminentIndicator) {
      riskLevel = 'imminent';
      categories.push('suicide-risk', 'immediate-danger');
    } else if (hasCriticalPhrase) {
      riskLevel = 'critical';
      categories.push('suicide-risk');
    } else if (lowerContent.includes('hurt myself') || lowerContent.includes('self harm')) {
      riskLevel = 'high';
      categories.push('self-harm');
    } else if (lowerContent.includes('hopeless') || lowerContent.includes('worthless')) {
      riskLevel = 'moderate';
      categories.push('depression');
    }

    const resources = await this.getResources(riskLevel);

    return {
      riskLevel,
      confidence,
      detected: riskLevel !== 'low',
      requiresImmediate: ['critical', 'imminent'].includes(riskLevel),
      category: categories,
      resources,
      supportLevel: riskLevel === 'high' ? 'high' : undefined
    };
  }

  async getResources(riskLevel: string, options?: { location?: string }): Promise<CrisisResource[]> {
    const resources: CrisisResource[] = [];

    if (['critical', 'imminent', 'high'].includes(riskLevel)) {
      resources.push({
        type: 'hotline',
        name: 'Suicide & Crisis Lifeline',
        number: '988',
        availability: '24/7',
        location: options?.location || 'US'
      });
    }

    // Add location-specific resources
    if (options?.location) {
      const locationResources = this.getLocationSpecificResources(options.location);
      resources.push(...locationResources);
    }

    return resources;
  }

  private getLocationSpecificResources(location: string): CrisisResource[] {
    const resourceMap: Record<string, CrisisResource[]> = {
      'UK': [{
        type: 'hotline',
        name: 'Samaritans',
        number: '116 123',
        availability: '24/7',
        location: 'UK'
      }],
      'CA': [{
        type: 'hotline',
        name: 'Talk Suicide Canada',
        number: '1-833-456-4566',
        availability: '24/7',
        location: 'CA'
      }],
      'AU': [{
        type: 'hotline',
        name: 'Lifeline',
        number: '13 11 14',
        availability: '24/7',
        location: 'AU'
      }]
    };

    return resourceMap[location] || [];
  }

  async analyzeWithContext(
    content: string, 
    history: any[], 
    context?: any
  ): Promise<CrisisAnalysisResult> {
    const baseResult = await this.analyze(content);
    
    // Check for escalating pattern
    if (history.length > 0) {
      const recentMessages = history.slice(-5);
      const negativeSentiment = recentMessages.filter(msg => 
        msg.content.toLowerCase().includes('down') ||
        msg.content.toLowerCase().includes('sad') ||
        msg.content.toLowerCase().includes('hopeless')
      ).length;

      if (negativeSentiment >= 3) {
        baseResult.contextFactors = ['escalating-pattern'];
        if (baseResult.riskLevel === 'moderate') {
          baseResult.riskLevel = 'high';
        }
      }
    }

    // Check for fictional content
    if (context?.projectType === 'fiction') {
      baseResult.contextFactors = ['fictional-content'];
      if (!content.toLowerCase().includes('i ')) {
        baseResult.riskLevel = 'low';
      }
    }

    return baseResult;
  }
}

export class EmergencyResponseService {
  async generateResponse(context: { content: string; riskLevel: string }): Promise<string> {
    const responses: Record<string, string> = {
      high: "I hear that you're going through something really difficult right now. I'm here to listen without judgment. Your feelings are valid, and there is support available when you're ready.",
      moderate: "Thank you for sharing this with me. It sounds like you're dealing with some tough feelings. I'm here to support you in whatever way feels comfortable for you.",
      low: "I appreciate you opening up. How can I best support you with your writing today?"
    };

    return responses[context.riskLevel] || responses.moderate;
  }
}
