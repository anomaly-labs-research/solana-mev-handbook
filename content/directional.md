# Directional Trading, In Depth

_As of Sep 2026._

Everything else in this folder gets paid for doing a job the market needs done: closing a price gap, absorbing a liquidation, quoting a spread, holding the unpopular side of a perp. Directional trading gets paid for nothing except being right about where price goes next. That makes it the purest bet in the map, and the one where the house edge is against you by default.

## The core idea

You buy (or short) an asset because you expect its price to be higher (or lower) in a few hours to a few weeks. There is no atomic round trip, no protocol-defined bonus, no spread to capture. You hold **inventory**, and the P&L is simply exit price minus entry price minus costs.

The uncomfortable corollary: there is **no structural edge**. Arbitrage profits exist because someone else's swap moved a pool; liquidation bonuses exist because a protocol needs the work done. A directional trade has no counterparty who is structurally obliged to lose. Whatever you make, someone on the other side made the opposite bet with the same information and the same venues. Your edge, if you have one, must come from exactly three places:

- **Information:** you know something the marginal price setter does not (an unlock calendar, a flow imbalance, a listing before it is public).
- **Models:** you have found a statistical regularity in returns that persists after costs, and that not everyone is already trading.
- **Risk management:** you are no better at predicting direction, but you size, cut and let run better than the crowd, so the same 50/50 signal has positive expectancy in your hands.

Most retail activity here is discretionary and loses. The systematic families below are the ones with a research record worth reading.

## Family 1: time-series momentum (trend following)

**Time-series momentum (TSMOM)** looks only at an asset's own past: if BTC is above where it was 3 months ago, be long; if below, be short or flat. Classic implementations use moving-average crossovers, breakout channels or the sign of the trailing 1-12 month return, then scale the position by inverse volatility.

Why it might work at all: trends come from slow diffusion of information and from herding, and crypto has both in abundance plus no valuation anchor to pull price back. Man AHL's research note on crypto trend following argues that liquidity, volatility and the lack of a fundamental anchor make crypto "fertile ground" for trend, and finds that once positions are volatility-scaled, Bitcoin's left tail is more benign than the S&P 500's. Their key portfolio-construction result: risk-adjusted returns peak at around 10-15 coins, because average pairwise correlation is about 0.6 (so there is little diversification to harvest) and beyond the top 15 or so coins slippage rises fast enough to eat what is left.

Academic and practitioner backtests are consistent in sign but wildly different in magnitude, which is itself a warning:

| Study | Universe / period | Headline result |
|---|---|---|
| Rozario et al., "A Decade of Evidence of Trend Following in Cryptocurrencies" (arXiv 2020) | Crypto, ~2010-2020 | Walk-forward returns reported in the hundreds of percent per year; risk-adjusted profile "similar to commodities"; strong diversification vs equities in bear markets. Costs not addressed in the abstract. |
| Zarattini, Pagani, Barbon, "Catching Crypto Trends" (Concretum, 2025) | Top-20 liquid coins, ensemble of Donchian channels, vol-based sizing | Sharpe above 1.5, ~10.8%/yr alpha to Bitcoin; explicit attention to rebalancing costs. |
| Quantpedia multi-timeframe MACD study | BTC, Dec 2018 - Nov 2025 | Buy-and-hold: >60%/yr with a ~80% max drawdown. The best trend rule: Sharpe 1.07, roughly 15%/yr; the naive single-timeframe version made only 4.6%/yr. |
| "AdaptiveTrend" (arXiv 2026) | 150+ pairs, 6-hour bars, 2022-2024 out-of-sample | Sharpe 2.41, max drawdown -12.7%. Three years is a short sample and 6-hour bars imply real turnover. |

Read the spread of results as: the direction of the effect is robust, the size depends enormously on lookback choice, universe, cost model and sample. Anything above a Sharpe of 1 in a public backtest should be treated as an upper bound.

## Family 2: cross-sectional momentum

**Cross-sectional momentum** ranks many coins by trailing return and goes long the top decile against the bottom decile, market-neutral by construction. Liu, Tsyvinski and Wu (NBER 2019, Journal of Finance 2022) built the crypto analogue of the equity factor zoo and found that a three-factor model of crypto market, size and momentum explains the cross-section; nine characteristic-sorted long-short strategies earned sizable, significant excess returns, and the momentum factor is one of the three that prices everything else. The profitable momentum lookbacks in that work are short, one to four weeks rather than the 12 months used in equities (specific weekly return magnitudes from the paper: unverified, the PDF was not readable at time of writing).

Dobrynskaya's follow-up on roughly 2,000 coins over 2014-2020 reports positive momentum out to about 2-4 weeks and significant reversal beyond one month (unverified, abstract-level only). Two practical cautions: the winner and loser deciles are dominated by small, illiquid coins where the paper returns are not executable, and later work reports the premium weakening after 2018 (unverified). This is the family where "alpha decays" is least hypothetical.

## Family 3: short-horizon mean reversion

At horizons of a day or less the sign flips: yesterday's losers beat yesterday's winners. A study of over 3,600 coins finds a significant daily reversal and attributes it to illiquidity, meaning the effect is a compensation for providing liquidity to price-pressured markets rather than a mispricing (whether it survives realistic costs: unverified). Structurally this is market making at a one-day rebalance frequency, with the same adverse-selection exposure. For a team already running quoting infrastructure it is more natural to express this as a wider-spread, slower-refresh inventory strategy than as a "directional" trade.

## Family 4: carry

Carry in crypto is the funding rate. Being paid to hold the unpopular side is a return source that does not require a price view, so it is covered in its own explainer, [funding-rate.md](funding-rate.md). Two ways it re-enters directional trading: as a **cost** (a leveraged long that pays funding or a borrow fee for three weeks is bleeding carry the whole time), and as a **signal** (see Family 5).

## Family 5: on-chain and flow signals

Crypto is unusual in exposing so much of its plumbing, and every metric below is sold somewhere as a leading indicator. The honest summary is that they are **sentiment and positioning gauges**, occasionally useful as filters, rarely stand-alone signals.

- **Exchange netflows.** Coins moving onto exchanges are read as sell intent, off as accumulation. Over 1-3 day windows the correlation with price is weak and dominated by market-maker and arbitrage rebalancing; the relationship is clearer at 7-14 day horizons (unverified beyond secondary write-ups).
- **Stablecoin supply.** The "dry powder" thesis: more stablecoins means more buying power waiting. The metric has degraded because a growing share of stablecoin growth is payments and settlement, not trading, and the Stablecoin Supply Ratio falls both when stables grow and when BTC falls, so the same reading describes opposite states. Treat it as one input, not a trigger.
- **DEX volume and whale wallets.** Volume confirms a move already under way; wallet labelling is noisy, self-reported and gamed. Useful for post-hoc attribution, weak as prediction.
- **Perp open interest and funding.** Extreme positive funding (rule-of-thumb thresholds of +0.05% to +0.1% per 8h) means the long side is crowded and liquidation cascades run downward; extreme negative funding means the reverse. Practitioner write-ups treat this as a contrarian signal but typically present no backtest, and warn that funding spikes during flash crashes are noise, not signal.

## Family 6: event-driven

Scheduled events are where information edge is most defensible, because the calendar is public but positioning around it is not uniform.

**Token unlocks.** Keyrock's study of 16,000+ unlock events across 40 tokens is the best public evidence: about 90% of unlocks create negative price pressure regardless of size or type; team unlocks are the worst at roughly -25% on average; ecosystem unlocks are the only category with a slightly positive average (+1.2%); unlocks above 5% of supply produce about 2.4x sharper drops. The impact starts around 30 days before the unlock date and volatility subsides within about 14 days after. The tradable implication is a short (or exit) a month ahead of large cliff unlocks and a possible re-entry two weeks after.

**Listings and airdrops.** Major-exchange listing announcements produce immediate jumps (recent examples of +33% to +60% within hours), but the move happens on the announcement, so you either have the information early or you are the exit liquidity. Airdrop farming is effectively unpaid labour with an option payoff; the median outcome depends entirely on which programme, and published "median ROI" figures from exchanges are marketing (unverified).

**Governance.** Fee switches, emissions changes and treasury votes are slow, public and thinly traded; the edge is reading proposals faster than the forum does. Small, occasional, and hard to systematise.

## Backtesting pitfalls

Directional strategies are where most fake alpha is manufactured, because the data is cheap and the search space is huge.

- **Survivorship.** Any universe built from today's top-100 list excludes every coin that went to zero. Crypto has a brutal delisting rate; use point-in-time constituents.
- **Look-ahead.** Daily bars stamped at midnight UTC that you could not have traded until the next morning; on-chain metrics revised after the fact; funding rates known only at settlement.
- **Overfitting and selection bias.** Bailey and López de Prado's **Deflated Sharpe Ratio** formalises the obvious: the expected maximum Sharpe among N tried strategies grows with N even when every one is noise. A hundred lookback/threshold combinations tested on a single year of daily data will hand you a "best" Sharpe of roughly 2.5-3 from pure randomness. Count your trials, and haircut accordingly.
- **Fees and slippage.** A weekly-rebalanced top/bottom-decile portfolio in small caps can turn 100 bps of round-trip cost into the whole return. Model cost as a function of size and liquidity, not a flat bps.
- **Regime shifts.** 2017 ICO mania, 2020-21 leverage bull, 2022 credit collapse, 2024-25 ETF-driven flows: each regime rewards a different lookback. A backtest that spans them and still looks smooth is usually curve-fit across them.

## Position sizing: volatility targeting and Kelly

**Volatility targeting** sizes each position so that its expected contribution to portfolio volatility is constant: position notional = (target vol / asset vol) × capital. When vol doubles, you halve the position. This is the single most important idea in systematic directional trading, and it is what makes Man AHL's "benign left tail" claim possible: the strategy de-levers into chaos automatically.

The **Kelly criterion** gives the growth-optimal fraction. For a continuous return stream, f* ≈ μ / σ², expected excess return over variance. A signal with 20%/yr expected excess return on an asset with 80% annualised vol gives f* = 0.20 / 0.64 ≈ 31% of capital. Nobody runs full Kelly because μ is estimated with huge error and the penalty for overbetting is ruin: **half-Kelly** gives up about a quarter of the growth for half the variance. Practitioners point out that a fixed vol target is just a fractional-Kelly bet in disguise, and in the example above a 15% vol target (about 19% of capital) lands close to half-Kelly.

## A worked example: a volatility-targeted SOL trend position

- Capital: $1,000,000. Portfolio vol target: 15%/yr. Signal: 20-day EMA above 100-day EMA on SOL, so the model says long.
- SOL realised vol: 80%/yr (about 4.2%/day). Position = 0.15 / 0.80 × $1M = **$187,500 notional**, roughly 1,875 SOL at $100.
- Daily P&L standard deviation: $187,500 × 4.2% ≈ $7,900, which is 0.79% of capital, matching the 15%/yr target (15% / sqrt(365) ≈ 0.79%).
- Week 2: a leveraged flush takes SOL to $88 and realised vol to 120%. The position is now marked at -$22,500 (-2.25% of capital), and the rebalance rule shrinks notional to 0.15 / 1.20 × $1M = $125,000. You sell about 450 SOL into the drop. This feels terrible and is the point: the system is reducing risk exactly when the tail is fat.
- Week 6: SOL trends to $130, vol back to 80%, position back to $187,500 notional. Cumulative gain on the varying position is roughly +$45,000 to +$50,000 (+4.5-5%), not the +30% a fixed-size hold would show, because you were smaller during part of the move. That is the price of the volatility cap.
- Week 8: the 20-day EMA crosses below the 100-day. Exit. Costs over the trade: two spot legs at 10-30 bps each through Jupiter, about $400-1,100 total; had this been a 2x perp position instead, add 0.06% open and close plus borrow fees on the order of 0.05-0.3% per day depending on pool utilisation, which over eight weeks is another 3-15% of notional. Carry is what kills slow trades on leverage.

## Risk limits and drawdown control

Trend following makes money in a few large moves and loses small amounts most of the rest of the time; the equity curve is positively skewed and spends most of its life below its high-water mark. Man Group's own analysis of the SG Trend index: a -18.6% rolling 12-month return in April 2025 was only the third time in the index's history it had lost more than 15%, and a strategy with Sharpe 0.5 at 10% vol has nearly a four-in-five chance of a 20%+ drawdown over 25 years. Crypto vol is several times higher, so scale those expectations up.

Practical limits, in order of importance:

1. **Portfolio vol target with a hard cap** on gross notional (e.g. 2x capital) regardless of how low measured vol gets. Low realised vol before a crash is the classic trap.
2. **Per-asset concentration** (no single coin above a third of risk budget) and a **correlation-aware** total, since at 0.6 average correlation ten coins behave more like three.
3. **Drawdown de-leveraging:** cut all risk budgets by half at -10% from peak and again at -20%, restore gradually. This lengthens recovery but bounds the tail.
4. **Kill switches** for venue events: an oracle halt, a protocol exploit, a stablecoin depeg. Those are not "market" risk and no vol model sees them coming.

## Execution on Solana

The venue map changed materially this year, so check before relying on anything below.

| Need | Venue | Mechanics and cost |
|---|---|---|
| Spot entry/exit | Jupiter swap | Routed across DEXs; pool fee (typically 5-30 bps) plus ~$0.001 network fee. Fine for liquid majors; price impact dominates in small caps. |
| Resting orders | Jupiter Trigger (Limit V2) | Keeper-executed, triggers on USD price or market cap, partial fills allowed, expiry from 1 hour to 30 days. Fee 0.1% base (0.03% on stable pairs) plus 0-0.5% Ultra routing fee. Stop-losses are **not guaranteed** to fill if price gaps through the level or liquidity is thin. |
| Scaling in over time | Jupiter Recurring (DCA V2) | Time-based (minute to weekly) or price-conditional; minimum $10 per sub-order; sub-orders jittered ±30 seconds to blunt MEV. Same fee tiers as Trigger. |
| Leverage and shorting | Jupiter Perps | SOL, ETH, wBTC against the JLP pool; oracle-settled (Pyth, Chainlink, Edge), so no order book to work. 0.06% open and close, a price-impact fee that grows with OI imbalance, and an hourly **borrow fee** = utilisation × hourly rate × size (the docs' example: about $0.24/hour on $10k at 19.8% utilisation). Leverage up to 250x is offered; liquidation forfeits all remaining collateral. |
| Leverage and shorting (alt) | Velocity DEX (formerly Drift) | Drift was drained of roughly $285-295M on 1 April 2026 via multisig social engineering and governance takeover, rebranded as Velocity on 1 July 2026 and is in private beta at time of writing. Documentation exposes configurable leverage up to 80x and Pyth-based oracles; live parameters must be read on-chain. |

The structural difference from the rest of the stack: **inventory has a holding cost**. An atomic arb is flat at the end of the slot; a swing trade pays borrow or funding every hour, is exposed to every venue's tail risk for its whole life, and has to get out through the same thin liquidity it got in through. On Solana the leveraged venues are pool-versus-trader designs where the pool is the counterparty and sets the borrow rate, so a crowded long side raises your carry precisely when the trend is most obvious.

## What the evidence honestly says

- **Discretionary trading loses.** The cleanest study, Chague, De-Losso and Giovannetti on Brazilian index futures, followed 19,646 people who started day trading in 2013-15; of the 1,551 who persisted more than 300 days, 97% lost money net of fees, 1.1% earned more than minimum wage, and there was no evidence of learning by doing. Taiwanese and US studies land in the same place. Crypto's leverage and 24/7 clock make it worse, not better.
- **Systematic trend in crypto has worked across the available sample**, in every study cited above, but the sample is barely a decade, includes only two full bear markets, and the strategy's drawdowns are deep and long by construction. The reasonable expectation after costs on liquid majors is a Sharpe somewhere around 0.5-1.0, not the 2+ that appears in papers.
- **Cross-sectional momentum's paper returns live in coins you cannot trade at size**, and the premium appears to have weakened as it became known (unverified).
- **Alpha decays.** Every signal here is public. Unlock-date shorts, funding-extreme fades and listing pops are now crowded enough that the front-running of the event has itself become the event, which is why Keyrock finds the unlock impact starting a month early.

## The realistic scorecard

- **Return source:** a risk premium (trend, illiquidity) or an information edge (events), never structural. Expect a Sharpe of roughly 0.5-1.0 after costs on liquid majors, with very fat tails.
- **Speed:** irrelevant. Signals update daily or hourly; execution quality matters more than latency.
- **Capital efficiency:** poor. Inventory is held for days to weeks, carry is paid throughout, and vol targeting means most capital sits idle most of the time.
- **Risk profile:** long-tail, long-drawdown. Deep 20-40% drawdowns are normal operation at crypto vol levels, not a signal that the model broke.
- **Operational load:** low once the pipeline exists (data, signal, sizing, execution, risk), but the research burden is the whole job and the failure mode is silent overfitting.
- **Venue risk:** the highest in this folder, because you are a creditor of the venue for weeks at a time. The 2026 Drift exploit is the current reminder.

## How it fits with the rest of the stack

Very little overlaps. Directional trading shares the **price feeds** (a system that already sees every SOL venue has the cleanest possible input for realised vol and trend signals) and the **venue integrations** (the same Jupiter and perps clients used for hedging or funding harvest can place the trades). Everything else is different: no slot race, no bundle bidding, no state decoding under time pressure, and a risk book measured in weeks rather than milliseconds.

If it has a role in an MEV/arb operation, it is as a **treasury view** rather than a strategy: deciding what the inventory that arb and market making inevitably accumulate should look like, and whether idle capital should be flat, in a funding harvest, or carrying a small vol-targeted trend book. It is in this map for completeness and so that the vocabulary is shared; it is not where a latency-sensitive team's edge is.

## Where to go next

- **Time-series momentum construction:** lookback ensembles, vol scaling, and the turnover/cost trade-off, using Man AHL's and Concretum's papers as templates.
- **Deflated Sharpe and combinatorial cross-validation:** how to count trials and haircut a backtest before believing it.
- **Unlock calendar as a systematic short filter:** replicating the Keyrock event study on Solana tokens.

## Sources

- Man Group, "In Crypto We Trend" — https://www.man.com/insights/in-crypto-we-trend
- Man Group, "Trend Following and Drawdowns: Is This Time Different?" — https://www.man.com/insights/is-this-time-different
- Liu, Tsyvinski, Wu, "Common Risk Factors in Cryptocurrency", NBER WP 25882 / Journal of Finance 2022 — https://www.nber.org/papers/w25882
- Dobrynskaya, "Cryptocurrency Momentum and Reversal", SSRN (abstract only) — https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3913263
- "Up or down? Short-term reversal, momentum, and liquidity effects in cryptocurrency markets", International Review of Financial Analysis (abstract only) — https://www.sciencedirect.com/science/article/pii/S1057521921002349
- Rozario, Holt, West, Ng, "A Decade of Evidence of Trend Following Investing in Cryptocurrencies", arXiv — https://arxiv.org/abs/2009.12155
- Zarattini, Pagani, Barbon, "Catching Crypto Trends: A Tactical Approach for Bitcoin and Altcoins", Concretum Group — https://concretumgroup.com/catching-crypto-trends-a-tactical-approach-for-bitcoin-and-altcoins/
- "Systematic Trend-Following with Adaptive Portfolio Construction" (AdaptiveTrend), arXiv — https://arxiv.org/abs/2602.11708
- Quantpedia, "How to Design a Simple Multi-Timeframe Trend Strategy on Bitcoin" — https://quantpedia.com/how-to-design-a-simple-multi-timeframe-trend-strategy-on-bitcoin/
- Bailey, López de Prado, "The Deflated Sharpe Ratio" — https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf
- Chague, De-Losso, Giovannetti, "Day Trading for a Living?" (summary) — https://www.tradicted.com/research/chagu-day-2020/ ; paper: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3423101
- Keyrock, "From Locked to Liquidity: What 16,000+ Token Unlocks Teach Us" — https://keyrock.com/from-locked-to-liquidity-what-16000-token-unlocks-teach-us/
- Bitsgap, "Stablecoin Supply: A Leading Market Signal?" — https://bitsgap.com/blog/stablecoin-supply-a-leading-market-signal
- QuantJourney, "Funding Rates in Crypto: The Hidden Cost, Sentiment Signal, and Strategy Trigger" — https://quantjourney.substack.com/p/funding-rates-in-crypto-the-hidden
- Jupiter docs, Perps fees — https://docs.jup.ag/user-docs/trade/perps/fees
- Jupiter docs, Perps overview — https://docs.jup.ag/user-docs/trade/perps
- Jupiter docs, Limit (Trigger) orders — https://docs.jup.ag/user-docs/trade/spot/limit-orders
- Jupiter docs, Recurring (DCA) orders — https://docs.jup.ag/user-docs/trade/spot/recurring-orders
- Velocity (ex-Drift) docs, Perpetual Market Specs — https://docs.velocity.exchange/trading/market-specs
- The Crypto Times, "Drift Rebrands to Velocity Ahead of Private Beta Launch" (2 Jul 2026) — https://www.cryptotimes.io/2026/07/02/drift-rebrands-to-velocity-ahead-of-private-beta-launch/
- The Defiant, "Drift Protocol Rebrands to Velocity DEX Ahead of Relaunch" — https://thedefiant.io/news/defi/drift-protocol-rebrands-to-velocity-dex-ahead-of-relaunch
