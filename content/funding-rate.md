# Funding-Rate Strategies, In Depth

_As of Sep 2026._

This is a different animal from arbitrage and market making — no speed race, no MEV. It's a **carry** strategy: you get paid to hold a position, and the skill is in staying hedged.

## First, what a perpetual future actually is

A **perpetual future** ("perp") is a derivative that tracks an asset's price but never expires. On Solana you'd trade these on Velocity DEX (the relaunched Drift — Drift was exploited for roughly $285–295M on 1 Apr 2026 and rebranded to Velocity on 1 Jul 2026, initially in private beta) or Jupiter's perps. Zeta shut its perps DEX in May 2025 to rebuild as Bullet, still in testnet as of Sep 2026.

The problem perps have to solve: a normal futures contract expires, and at expiry its price is forced to converge with spot. A perp never expires — so what stops its price from drifting away from the real SOL price forever? The answer is the **funding rate**.

## The funding rate — the mechanism

The funding rate is a periodic payment **between traders** (not to the exchange) that tethers the perp price to spot:

- When the perp trades **above** spot (more people long, market bullish) → **longs pay shorts.** This penalizes being long and rewards being short, pushing the perp price back down toward spot.
- When the perp trades **below** spot (more shorts, bearish) → **shorts pay longs.** The reverse.

It's usually paid every hour or every 8 hours, calculated as a small percentage of position size. The rate floats based on how far the perp is from spot and the long/short imbalance.

**Key insight:** the funding rate is not a fee — it's a payment you *receive* if you're on the side that's being underweighted by the crowd. That's the entire opportunity. **You want to be the counterparty the crowd is paying.**

## The core strategy: cash-and-carry (delta-neutral funding harvest)

In bull markets, everyone wants leverage long, so perps trade above spot and **funding is positive — longs pay shorts, often generously.** You want to collect that funding *without* betting on price. So you hedge:

**The two legs:**

1. **Short the perp** (you receive funding, since funding is positive)
2. **Hold spot SOL** in equal size (hedges the price exposure of the short)

Now walk through what happens to your P&L when price moves:

- **SOL goes up $10:** your spot SOL gains $10, your perp short loses $10. **Net zero.**
- **SOL goes down $10:** your spot loses $10, your short gains $10. **Net zero.**
- **Meanwhile, every funding period:** you *collect* funding on the short leg.

You've neutralized price entirely ("delta-neutral") and isolated the funding payment as pure yield. **This is the whole strategy** — get paid the funding rate while immune to which way SOL moves.

### What the yield looks like

Funding is quoted as a small per-interval rate, but it annualizes into real numbers. A funding rate of 0.01% per 8 hours = 0.03%/day = **~11% annualized**, collected market-neutral. In hot bull markets funding spikes far higher — 50–100%+ annualized has happened during frenzies, because leveraged longs will pay almost anything to stay long. That's the appeal: equity-like or better yields with (in theory) no directional risk.

## Where it's actually risky — because "delta-neutral" is a lie in practice

The pitch sounds risk-free. It isn't. Here's what actually bites:

**1. Funding flips sign.** Funding is positive *now*, but if sentiment turns bearish, funding goes negative and suddenly *you* (the short) are *paying* the longs. Your yield inverts into a cost. You must monitor and exit/flip when funding turns — the strategy is only good while the sign holds.

**2. Liquidation on the short leg.** Your perp short uses margin. If SOL rips upward hard, your short loses money fast and can get **liquidated** before your spot gains "save" you — because the spot and perp sit in different accounts/venues with different collateral. This is the #1 killer. You manage it by keeping the short **under-leveraged** (lots of margin buffer) — which lowers your capital efficiency and thus your real yield.

**3. The two legs drift (basis risk).** Your hedge is only perfect if spot and perp move identically. They don't always — the *basis* (gap between them) fluctuates, causing mark-to-market swings even when your net position is "neutral." Usually noise, occasionally sharp.

**4. Execution & rebalancing.** As price moves, your two legs drift out of equal size and you must rebalance to stay neutral — costing fees and slippage. And you need capital in two places at once (spot venue + perp venue), with transfer friction.

**5. Smart-contract & venue risk.** Two protocols instead of one = double the smart-contract surface. A venue exploit or an oracle failure hits you regardless of your neutral position — Drift's Apr 2026 drain is the live example: a neutral book on that venue lost its collateral on both legs at once.

## The realistic scorecard

- **Return source:** structural — leveraged traders' persistent demand to be long. Not skill, not speed, not information. As long as crypto has bull-market leverage demand, positive funding recurs.
- **Not a speed game:** funding periods are hourly/8-hourly. This is a *position* strategy — set it up, monitor, rebalance periodically. Latency infra doesn't matter here.
- **Real risk profile:** "market-neutral" on price, but exposed to funding sign flips, liquidation, basis drift, and contract risk. Think of it as **harvesting a risk premium**, not free money — you're being paid to absorb the risk that everyone else's leverage blows up.
- **Capital-intensive:** you tie up full collateral on both legs, and must over-collateralize the short to survive liquidation risk.

## How it fits with a Solana arb stack

This one reuses the *least* of an arb/MEV infrastructure:

- No mempool watching, no priority-fee auction, no slot race. The edge is patience and risk management, not speed.
- What it *does* share: existing price feeds and venue integrations. A system that already knows SOL spot price across venues could read Velocity funding rates and perp prices from the same feeds — acting as a **funding-rate scanner** that flags when funding is attractively positive and sizes the neutral position.
- It's a natural **capital-utilization layer**: when arb opportunities are thin, idle capital could sit in a delta-neutral funding harvest earning yield instead of nothing. The real synergy is not shared code but shared capital being put to work.

## A concrete end-to-end example

- SOL = $100. Velocity (ex-Drift) SOL-perp funding = +0.02% per 8h equivalent (longs paying shorts; ~22%/yr).
- You deploy $20k: buy $10k spot SOL (100 SOL), short $10k notional of SOL-perp — but post extra margin so the short only runs ~2x leverage, not maxed, for liquidation buffer.
- SOL swings between $90 and $115 over two weeks. Your net price P&L is about 0 the whole time (gains on one leg offset losses on the other).
- Every 8 hours you collect ~$2 in funding on the $10k short. Over two weeks (~42 periods) is about $84, on $20k deployed is about 0.4% for two weeks, roughly **~11%/yr realized**, market-neutral.
- Then funding flips negative as the market turns bearish. You close both legs (or flip to long-perp/short-spot if you want to keep harvesting the negative funding). Exit clean.

## Bottom line

Funding-rate harvesting is the "boring yield" corner of the strategy map — no speed edge, real but manageable risk, and best thought of as a way to make idle capital productive between arb opportunities rather than a primary play. Its yield is real and can be substantial in bull markets, but the "delta-neutral = riskless" framing is a trap: liquidation and funding-flip risk are what you're actually being paid for.

## How the funding rate is computed

Every venue has its own recipe, but they all start from the same idea: measure how far the perp trades from "true" price, and charge that gap to the side that is pushing it.

**The generic CEX formula.** Define the **premium index** `P = (mark − index) / index`, where *index* is a basket of spot prices and *mark* is an impact-adjusted perp price (Binance uses `[max(0, impact bid − index) − max(0, index − impact ask)] / index`). Add a fixed **interest rate** `I` (0.01% per 8h, i.e. 0.03%/day) meant to reflect the cost of holding the quote currency vs the base. Then `funding = P + clamp(I − P, −0.05%, +0.05%)`, capped at a per-market bound (±0.375% per 8h for BTC on Binance). The payment is simply `position notional × funding`, taken from one side and paid to the other at each settlement — every 8 hours on most CEXs, 4h or 1h on some.

**Drift, now Velocity DEX (hourly).** Drift was drained for roughly $285–295M on 1 Apr 2026 and announced its rebrand to Velocity DEX on 1 Jul 2026, relaunching in private beta with the same funding design; the formula below is Drift's historical design, now carried by Velocity. The premium is the gap between a one-hour **mark TWAP** (bid/ask midpoint, exponentially weighted) and the **oracle TWAP**, and the hourly rate is `(1/24) × (mark_twap − oracle_twap) / oracle_twap`. The 1/24 matters: a perp trading 1% above oracle *all day* pays 1% over that day, not 1% per hour. Two adjustments sit on top: a **dead zone** (a small band around zero, in bps, treated as noise and dropped) and a **cap** on the premium at 3% of oracle for top-tier markets (5% and 10% for lower tiers). The docs also describe a baseline term of `oracle_twap / 3333` per hour (about 0.00125%/hr, roughly 10.95%/yr) — the same 0.03%/day interest constant as the CEX formula; how it stacks with the premium term is not spelled out (unverified). Payment is proportional to position size and settles into your margin account every hour.

**Jupiter Perps uses borrow fees, not funding.** Jupiter is a **pool-to-peer** venue: your counterparty is the JLP liquidity pool, not another trader, so there is no long/short imbalance to tether. Instead every open position — long *or* short — pays the pool an hourly **borrow fee** on the tokens it has locked: `hourly fee = utilization × hourly borrow rate × position size`, where utilization is locked tokens divided by pool tokens for that asset. The rate follows a **dual-slope (jump-rate)** curve: it rises gently up to an 80% utilization target (about 25% APR for SOL at target) and then jumps steeply toward a max of roughly 250% APR for SOL, 165% for ETH, 170% for BTC. The consequence for this strategy: **you can never be paid to hold a Jupiter position.** There is nothing to harvest there; Jupiter is only ever the leg you *pay* on.

**Adrena and Flash Trade** follow the same pool-to-peer pattern. Adrena charges a utilization-linked borrow fee that rises linearly with pool utilization, quoted as 0–80.5% APR for SOL and WBTC (0–150.7% for BONK), with no funding between longs and shorts. Flash Trade charges hourly "margin fees" on notional (a snapshot of about 0.006%/hr, roughly 53%/yr, circulated in 2025 — unverified), again with no long/short funding. **Zeta Markets** shut its perps DEX in May 2025 to rebuild as Bullet, a Solana network extension; as of Sep 2026 Bullet is still in testnet and there is nothing to harvest there.

So on Solana today the only true funding market to harvest is the orderbook venue (Velocity), plus CEX and Hyperliquid perps off-chain. The pool-to-peer venues are places where *both* sides pay, which is the mirror image of what we want.

**Worked example, premium to payment (Velocity-style).** Oracle TWAP is $100.00 and the mark TWAP over the last hour is $100.05 — a 5 bp premium.

- Hourly rate = (1/24) × 0.0005 = 0.00208%/hr. Well under the 3% cap, above a typical dead zone.
- You are short 100 SOL, $10,000 notional. Payment received this hour = $10,000 × 0.0000208 ≈ **$0.21**.
- If that 5 bp premium persists all day: $5/day, 0.05%/day, about **18%/yr** on notional. Add the ~0.00125%/hr baseline if it applies and the total is nearer 29%/yr.
- Same premium on a CEX 8h schedule: `P = 0.05%`, `I − P = −0.04%` (inside the clamp), funding = 0.01% per 8h, which is only 0.03%/day, about 11%/yr. The CEX formula pays *less* for the same premium because the interest term pulls it toward 0.01%; the hourly TWAP formula pays the premium straight through.

## Sizing the legs and the liquidation buffer

The short leg dies from one thing: SOL rips up and the perp account's equity falls below **maintenance margin** before you can top it up from the spot side. Sizing is about choosing how big a rip you can survive.

**The one formula you need.** Short notional `N`, collateral `C` posted in stablecoins on the perp venue, maintenance margin ratio `m`. After an up-move of fraction `x`, equity is `C − N·x` and the requirement is `m·N·(1+x)`. Liquidation begins when they cross, so the survivable up-move is `x = (C/N − m) / (1 + m)`. Velocity's docs use `m = 3%` as their illustrative maintenance ratio (per-market and admin-set; verify live). With that:

| Collateral vs notional | Effective leverage | Survives an up-move of |
|---|---|---|
| 20% | 5x | about 16.5% |
| 33% | 3x | about 29% |
| 50% | 2x | about 46% |
| 100% | 1x | about 94% |

SOL has done +30% in a week more than once, so 5x is a coin-flip on liquidation over any real holding period; 2x is the usual compromise; 1x is genuinely hard to kill but halves your yield.

**The capital-efficiency cost.** Total capital is spot (`N`) plus perp collateral (`C`). Funding accrues on `N` only, so realized yield on deployed capital is `funding × N / (N + C)`. At 18%/yr funding: 5x collateral realizes 15%, 2x realizes 12%, 1x realizes 9%. Every step toward safety costs you a third to a half of the headline rate. This is the real reason "delta-neutral funding harvest" yields less than the funding-rate screenshot suggests.

**Collapsing the two-venue problem: post the spot leg as collateral.** Cross-margined orderbook venues accept SOL (and LSTs such as JitoSOL or mSOL) as collateral at a haircut, the **asset weight** `w`. Deposit the 100 SOL you would have held as the hedge *into the perp account* and short 100 SOL against it. Now when SOL rises, the collateral rises with it. Equity at price `P` (entry `P0`) is `100·(w·P − (P − P0))`, requirement `m·100·P`, and liquidation only happens when `P > P0 / (1 − w + m)`. With `w = 0.8`, `m = 0.03`, SOL must go to **4.3x your entry** before you are liquidatable; with `w = 0.9` it is 7.7x. Drift historically used weights of about 80% initial / 90% maintenance for SOL (unverified for Velocity). Capital efficiency also jumps: the same SOL does double duty, so realized yield approaches 100% of funding rather than 50–67%.

What you give up: (1) **venue concentration** — both legs now sit in one program, and the Apr 2026 Drift exploit is the textbook case of that risk; (2) **LST-specific risks** if you use JitoSOL (depeg, oracle staleness, a lower weight); (3) haircut drag — 100 SOL of collateral only counts as 80–90 SOL for opening size, so you still need a little stablecoin buffer; (4) exit dependence — if the venue pauses withdrawals, your hedge and your yield are both stuck.

Rule of thumb: run the short at 2x or less if collateral is stablecoins, and treat SOL-as-collateral as the preferred structure whenever you already trust the venue with the spot leg anyway.

## Basis trading with dated futures and cross-venue funding

Funding harvest on perps is one member of a family. The other members change *how* you get paid and *what* can go wrong.

**Cash-and-carry with dated futures.** Buy spot, short a monthly or quarterly future that trades above spot. The gap is the **basis**, and at expiry the future settles to spot *by construction*, so the basis converges to zero and you capture it. Annualize as `basis% × 365 / days to expiry`: spot $100,000, 90-day future at $102,000 is 2% × 365/90, about **8.1%/yr**, locked at entry. The attraction over perps is that the payout is fixed — no funding flips, no hourly monitoring. The costs: you are locked in (the basis can widen mid-life and mark against you), you must **roll** at expiry (about 0.1–0.3% of notional per roll), and exchange margin on futures is fatter (CME BTC asks about 40%). Historically quarterly BTC basis has run below perp funding — one long-run study puts active-contract basis at about 4.3%/yr vs 12.3%/yr for perp funding over 2020–2026 — because the fixed payout is worth a discount. No Solana venue lists dated futures as of Sep 2026; this leg is CEX-only.

**Funding arbitrage across venues.** The same SOL perp funds differently on Binance, Bybit, Hyperliquid and Velocity because each has its own crowd. Go **long where funding is negative, short where it is positive**, and collect both sides with no spot leg at all. Example: venue A pays shorts +0.05% per 8h, venue B pays longs 0.01% per 8h; short A, long B, and you collect 0.06% per 8h, about 65%/yr gross on the notional, still delta-neutral. This is *more* capital-efficient than cash-and-carry (both legs earn) but doubles the liquidation surface, because now *two* margin accounts can blow up and they move in opposite directions.

**CEX–DEX differentials.** Solana perps have a smaller, more retail-long crowd than Binance, so their funding runs hotter in both directions — historically more positive in Solana bull runs, and sharper negative prints in washouts (SOL on Hyperliquid printed about −18% annualized for the whole of Feb 2026, the lowest monthly reading in its series — unverified, via Coinglass). The trade is to short the venue with the elevated funding and long the calm one. Note that Jupiter, Adrena and Flash cannot be the *receiving* leg (they only charge), so the on-chain receiving leg is Velocity or nothing.

**The frictions that eat it.** (1) **Transfer time**: rebalancing between a CEX and Solana means a withdrawal queue plus a bridge or on-ramp — minutes to hours, exactly when you need seconds. (2) **Collateral fragmentation**: each venue wants its own margin, so a $10k neutral position across two venues needs $10k of collateral *twice*, plus buffer in each. (3) **Non-atomic legs**: you cannot open both sides in one transaction, so you carry naked delta for the gap. (4) **Fees**: taker fees of about 4 bps per side per leg make a round trip about 16 bps, which is over a week of funding at 18%/yr — churning in and out on small differentials loses money. (5) **Sign flips are correlated**: a sharp move usually flips funding on *every* venue at once, so the cross-venue spread compresses exactly when you are paying to rebalance.

## What the historical data says

**Long-run averages.** Ethena's funding-risk analysis (open-interest-weighted, roughly 2021 to early 2024) puts average annualized funding at **7.8% for BTC and 9.15% for ETH**, including the 2022 bear market. Year by year for ETH: about 16% in 2021, 0.6% in 2022, 9% in 2023, 13% in 2024 (unverified, from secondary coverage of the same data). Coin Metrics puts aggregate BTC/ETH funding at about **11% annualized in 2024 and about 5% in 2025**. A public Binance backtest over Jan 2020 to Apr 2026 finds gross carry of **9.0%/yr on BTC and 11.4%/yr on ETH** with drawdowns under 2% and the strategy flat about 65% of the time (it only enters when funding clears a threshold); the same study shows 2025 at 4.3%, which after a 4–5% USD cash rate is close to zero excess return. A separate SSRN paper reports 16%/yr and a Sharpe above 6 for a 3x-leveraged BTC carry (unverified; leverage and a calm sample flatter the number).

**How often it flips.** Per Ethena's data, ETH funding was negative on **17.5% of days** and BTC on **15.9%**; the longest negative streak was **13 days** versus a positive streak of 176 days (late 2023 to early 2024); only one quarter in three years (Q3 2022) had a negative average. Negative funding clusters in crashes: Luna/3AC and FTX in 2022, the Feb 2025 Bybit hack, the 10 Oct 2025 flash crash. The Feb 2026 drawdown printed the worst readings since 2023 — BTC daily annualized funding hit **−15.46%** on 6 Feb 2026 and the 7-day average reached −3.5% (K33). So: the sign is positive roughly five days in six, but the negative sixth arrives in bursts, and it is the same burst that threatens your short's margin.

**SOL specifically.** SOL funding is a higher-beta version of BTC: a wider positive premium in Solana bull phases (2024 saw sustained 30–60% annualized on SOL perps — unverified) and deeper negative prints in washouts (the −18% Feb 2026 Hyperliquid reading above). Fewer natural shorts means the short side of SOL is better paid *and* more crowded when it turns.

**Delta-neutral yield in practice, and the crowding effect.** Ethena is the largest live version of this trade and publishes its yield: sUSDe launched at 27% APY in Feb 2024, briefly exceeded 60%, averaged roughly 19% over 2024, ranged 4–15% through 2025, and sat near 4% by Aug 2026, with most 2024–2025 periods clearing 8–18% (partly unverified, from secondary coverage). USDe supply peaked near **$14B in Oct 2025** and contracted to about $5–6B in 2026 (unverified). The 60% peak happened when Ethena's short book was small relative to open interest; as it and every copycat vault grew, their shorts *became* the counterparty that the longs needed, which is exactly the thing that pushes premium down. This is the **crowding effect**: the return source is other people's leverage demand, and every dollar of delta-neutral capital supplies the short that meets it. Funding compresses toward the interest floor (~11%/yr on the CEX formula) as arbitrage capital grows, and in 2025 it compressed *through* it. Expect realized yields in the high single digits in calm regimes, 20%+ only in the euphoric months, and negative carry for a few weeks a year.

## Where to go next

- **Live parameters** — pull the current maintenance margin ratio, asset weights for SOL and LSTs, and the funding dead zone and cap for each Velocity market from the venue itself before sizing; everything above uses illustrative values.
- **Regime detection** — the data section shows funding sign is autocorrelated (176-day positive streaks, 13-day negative ones). A simple rule for when to be in, out, or flipped is the next thing to build, before any execution work.

## Sources

- Velocity DEX docs, funding rates: https://docs.velocity.exchange/trading/funding-rates
- Velocity DEX docs, liquidations: https://docs.velocity.exchange/protocol/trading/liquidations
- Velocity DEX docs, profit and loss: https://docs.velocity.exchange/protocol/trading/profit-loss
- The Defiant, Drift rebrands to Velocity DEX: https://thedefiant.io/news/defi/drift-protocol-rebrands-to-velocity-dex-ahead-of-relaunch
- The Crypto Times, Drift rebrands to Velocity ahead of private beta (1 Jul 2026): https://www.cryptotimes.io/2026/07/02/drift-rebrands-to-velocity-ahead-of-private-beta-launch/
- Eco, Jupiter Perps fees and JLP: https://eco.com/support/en/articles/15083164-jupiter-perps-fees-leverage-how-jlp-works
- Zengineer, JLP deep dive (dual-slope borrow parameters): https://zengineer.blog/blog/deeptech/jlp-deep-analysis-en/
- Jupiter Research forum, dynamic borrow fee proposal: https://discuss.jup.ag/t/dynamic-borrow-fees-adjustment-proposal/35464
- Adrena docs, fees: https://adrena.gitbook.io/adrena/about-adrena/fees
- Flash Trade docs (full corpus): https://docs.flash.trade/flash-trade/llms-full.txt
- eli5defi, The Solana Perps Season (Zeta shutdown, Bullet): https://eli5defi.substack.com/p/the-solana-perps-season
- Solana Compass, Zeta Markets profile: https://solanacompass.com/projects/zeta-markets
- CoinGlass Learn, funding rates: https://www.coinglass.com/learn/funding-rates-1
- Ethena docs, funding risk: https://docs.ethena.fi/protocol-overview/risks/funding-risk
- Coin Metrics, State of the Network 335 (Ethena mechanics): https://coinmetrics.substack.com/p/state-of-the-network-issue-335
- Eco, Ethena USDe and sUSDe 2026: https://eco.com/support/en/articles/15254002-ethena-usde-and-susde-2026-delta-neutral-yield
- The Block, K33 on Feb 2026 negative funding: https://www.theblock.co/post/389410/k33-bitcoin-bottom
- zwmjj/funding-rate-arb, Binance carry backtest 2020–2026: https://github.com/zwmjj/funding-rate-arb
- BackQuant, The Basis Trade Explained: https://www.backquant.com/learn/basis-trade
- crypto.news, What is basis trading: https://crypto.news/what-is-basis-trading-cash-and-carry-arbitrage-explained/

Search-result only, not read in full (claims drawn from them are marked unverified): Jupiter Station "How It Works" (redirects, page unavailable), SSRN 5292305 (leveraged BTC funding carry), CoinGlass Feb 2026 monthly funding summary.
