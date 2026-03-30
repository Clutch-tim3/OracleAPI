import prisma from '../config/database';
import { PortfolioSimulationRequest, PortfolioSimulationResponse } from '../types/api.types';
import { formatTimeRemaining } from '../utils/formatting';

export class PortfolioService {
  async simulatePortfolio(request: PortfolioSimulationRequest): Promise<PortfolioSimulationResponse> {
    const { positions, cash_balance, include_pnl, include_expected_value } = request;

    const marketIds = positions.map(pos => pos.market_id);
    const markets = await prisma.market.findMany({
      where: { id: { in: marketIds } }
    });

    const marketMap = new Map(markets.map(market => [market.id, market]));

    const processedPositions = positions.map(position => {
      const market = marketMap.get(position.market_id);
      if (!market) {
        return null;
      }

      const currentProbability = market.probability_yes || 0;
      const entryProbability = position.entry_probability;
      
      let currentValue = position.stake;
      if (include_pnl) {
        currentValue = this.calculateCurrentValue(position, currentProbability);
      }

      const pnl = currentValue - position.stake;
      const pnlPct = (pnl / position.stake) * 100;

      const expectedValue = include_expected_value ? this.calculateExpectedValue(position, currentProbability) : null;

      return {
        market_title: market.title,
        side: position.side,
        entry_probability: entryProbability,
        current_probability: currentProbability,
        stake: position.stake,
        current_value: currentValue,
        unrealised_pnl: pnl,
        pnl_pct: pnlPct,
        expected_value: expectedValue,
        market_status: market.status,
        closes_in: formatTimeRemaining(market.closes_at!)
      };
    }).filter(Boolean);

    const totalStaked = processedPositions.reduce((sum, pos: any) => sum + pos.stake, 0);
    const totalValue = processedPositions.reduce((sum, pos: any) => sum + pos.current_value, 0) + cash_balance;
    const totalPnl = processedPositions.reduce((sum, pos: any) => sum + pos.unrealised_pnl, 0);
    const totalPnlPct = totalStaked > 0 ? (totalPnl / totalStaked) * 100 : 0;

    return {
      portfolio_summary: {
        total_staked: totalStaked,
        cash_balance: cash_balance,
        total_portfolio_value: totalValue,
        current_unrealised_pnl: totalPnl,
        unrealised_pnl_pct: totalPnlPct
      },
      positions: processedPositions
    };
  }

  private calculateCurrentValue(position: any, currentProbability: number): number {
    const entryProbability = position.entry_probability;
    const stake = position.stake;
    const side = position.side;

    if (side === 'yes') {
      return stake * (currentProbability / entryProbability);
    } else {
      const entryNoProb = 1 - entryProbability;
      const currentNoProb = 1 - currentProbability;
      return stake * (currentNoProb / entryNoProb);
    }
  }

  private calculateExpectedValue(position: any, currentProbability: number): any {
    const stake = position.stake;
    const side = position.side;
    const entryProbability = position.entry_probability;

    let ifYes: number;
    let ifNo: number;

    if (side === 'yes') {
      ifYes = (stake / entryProbability) - stake;
      ifNo = -stake;
    } else {
      ifYes = -stake;
      const entryNoProb = 1 - entryProbability;
      ifNo = (stake / entryNoProb) - stake;
    }

    const ev = (currentProbability * ifYes) + ((1 - currentProbability) * ifNo);
    
    return {
      if_yes: ifYes,
      if_no: ifNo,
      ev_at_current_price: ev,
      interpretation: this.getEVInterpretation(ev, side, currentProbability)
    };
  }

  private getEVInterpretation(ev: number, side: string, currentProbability: number): string {
    if (ev > 0) {
      return `At ${Math.round(currentProbability * 100)}% probability, the ${side.toUpperCase()} position has positive expected value`;
    } else if (ev < 0) {
      return `At ${Math.round(currentProbability * 100)}% probability, the ${side.toUpperCase()} position has negative expected value`;
    } else {
      return `The ${side.toUpperCase()} position has neutral expected value`;
    }
  }
}

export default new PortfolioService();