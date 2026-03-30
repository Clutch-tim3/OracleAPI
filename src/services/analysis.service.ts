import { Anthropic } from '@anthropic-ai/sdk';
import { AnalysisRequest, AnalysisResponse } from '../types/api.types';
import { generateAnalysisHash } from '../utils/hashUtils';
import prisma from '../config/database';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const ANALYSIS_CACHE_TTL = 2 * 60 * 60; // 2 hours

export class AnalysisService {
  async analyzeMarket(marketId: string, request: AnalysisRequest): Promise<AnalysisResponse> {
    const cacheKey = generateAnalysisHash(
      marketId, 
      request.analysis_depth, 
      request.perspective, 
      request.audience
    );

    // Check cache first
    const cachedAnalysis = await prisma.marketAnalysis.findUnique({
      where: { input_hash: cacheKey }
    });

    if (cachedAnalysis) {
      return {
        market_id: marketId,
        analysis: cachedAnalysis.result
      };
    }

    // If not in cache, generate new analysis
    const market = await prisma.market.findUnique({
      where: { id: marketId }
    });

    if (!market) {
      throw new Error('Market not found');
    }

    const prompt = this.buildAnalysisPrompt(market, request);
    const analysis = await this.generateAnalysis(prompt);

    // Save to cache
    await prisma.marketAnalysis.create({
      data: {
        market_id: marketId,
        analysis_type: request.analysis_depth,
        input_hash: cacheKey,
        result: analysis,
        model_used: 'claude-sonnet-4-20250514'
      }
    });

    return {
      market_id: marketId,
      analysis
    };
  }

  private buildAnalysisPrompt(market: any, request: AnalysisRequest): string {
    const {
      analysis_depth,
      perspective,
      audience,
      include_historical_context,
      include_price_drivers,
      include_scenarios
    } = request;

    const depthMap = {
      'quick': '150-word summary',
      'standard': '400-word analysis',
      'deep': '800-word detailed analysis'
    };

    const perspectiveMap = {
      'neutral': 'balanced and neutral',
      'bull': 'focus on reasons the YES outcome is likely',
      'bear': 'focus on reasons the NO outcome is likely'
    };

    const audienceMap = {
      'general': 'smart non-specialist audience',
      'trader': 'professional prediction market traders',
      'journalist': 'journalists and media professionals',
      'researcher': 'academic researchers and analysts'
    };

    return `You are a sophisticated prediction market analyst with expertise in calibration, base rates, and the wisdom of crowds. You are analyzing market: "${market.title}"

    Analysis Depth: ${depthMap[analysis_depth]}
    Perspective: ${perspectiveMap[perspective]}
    Audience: ${audienceMap[audience]}

    Current Probability: ${Math.round((market.probability_yes || 0) * 100)}% YES
    Volume: $${market.total_volume?.toLocaleString() || '0'}
    Platform: ${market.source_platform}
    Category: ${market.category}
    Closes At: ${market.closes_at?.toISOString()}

    ${include_historical_context ? 'Include historical context: Compare to similar past events and base rates.' : ''}
    ${include_price_drivers ? 'Include price drivers: Explain what has driven probability movement.' : ''}
    ${include_scenarios ? 'Include scenarios: Describe what would need to happen for YES and NO outcomes.' : ''}

    Critical Instructions:
    - NEVER give trading or investment advice
    - ALWAYS frame probabilities as "the market believes" not absolute predictions
    - ALWAYS include base rate reference when available
    - Analyze the MOVEMENT as much as the current price
    - Be specific about what news/data drove price moves
    - Explain the market to the target audience
    - Include calibration note: how accurate are markets in this category?

    Response format should include:
    - headline: Concise, attention-grabbing headline
    - executive_summary: Brief summary
    - why_this_probability: Explanation of current price
    - what_would_move_it: What news/data would change the probability
    - historical_context: Base rate analysis
    - scenarios: YES and NO scenarios
    - calibration_note: Category accuracy information

    Return JSON format only.`;
  }

  private async generateAnalysis(prompt: string): Promise<any> {
    try {
      const response = await anthropic.completions.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens_to_sample: 3000,
        temperature: 0.1,
        prompt: `Human: ${prompt}\n\nAssistant:`,
      });

      const content = response.completion.trim();
      return JSON.parse(content);
    } catch (error) {
      console.error('AI analysis error:', error);
      return this.generateFallbackAnalysis();
    }
  }

  private generateFallbackAnalysis(): any {
    return {
      headline: 'Market Analysis Unavailable',
      executive_summary: 'Market analysis is currently unavailable. Please try again later.',
      why_this_probability: 'The market price reflects the collective wisdom of traders based on available information.',
      what_would_move_it: {
        higher: ['Positive news related to the market question', 'Strong economic data supporting the YES outcome'],
        lower: ['Negative news related to the market question', 'Weak economic data supporting the NO outcome']
      },
      historical_context: 'Historical context is currently unavailable.',
      scenarios: {
        YES_scenario: 'Conditions align with the YES outcome.',
        NO_scenario: 'Conditions align with the NO outcome.'
      },
      calibration_note: 'Market accuracy data is currently unavailable.'
    };
  }
}

export default new AnalysisService();