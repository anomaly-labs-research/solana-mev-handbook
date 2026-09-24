# Statistical Arbitrage, In Depth

_As of Sep 2026._

Atomic arbitrage is a race: two prices disagree right now, and whoever lands the transaction first takes the difference. Statistical arbitrage is a bet: two prices *usually* agree, they don't right now, and you are willing to hold real inventory until they agree again. Same word, very different discipline.

## The core idea

You find two (or more) assets whose prices are tied together by something structural, so that their **spread** wanders but keeps getting pulled back to a stable level. When the spread stretches unusually far, you buy the cheap leg, sell the rich leg, and wait. When it snaps back, you unwind. You never need to know where either asset is going; you only need the *relationship* to hold.

Three things make this different from the atomic arb the rest of this stack is built for:

- **You hold inventory.** The trade is not one transaction; it is a position that lives for hours or days. You are exposed to the spread moving further against you before it reverts.
- **It is not risk-free.** The relationship is statistical, not mechanical. Sometimes it breaks, and when it breaks it usually breaks in the direction you are positioned against.
- **Speed is not the edge.** The edge is a model of fair value plus the discipline to size and stop out. A stat-arb desk that is 500 ms slower than a competitor loses almost nothing; a desk with a bad fair-value model loses everything.

| | Atomic arb | Statistical arb |
|---|---|---|
| Holding period | One transaction, one slot | Hours to weeks |
| Inventory risk | None (tx reverts if unprofitable) | Full: you own the legs |
| What you compete on | Latency, tx landing, priority fees | Model quality, capital, risk control |
| Failure mode | Missed trade, wasted fee | Spread never reverts; permanent loss |
| Capital need | Small, can flash-borrow | Real balance sheet, funding cost |
| Certainty of profit | Deterministic per trade | Probabilistic, edge shows over many trades |

The relationship doing the pulling can be soft (two Layer-1 tokens that historically co-move) or hard (a liquid staking token that can be redeemed for a known quantity of SOL). On Solana the interesting trades cluster at the hard end, and that is where most of this doc spends its time.

## Pairs trading mechanics

**Pairs trading** is the classic two-asset form. The machinery below generalizes to baskets, but two legs is enough to see every moving part.

### Constructing the spread

Given prices A and B, regress one on the other in levels: A_t = α + β·B_t + ε_t. The fitted β is your **hedge ratio** (how many units of B offset one unit of A) and the residual ε_t is the **spread**. Most practitioners run this on log prices so the hedge ratio is a ratio of dollar exposures rather than token counts, which stays stable as prices scale.

### Cointegration, not correlation

**Correlation** measures whether daily *returns* move together. **Cointegration** asks whether the *price levels* stay tethered: does some β exist such that A − β·B is stationary, wandering around a fixed mean with bounded variance? These are not the same thing. Two assets with 0.95 return correlation but different drifts (say 20% vs 5% a year) will see their price ratio diverge roughly 50% over three years. Highly correlated, untradeable as a pair, because the spread never comes home.

The standard test is the **Engle-Granger two-step**: fit the OLS hedge ratio, then run an augmented Dickey-Fuller test on the residual, using the stricter Engle-Granger critical values because β was estimated rather than known. Pass the test and you have a candidate. Fail it and no amount of visual "they look like they move together" should convince you.

The useful mental picture: correlation is two drunks stumbling in the same wind; cointegration is a drunk and her dog on a leash. They wander, but something structural pulls the distance back.

### Half-life via Ornstein-Uhlenbeck

A stationary spread is usually modelled as an **Ornstein-Uhlenbeck process**: dX = κ(θ − X)dt + σ dW. θ is the long-run mean, σ the noise, and κ the **speed of mean reversion**: the further the spread is from θ, the harder it gets pulled back. Expected dislocations decay exponentially, so the **half-life** (time for half of a deviation to close) is t½ = ln(2) / κ.

You estimate κ with a single AR(1) regression on the spread: X_t = c + φ·X_{t−1} + ε. Then κ = −ln(φ) per period, θ = c / (1 − φ), and the equilibrium standard deviation is σ_eq = σ_ε / sqrt(1 − φ²). Half-life does a lot of work: it sets how long you expect to hold, how many independent bets your capital cycles through per year (which drives Sharpe via the square-root-of-bets rule), and when a trade is officially broken rather than merely slow.

### Z-score entry and exit

Normalize the spread: **z = (X − θ) / σ_eq**. A common rule set, from the pairs-trading literature and practitioner writeups:

- **Enter** when |z| ≥ 2 (short the spread if z > 0, long if z < 0).
- **Exit** when |z| falls to about 0.5, or 0 if you are patient; the last half-sigma of decay pays little relative to the time it costs.
- **Hard stop** at |z| ≈ 3.5, or after about three half-lives (by then only 12.5% of the expected dislocation should remain, so a trade that has not converged is structurally broken, not unlucky).

### Position sizing

Size in proportion to z, capped near z = 3, so a mild deviation gets a small position and an extreme one gets a large-but-bounded one. Then convert to a risk budget: decide the maximum loss you accept if the spread runs to the stop, and back out the notional. Diversify across many pairs whose spreads are driven by different things; one pair is a coin flip with a model attached, thirty uncorrelated pairs is a strategy.

## A worked pairs example

Two tokens, A and B. A daily AR(1) fit of the spread returns c = 0.12 and φ = 0.94, with residual σ_ε = 0.25.

- κ = −ln(0.94) ≈ 0.062 per day, so half-life ≈ ln(2) / 0.062 ≈ **11.2 days**.
- θ = 0.12 / (1 − 0.94) = **2.00**.
- σ_eq = 0.25 / sqrt(1 − 0.94²) ≈ **0.73**.

The spread prints 3.46 today: z = (3.46 − 2.00) / 0.73 = 2.0. Entry signal. You short A and buy β units of B so the position is flat to the common factor and long only the spread's mean reversion.

- **Expected path:** half the 1.46 deviation closes in about 11 days; you plan to exit near z = 0.5 (spread 2.37), capturing roughly 1.10 spread units.
- **Stop:** z = 3.5 (spread 4.56), a loss of 1.10 units. Roughly 1:1 payoff, but the model says reversion is far more likely than a further 1.5-sigma extension, and that asymmetry in *probability* is the edge.
- **Time stop:** 34 days. If the spread is still above 2.7 by then, you liquidate regardless.
- **Capacity check:** 252 / 11.2 ≈ 22 cycles a year on this pair. If each cycle nets 0.6% on deployed capital after slippage, that is roughly 13% before financing, uncorrelated with the market if the hedge is clean.

Notice that every number that matters came from the model, not from the order book. That is the whole point.

## The Solana opportunity set

### Liquid staking tokens: the hard-anchored trade

Solana's LSTs (jitoSOL, mSOL, bSOL, JupSOL, INF, plus a long tail of validator-branded Sanctum LSTs) are the cleanest stat-arb material on the chain, because each has a knowable **redemption value**.

**The fair-value model.** Every stake-pool LST is a claim on a pool of stake accounts. Its **exchange rate** is total SOL under management divided by tokens outstanding; Marinade states it as `price of mSOL = total_staked / tokens_minted`. This rate updates once per **epoch** (roughly 2–3 days) when inflation and MEV rewards land and the pool's update instructions are cranked; between updates it is flat. It only goes one way, up by the staking yield (around 6–8% a year), less the pool's epoch fee on rewards (Jito 4%, Marinade 6%, bSOL ~5%, Sanctum validator LSTs ~2.5% as of Sep 2026). As of Sep 2026 the sizes are: Sanctum combined ~$2.16B, jitoSOL ~$1.22B, JupSOL ~$605M, mSOL ~$275M, bSOL ~$107M.

So the LST has a redemption anchor and two exits:

- **Delayed unstake:** convert to a stake account, deactivate, wait for the epoch boundary. Fee 0.1% (Jito, bSOL) to 0.2% (Marinade). You receive SOL in one to two epochs depending on where in the epoch you are.
- **Instant unstake:** sell on a DEX, or route through Sanctum's Reserve / Infinity, which reads the on-chain exchange rate and charges about 0.1–0.3%, rising when many people unstake at once.

Those exits define an **arbitrage band** around redemption value. The LST cannot stay meaningfully *above* redemption, because anyone can mint fresh LST at the stake-pool rate and sell it. It can trade *below* redemption by, at most, the delayed-unstake fee plus the time value of locking SOL for an epoch plus a risk premium for the pool. In normal conditions the big LSTs sit within a fraction of a percent of fair value; the discount is essentially the market's price for waiting two days.

**Why discounts open.** Redemption is slow and rate-limited: the stake program caps network-wide activation and deactivation at 25% of stake per epoch, and Sanctum's Reserve is finite. So when a lot of LST wants to become SOL *now*, the only exit is the DEX, and the DEX can only absorb what its liquidity allows. The sellers who need SOL now are almost always **forced sellers**: leveraged LST/SOL "multiply" loops on Kamino, marginfi or Save being liquidated, or a large holder exiting into a thin book. Two episodes to know:

- **mSOL, 12 Dec 2023.** One wallet sold about 68,500 mSOL (roughly $8M) for SOL in ~20 minutes across nine transactions. mSOL/SOL fell from 1.14 to about 1.01, a ~12% discount to redemption, and triggered liquidations of mSOL collateral. It recovered within the day because bots and patient holders bought discounted SOL they could redeem at par in one epoch. The aftermath was a public argument between marginfi (prices mSOL at its 1-hour EMA market price) and Solend (prices mSOL off the SOL oracle, ignoring the discount) about which oracle design is safer. That debate is exactly the stat-arb question: is the market price or the redemption value the "truth"?
- **10 Oct 2025.** A ~$19.5B cross-crypto liquidation cascade pushed several Solana LSTs below their redemption value as holders rushed to sell. Sanctum's INF pool met withdrawals from its SOL reserve, earned a 26% epoch return on swap fees doing it, and jitoSOL, which routed more than half its volume through incentivised pools, held its peg. Smaller LSTs with shallow DEX liquidity gapped wider.

**The trade.** Buy the discounted LST, delayed-unstake it, receive SOL at redemption value. If your book is SOL-denominated there is no directional exposure at all; if it is USD-denominated you hedge the SOL leg with a perp short. Concretely: redemption value 1.140 SOL, market 1.105 SOL (3.1% discount), Marinade delayed-unstake fee 0.2%. You pay 1.105, receive 1.140 × 0.998 = 1.1377 SOL in at most two epochs. Net ≈ 2.9% in roughly four days on SOL-denominated capital, with the only risks being the pool itself and the time it takes. The catch is capacity: the whole 2023 episode was ~$8M of flow, and the recovery took hours, so this is a trade you must already be positioned to take, with SOL sitting idle waiting for it, not one you discover afterward.

**LST-vs-LST pairs.** Two LSTs measured in SOL are cointegrated almost by construction: both drift up at similar yields and both are anchored to redemption. The mSOL/jitoSOL spread should be nearly flat with a slow drift equal to the yield difference. That makes it a textbook pairs candidate with a very short half-life, though the deviation sizes are tiny outside stress, so it only pays with scale or during liquidation events.

### Stablecoin basis

USDC, USDT, PYUSD and USDS should all be worth $1.00. Typical deviation is about ±0.10% for USDC and ±0.34% for USDT on aggregated pricing; through 2026 none of the large fiat-backed or CDP dollars moved more than 1%. The **anchor** is redemption: an issuer's direct customer buys the discounted coin and redeems at par, and for USDS the Peg Stability Module swaps USDC for USDS at exactly 1.00. On Solana this shows up as small, frequent deviations in the USDC/USDT and USDC/PYUSD pools on Orca, Raydium and Meteora, plus wider spreads on PYUSD for size.

The important nuance: a stablecoin spread is *not* an OU process. It is a solvency question with a mean-reverting disguise. USDC traded to $0.87 for ~48 hours in March 2023 because $3.3B of reserves were stuck at Silicon Valley Bank and the redemption channel (bank wires, US banking hours) was closed over a weekend; buying at 0.90 was a great trade, but only because the US Treasury guaranteed depositors on Monday. UST in May 2022 was a death spiral with no external anchor, and every "it always reverts" buyer was wiped out. The record for 2025–26 splits cleanly: the big fiat-backed coins held, and every material break involved a smaller yield-bearing or synthetic dollar without the liquidity to absorb moderate selling. Trade the ones with a redemption channel you understand; treat the rest as directional bets on solvency.

### Wrapped and bridged asset pegs

Wrapped BTC variants (wBTC, cbBTC), Wormhole-wrapped ETH, and bridged versus native stablecoins should trade at parity with what they represent, minus bridge fees and delay. The fair-value model is the same shape as the LST one (a redemption path with a fee and a wait), but the tail risk is worse: a bridge exploit turns the wrapped token into an unbacked claim overnight and there is no "wait an epoch" recovery. The Wormhole exploit of Feb 2022 (roughly $320M of wrapped ETH minted unbacked, later made whole by Jump) is the canonical case (unverified: from memory, not fetched for this doc). Size these smaller than LST trades for the same measured deviation.

### Perp-vs-spot and cross-venue basis

Briefly, since funding rates have their own doc: the difference between a perp and spot, or between the same spot pair on two venues, is a spread with a known anchor (funding payments, or free transfer) and a fast half-life. Cross-venue *within* Solana is mostly atomic-arb territory. Cross-venue *between* Solana and a CEX, or perp-vs-spot, cannot be done atomically, so it is stat arb: you carry inventory on both sides and earn the basis converging. See `funding-rate.md` in this folder for the carry version of that trade.

## What the published research says

| Study | Universe / period | Result | Caveat |
|---|---|---|---|
| Gatev, Goetzmann, Rouwenhorst (1999/2006) | US equities 1962–2002, distance method | Up to ~11–12% annualized excess return on self-financing pair portfolios | Pre-costs; authors note part may be microstructure |
| Do & Faff (2010, 2012) | US equities 1963–2009 | ~30 bps/month after costs for well-matched industry pairs; "largely unprofitable post-2002" | ~70% of the decline attributed to worse arbitrage risk, not just efficiency |
| Rad, Low, Faff (2016) | US equities, distance vs cointegration vs copula | Distance and cointegration methods roughly comparable, copula weaker | Figures not fetched for this doc (unverified) |
| IJSRA (2026), crypto cointegration | BTC, ETH, LTC, XRP daily, Jan 2022–Oct 2024 | BTC-ETH pair: 16.3% annualized, 8.45% vol, Sharpe 1.58–2.45, beta 0.09–0.18 | No transaction costs, short sample, in-sample thresholds |
| Tadi & Kortchmeski (2021), crypto dynamic cointegration | Bitmex coins, minute data with bid/ask execution | Beats buy-and-hold with "reasonably low" drawdown | Qualitative; no headline Sharpe in abstract |

Read this table as: naive pairs trading in liquid, well-arbed markets decays toward zero; the equity edge that existed in the 1980s was mostly gone by the mid-2000s. Crypto results look far better, but the good ones ignore costs and use two to three years of data. A realistic expectation for a diversified, cost-aware crypto stat-arb book is a Sharpe in the 1–2 range with occasional sharp drawdowns when a relationship breaks; anything advertising 3+ on a daily-data backtest has usually not paid slippage yet.

## The risks, honestly

- **The relationship breaks.** This is the risk; everything else is a cost. stETH traded at up to an ~8% discount to ETH in June 2022 as Celsius and Three Arrows dumped into a drained Curve pool, with no direct redemption available until the Shanghai upgrade a year later. Holders who bought the "discount" at 0.97 were down another 5% and had no exit for months. UST went to zero. On Solana the mSOL and Oct 2025 episodes recovered because the redemption path stayed open; a pool with a slashing event, a stuck crank, or a validator-set exploit would not.
- **Inventory and funding cost.** Capital sitting in a pair earns nothing while it waits. If you borrow one leg, the borrow rate eats the spread; if you hedge with a perp, funding does. A 0.5% expected reversion over ten days is a good trade at 5% annual funding and a losing one at 40%.
- **Execution slippage on thin pairs.** The pairs with the fattest z-scores are thin precisely because nobody else can trade them either. A 2-sigma signal on a pool with $200k of depth might cost you 1.5 sigma to enter and exit.
- **Regime change.** Hedge ratios drift. A pair estimated over a calm quarter can be badly mis-hedged in a volatile one. Re-estimate on rolling windows and re-test cointegration; a pair that fails the test should be closed, not held.
- **Overfitting.** Test 200 pairs at a 5% significance level and ten of them pass by chance. Then you pick the one with the prettiest backtest. Walk-forward validation and an economic reason for the relationship (shared redemption asset, shared collateral, shared issuer) are your only defence.
- **Crowding.** The mSOL recovery took hours because a crowd showed up. In a crowded trade you win less on entry and lose more on exit, because everyone's stop is at the same z.
- **Oracle and liquidation timing.** If you run the trade with leverage, the lender's oracle decides whether *you* are the forced seller. A market-price oracle will liquidate you into the very discount you were buying; a redemption-rate oracle will not, but exposes the lender to bad debt.

The summary: this is real quant trading. The bots in the rest of this stack win by being first; a stat-arb book wins by being right on average and surviving the times it is wrong.

## What it needs

- **Historical price series** for every leg, at the resolution you trade (block-level swap prices for on-chain pairs, minute bars from CEX feeds for basis trades), long enough to estimate half-lives and to include at least one stress episode.
- **On-chain stake-pool state:** each pool's total lamports and token supply (the exchange rate), the last update epoch (so you know whether the rate is stale), reserve balances, and fee schedules. Plus Sanctum Reserve depth, since it sets the instant-unstake price.
- **A fair-value model** per relationship: redemption-anchored for LSTs and wrappers, redemption-plus-solvency for stablecoins, OU-with-hedge-ratio for soft pairs. And a rule for when the model itself is wrong.
- **A risk layer:** position limits per pair and per common factor, z-based sizing, time stops, and a kill switch on any pair whose cointegration test fails on refresh.
- **Monitoring:** live z-scores, realized vs modelled half-life, liquidation-feed watch on the lending markets (that is where forced LST flow originates), and epoch-boundary awareness so you know when redemption values step up.
- **Patient capital.** Idle SOL and USDC that is allowed to sit and wait for a discount is the actual product. A stat-arb book that is always fully deployed cannot buy the December 2023 dip.

## Realistic scorecard

| Dimension | Assessment |
|---|---|
| Edge source | Fair-value model + willingness to hold; not speed |
| Typical return | High single digits to ~20% a year on deployed capital for a diversified book; lumpy |
| Sharpe expectation | 1–2 after costs; backtests claiming more usually skipped slippage |
| Capacity | Small in calm markets; large but brief during liquidation cascades |
| Worst case | Permanent depeg while fully positioned (stETH 2022, UST) |
| Capital | Real balance sheet; cannot be flash-loaned |
| Latency need | Low; seconds to minutes is fine |
| Best Solana venues | LST discounts via delayed unstake; LST/LST and stablecoin pools; cross-venue basis |
| Hardest part | Distinguishing "cheap" from "broken" in real time |

## How this connects to the rest of the stack

- **Atomic arb is the fast half of the same trade.** When an LST gaps, the atomic bots close the *cross-pool* discrepancies within the slot; what they cannot do is buy the LST below redemption and wait an epoch. That residual discount is the stat-arb book's flow. The two strategies split the same event by holding period.
- **Liquidations are the upstream source.** Nearly every LST or collateral-token discount begins with a lender liquidating a leveraged position. The liquidation engine sees that flow first; it is the natural signal that a discount is about to open.
- **Market making needs the same fair-value input.** An LST market maker quoting without the stake-pool exchange rate is quoting blind. The redemption model built here is the "true price" a market maker centres its quotes on, and the z-score is its stale-quote alarm.
- **Funding rate is the carry cousin.** Perp-vs-spot basis is a stat-arb spread whose anchor is the funding payment; that doc covers it as a yield trade, this one as a mean-reversion trade. Same inventory, same hedge, different exit rule.

---

## Where to go next

- **Johansen and multi-asset cointegration**, for baskets of LSTs rather than pairs.
- **Optimal entry/exit under OU** (the Hudson & Thames and Leung-Li optimal-stopping formulations), once the plain z-score rules feel crude.
- **Oracle design for LST collateral**, the marginfi-vs-Solend debate, which determines where forced flow comes from.

## Sources

- Gatev, Goetzmann, Rouwenhorst, "Pairs Trading: Performance of a Relative Value Arbitrage Rule", NBER w7032 / RFS 2006. https://www.nber.org/papers/w7032
- Do & Faff, "Are Pairs Trading Profits Robust to Trading Costs?", Journal of Financial Research 2012 (via University of Strathclyde portal). https://pureportal.strath.ac.uk/en/publications/are-pairs-trading-profits-robust-to-trading-costs
- Rad, Low, Faff, "The profitability of pairs trading strategies: distance, cointegration and copula methods", Quantitative Finance 2016 (not fetched). https://pure.bond.edu.au/ws/portalfiles/portal/36339487/AM_The_profitability_of_pairs_trading_strategies.pdf
- HMA Quant, "Pairs Trading: Cointegration Beats Correlation". https://hmaquant.substack.com/p/pairs-trading-cointegration-beats
- HMA Quant, "Mean Reversion and the Ornstein-Uhlenbeck Process: Trading Half-Lives". https://hmaquant.substack.com/p/mean-reversion-and-the-ornstein-uhlenbeck
- Tadi & Kortchmeski, "Evaluation of Dynamic Cointegration-Based Pairs Trading Strategy in the Cryptocurrency Market", arXiv 2109.10662. https://arxiv.org/abs/2109.10662
- IJSRA 2026, "Statistical Arbitrage Strategies Using Cointegration Analysis in Cryptocurrency Markets". https://ijsra.net/content/statistical-arbitrage-strategies-using-cointegration-analysis-cryptocurrency-markets
- Marinade docs, "What is mSOL?" (exchange-rate formula, unstake fees). https://docs.marinade.finance/marinade-protocol/protocol-overview/marinade-liquid/what-is-msol
- Solana Program Library, Stake Pool overview and fees. https://www.solana-program.com/docs/stake-pool/overview and https://www.solana-program.com/docs/stake-pool/fees
- Anza docs, "Stake Delegation and Rewards" (25% per-epoch warmup/cooldown rate). https://docs.anza.xyz/consensus/stake-delegation-and-rewards
- Sanctum, "How To Unstake Solana LSTs: Instant vs Delayed". https://sanctum.so/blog/how-to-unstake-solana-lsts-instant-vs-delayed-guide
- Sanctum, "The Ultimate Guide to Solana Liquid Staking". https://sanctum.so/blog/solana-liquid-staking-guide
- Sanctum, "Solana Staking: Risks and How to Reduce Them" (Oct 2025 crash, INF reserve). https://sanctum.so/blog/solana-staking-risks
- Eco, "Best Solana Liquid Staking Comparison" (TVL and fees as of 21 Sep 2026). https://eco.com/support/en/articles/15083165-best-solana-liquid-staking-comparison
- Solana Compass / Lightspeed, "MarginFi and Solend Debate Risk Management After mSOL Depeg". https://solanacompass.com/learn/Lightspeed/the-marginfi-vs-solend-debate-lessons-from-msols-depeg
- Arkham Research, "Beginner's Guide to Liquid Staking on Solana" (mSOL 1.14 to 1.01 episode). https://info.arkm.com/research/solana-liquid-staking
- CoinDesk, "Nansen Report Shows Links Between Terra Collapse and stETH De-peg". https://www.coindesk.com/business/2022/06/29/nansen-casts-blame-for-steth-de-peg-on-terra
- Coinpaprika, "Stablecoin De-Pegging Events" (USDC March 2023, UST). https://coinpaprika.com/education/stablecoin-de-pegging-events/
- Jito, "Price Stability For Liquid Staking Tokens: Is JitoSOL an Equivalent to SOL?" (not fetched; redemption-vs-market "peg accuracy" framing from search summary, unverified). https://www.jito.network/Price-Stability-For-Liquid-Staking-Tokens---Is-JitoSOL-an-Equivalent-to-SOL.pdf
