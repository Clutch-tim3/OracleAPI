/**
 * Calculate Brier score for prediction markets
 * Brier = (1/n) × Σ(probability_at_close - outcome)²
 * where outcome = 1 for YES, 0 for NO
 */
export function calculateBrierScore(probability: number, outcome: number): number {
  if (probability < 0 || probability > 1) {
    throw new Error('Probability must be between 0 and 1');
  }
  if (outcome !== 0 && outcome !== 1) {
    throw new Error('Outcome must be 0 (NO) or 1 (YES)');
  }

  return Math.pow(probability - outcome, 2);
}

/**
 * Calculate average Brier score for a list of predictions
 */
export function calculateAverageBrierScore(predictions: Array<{ probability: number; outcome: number }>): number {
  if (predictions.length === 0) return 0;

  const totalScore = predictions.reduce((sum, prediction) => {
    return sum + calculateBrierScore(prediction.probability, prediction.outcome);
  }, 0);

  return totalScore / predictions.length;
}

/**
 * Calculate accuracy percentage
 * @param markets Array of markets with final probability and outcome
 * @returns Percentage of markets where >50% probability was correct
 */
export function calculateAccuracyPercentage(markets: Array<{ probability_yes: number; resolution: string }>): number {
  const resolvedMarkets = markets.filter(market => market.resolution !== null && market.resolution !== undefined);
  
  if (resolvedMarkets.length === 0) return 0;

  const correctCalls = resolvedMarkets.filter(market => {
    const isYes = market.resolution.toLowerCase() === 'yes';
    const threshold = 0.5;
    
    return (isYes && market.probability_yes > threshold) || (!isYes && market.probability_yes <= threshold);
  });

  return (correctCalls.length / resolvedMarkets.length) * 100;
}

/**
 * Calculate calibration data
 * Groups predictions into probability buckets and calculates actual outcomes
 */
export function calculateCalibrationData(predictions: Array<{ probability: number; outcome: number }>, bucketSize: number = 0.1): any[] {
  const buckets: Record<number, Array<number>> = {};
  
  for (let i = 0; i < 1; i += bucketSize) {
    buckets[Math.round(i * 10) / 10] = [];
  }

  predictions.forEach(prediction => {
    const bucket = Math.floor(prediction.probability / bucketSize) * bucketSize;
    const normalizedBucket = Math.round(bucket * 10) / 10;
    
    if (buckets[normalizedBucket]) {
      buckets[normalizedBucket].push(prediction.outcome);
    }
  });

  return Object.entries(buckets).map(([bucket, outcomes]) => {
    if (outcomes.length === 0) return null;
    
    const actualFrequency = outcomes.reduce((sum, outcome) => sum + outcome, 0) / outcomes.length;
    
    return {
      prob_bucket: parseFloat(bucket),
      bucket_label: `${Math.round(parseFloat(bucket) * 100)}-${Math.round((parseFloat(bucket) + bucketSize) * 100)}%`,
      actual_freq: parseFloat(actualFrequency.toFixed(2)),
      sample_size: outcomes.length
    };
  }).filter(Boolean);
}

/**
 * Calculate probability change percentage
 */
export function calculateProbabilityChange(prev: number, curr: number): number {
  if (prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}

/**
 * Format probability as percentage string
 */
export function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

/**
 * Determine velocity of probability change
 */
export function getChangeVelocity(changePercentage: number): 'slow' | 'moderate' | 'fast' | 'explosive' {
  const absChange = Math.abs(changePercentage);
  
  if (absChange < 2) return 'slow';
  if (absChange < 5) return 'moderate';
  if (absChange < 10) return 'fast';
  return 'explosive';
}

/**
 * Determine direction of probability change
 */
export function getChangeDirection(changePercentage: number): 'rising' | 'falling' | 'stable' {
  if (changePercentage > 0.1) return 'rising';
  if (changePercentage < -0.1) return 'falling';
  return 'stable';
}