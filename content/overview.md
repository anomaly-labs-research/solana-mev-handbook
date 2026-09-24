# DeFi Trading Strategies — Landscape Overview

_As of Sep 2026._

The strategy space, roughly ordered from most-adjacent-to-a-Solana-arb-stack to least. Each
strategy has its own in-depth explainer in this folder; this page is the map.

| # | Strategy | In depth | One-line shape |
|---|---|---|---|
| 1 | Arbitrage (spread, cyclic, CEX-DEX, backrunning) | [arbitrage.md](arbitrage.md) | Atomic price-gap capture; the speed race everything else is measured against |
| 2 | Liquidations | [liquidations.md](liquidations.md) | Repay underwater debt, seize collateral at a protocol-set discount |
| 3 | JIT liquidity | [jit-liquidity.md](jit-liquidity.md) | Be the LP for one large swap, then leave |
| 4 | Market making | [market-making.md](market-making.md) | Quote both sides, earn the spread, fight adverse selection |
| 5 | Statistical arbitrage | [statistical-arbitrage.md](statistical-arbitrage.md) | Trade mean reversion between related assets (LST pegs, stables) |
| 6 | Funding-rate / basis | [funding-rate.md](funding-rate.md) | Delta-neutral carry from perp funding |
| 7 | Launchpad sniping | [launchpad-sniping.md](launchpad-sniping.md) | Buy new tokens in the creation slot on bonding-curve launchpads |
| 8 | Yield | [yield.md](yield.md) | Staking, lending supply, LP fees, looping |
| 9 | Directional / swing | [directional.md](directional.md) | Bet on price over hours to weeks |

## 1. Arbitrage (the baseline)

Two venues quote the same pair at different prices; buy the cheap one, sell the dear one, in one
atomic transaction. Spreads come from uninformed flow moving one pool while the others sit still,
so every large swap is a potential **backrun**. The profit is the mirror image of the LPs'
**loss-versus-rebalancing (LVR)**.

- **Edge:** speed to see the state change (shreds beat account updates) and to win the ordering
  auction (Jito tips, priority fees).
- **Risk:** near zero on the position; real on the cost side (tips on lost bundles, fees on
  reverted transactions, spam).
- **What it needs:** pool state decoders, price-impact math, bundle submission, tip sizing.

## 2. Liquidations (closest to arb infra)

Lending protocols (Kamino, MarginFi, Save, Jupiter Lend) let users borrow against collateral. When
collateral value falls below the **liquidation threshold**, anyone can repay part of the debt and
seize collateral at a discount (the **liquidation bonus** or **penalty**, typically 1-10%).

- **Why it suits an arb stack:** same speed race. Oracle updates instead of pool updates, health
  factors instead of price gaps, the same priority-fee and bundle bidding.
- **The edge:** a fixed, protocol-defined bonus, not a market bet. Benign MEV: the protocol needs
  someone to do it.
- **The work:** track every borrower, predict which cross the line as prices move, win the race,
  fund the repayment (own capital or flash loan) and unwind the collateral.
- **Risk:** competition compresses margins; seized collateral is sold into a falling market.

## 3. JIT (Just-In-Time) liquidity

A hybrid of MM and MEV. Spot a large swap, add concentrated liquidity in an ultra-tight range
right before it executes, collect the fee from that one trade, withdraw immediately, all in one
bundle. Sniper market making: you are an LP for one slot, so you carry almost no LVR.

- Needs visibility of the swap before it lands (shreds, preconfirmations) and exact ordering.
- Benign-ish: the trader gets a better price, passive LPs lose the fee they would have earned.

## 4. Market making

Post bids and asks, earn the spread from noise traders, pay adverse selection to informed ones.
On Solana that means an on-chain CLOB (Phoenix, OpenBook, Manifest), perps auctions (Drift JIT),
or passive concentrated-liquidity LPing. The 300 ms slot (400 ms until August 2026) bounds how fast quotes refresh, which is
the structural handicap versus a CEX.

## 5. Statistical arbitrage

Trade mean-reverting relationships between correlated assets. On Solana: liquid staking tokens
(mSOL, jitoSOL, bSOL) that should track SOL plus staking yield, stablecoin pairs, wrapped-asset
pegs. When one diverges from its fair value, bet on convergence.

- **Not risk-free**: real inventory, and the relationship can break (a depeg becomes permanent).
- Needs a fair-value model and inventory/risk management, not just speed. Closest to classic
  quant trading.

## 6. Funding-rate / basis strategies (perps)

Perpetual futures (Drift, Jupiter Perps) pay a **funding rate** between longs and shorts to keep
the perp near spot. Hold spot, short the perp, collect funding while price-neutral
(**cash-and-carry**). No speed race; the skill is staying hedged and surviving funding flips and
liquidation on the short leg.

## 7. Launchpad sniping

Bonding-curve launchpads (pump.fun, Raydium LaunchLab, Bonk.fun, Meteora DBC) create hundreds of
tokens an hour. Snipers buy in the creation slot or at graduation, before organic flow. Latency
matters more here than almost anywhere, but so does filtering: most launches go to zero, and the
counterparties are often the deployers themselves.

## 8. Yield strategies (lowest-touch)

Staking and liquid staking, lending supply, LP fees, incentive tokens, leveraged looping. Deposit
capital, earn a return. Lowest effort, exposed to smart-contract risk, incentive dilution and
(for LPs) impermanent loss. Returns come from carrying risk, not from skill.

## 9. Directional / swing trading

A bet on price direction over hours to weeks. No structural edge; the edge must come from
information, models or discipline. Least relevant to a systematic bot; included for completeness.

---

## How they stack up

| Strategy | Risk-free? | Speed-critical? | Reuses arb infra? | Effort |
|---|---|---|---|---|
| Arbitrage | ~Yes (atomic) | Very | — | Med |
| Liquidations | ~Yes | Very | **Heavily** | Med |
| JIT liquidity | ~Yes | Very | Heavily | High |
| Launchpad sniping | No (inventory) | Very | Heavily | Med |
| Market making | No (inventory) | Yes | Partially | High |
| Stat arb | No | Somewhat | Partially | High |
| Funding/basis | Low | No | Little | Med |
| Yield | No (SC risk) | No | Little | Low |
| Directional | No | No | Little | Low |

## Takeaway

The standout for an existing arb stack is **liquidations**: the same speed-race shape as
arbitrage and almost the entire stack reused (price and oracle feeds, latency-optimised
execution, priority-fee bidding). **JIT liquidity** and **backrunning** are the next step up and
combine arb detection with market-making mechanics. Everything from market making onwards adds
inventory risk, and everything from stat arb onwards trades speed for a model.

## Related docs

- [state-of-solana-mev.md](../state-of-solana-mev.md): who extracts what on Solana today, the
  numbers, the infrastructure players and where the edges are moving.
- [solana-block-building.md](../solana-block-building.md): how Jito, BAM, Harmonic and plain Agave
  order transactions, and what that means for bidding.
