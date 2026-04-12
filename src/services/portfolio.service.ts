import db from '../config/database';
import { PortfolioSimulationRequest, PortfolioSimulationResponse } from '../types/api.types';
import { formatTimeRemaining } from '../utils/formatting';

const marketsRef = db.collection('markets');

export class PortfolioService {
  async simulatePortfolio(request: PortfolioSimulationRequest): Promise<PortfolioSimulationResponse> {
    const { positions, cash_balance, include_pnl, include_expected_value } = request;

    // Batch fetch markets by doc ID
    const marketDocs = await Promise.all(
      positions.map(pos => marketsRef.doc(pos.market_id).get())
    );
    const marketMap = new Map<string, any>();
    marketDocs.forEach((doc: any) => {
      if (doc.exists) marketMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    const processedPositions = positions.map(position => {
      const market = marketMap.get(position.market_id);
      if (!market) return null;

      const currentProbability = market.probability_yes || 0;
      const currentValue = include_pnl
        ? this.calculateCurrentValue(position, currentProbability)
        : position.stake;
      const pnl = currentValue - position.stake;
      const closesAt = market.closes_at?.toDate?.() ?? (market.closes_at ? new Date(market.closes_at) : null);

      return {
        market_title: market.title,
        side: position.side,
        entry_probability: position.entry_probability,
        current_probability: currentProbability,
        stake: position.stake,
        current_value: currentValue,
        unrealised_pnl: pnl,
        pnl_pct: (pnl / position.stake) * 100,
        expected_value: include_expected_value ? this.calculateExpectedValue(position, currentProbability) : null,
        market_status: market.status,
        closes_in: closesAt ? formatTimeRemaining(closesAt) : 'No date'
      };
    }).filter(Boolean) as any[];

    const totalStaked = processedPositions.reduce((s, p) => s + p.stake, 0);
    const totalValue  = processedPositions.reduce((s, p) => s + p.current_value, 0) + cash_balance;
    const totalPnl    = processedPositions.reduce((s, p) => s + p.unrealised_pnl, 0);

    return {
      portfolio_summary: {
        total_staked: totalStaked,
        cash_balance,
        total_portfolio_value: totalValue,
        current_unrealised_pnl: totalPnl,
        unrealised_pnl_pct: totalStaked > 0 ? (totalPnl / totalStaked) * 100 : 0
      },
      positions: processedPositions
    };
  }

  private calculateCurrentValue(position: any, currentProbability: number): number {
    if (position.side === 'yes') {
      return position.stake * (currentProbability / position.entry_probability);
    }
    return position.stake * ((1 - currentProbability) / (1 - position.entry_probability));
  }

  private calculateExpectedValue(position: any, currentProbability: number): any {
    const { stake, side, entry_probability } = position;
    const ifYes = side === 'yes' ? (stake / entry_probability) - stake : -stake;
    const ifNo  = side === 'yes' ? -stake : (stake / (1 - entry_probability)) - stake;
    const ev = currentProbability * ifYes + (1 - currentProbability) * ifNo;
    return { if_yes: ifYes, if_no: ifNo, ev_at_current_price: ev, interpretation: this.getEVInterpretation(ev, side, currentProbability) };
  }

  private getEVInterpretation(ev: number, side: string, prob: number): string {
    const pct = Math.round(prob * 100);
    if (ev > 0) return `At ${pct}% probability, the ${side.toUpperCase()} position has positive expected value`;
    if (ev < 0) return `At ${pct}% probability, the ${side.toUpperCase()} position has negative expected value`;
    return `The ${side.toUpperCase()} position has neutral expected value`;
  }
}

export default new PortfolioService();
