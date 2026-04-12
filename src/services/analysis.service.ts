import { Anthropic } from '@anthropic-ai/sdk';
import { AnalysisRequest, AnalysisResponse } from '../types/api.types';
import { generateAnalysisHash } from '../utils/hashUtils';
import db from '../config/database';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const analysesRef = db.collection('marketAnalyses');
const marketsRef  = db.collection('markets');

export class AnalysisService {
  async analyzeMarket(marketId: string, request: AnalysisRequest): Promise<AnalysisResponse> {
    const cacheKey = generateAnalysisHash(
      marketId,
      request.analysis_depth,
      request.perspective,
      request.audience
    );

    // Check Firestore cache
    const cachedDoc = await analysesRef.doc(cacheKey).get();
    if (cachedDoc.exists) {
      return { market_id: marketId, analysis: cachedDoc.data()!.result };
    }

    // Fetch market
    const marketDoc = await marketsRef.doc(marketId).get();
    if (!marketDoc.exists) throw new Error('Market not found');
    const market = marketDoc.data();

    const prompt = this.buildAnalysisPrompt(market, request);
    const analysis = await this.generateAnalysis(prompt);

    // Store in Firestore (use input_hash as doc ID for fast lookup)
    await analysesRef.doc(cacheKey).set({
      market_id: marketId,
      analysis_type: request.analysis_depth,
      input_hash: cacheKey,
      result: analysis,
      model_used: 'claude-sonnet-4-6',
      createdAt: new Date(),
    });

    return { market_id: marketId, analysis };
  }

  private buildAnalysisPrompt(market: any, request: AnalysisRequest): string {
    const { analysis_depth, perspective, audience, include_historical_context, include_price_drivers, include_scenarios } = request;

    const depthMap: any = { quick: '150-word summary', standard: '400-word analysis', deep: '800-word detailed analysis' };
    const perspectiveMap: any = { neutral: 'balanced and neutral', bull: 'focus on reasons the YES outcome is likely', bear: 'focus on reasons the NO outcome is likely' };
    const audienceMap: any = { general: 'smart non-specialist audience', trader: 'professional prediction market traders', journalist: 'journalists and media professionals', researcher: 'academic researchers and analysts' };

    return `You are a sophisticated prediction market analyst. Analyze: "${market.title}"

Analysis Depth: ${depthMap[analysis_depth]}
Perspective: ${perspectiveMap[perspective]}
Audience: ${audienceMap[audience]}
Current Probability: ${Math.round((market.probability_yes || 0) * 100)}% YES
Volume: $${market.total_volume?.toLocaleString() || '0'}
Platform: ${market.source_platform}
Category: ${market.category}

${include_historical_context ? 'Include historical context: Compare to similar past events.' : ''}
${include_price_drivers ? 'Include price drivers: Explain what has driven probability movement.' : ''}
${include_scenarios ? 'Include scenarios: YES and NO outcome scenarios.' : ''}

Return JSON with: headline, executive_summary, why_this_probability, what_would_move_it, historical_context, scenarios, calibration_note.`;
  }

  private async generateAnalysis(prompt: string): Promise<any> {
    try {
      const response = await anthropic.completions.create({
        model: 'claude-sonnet-4-6',
        max_tokens_to_sample: 3000,
        temperature: 0.1,
        prompt: `Human: ${prompt}\n\nAssistant:`,
      });
      return JSON.parse(response.completion.trim());
    } catch {
      return this.generateFallbackAnalysis();
    }
  }

  private generateFallbackAnalysis(): any {
    return {
      headline: 'Market Analysis Unavailable',
      executive_summary: 'Please try again later.',
      why_this_probability: 'The market price reflects collective trader wisdom.',
      what_would_move_it: { higher: ['Positive related news'], lower: ['Negative related news'] },
      historical_context: 'Unavailable.',
      scenarios: { YES_scenario: 'Conditions align with YES.', NO_scenario: 'Conditions align with NO.' },
      calibration_note: 'Accuracy data unavailable.'
    };
  }
}

export default new AnalysisService();
