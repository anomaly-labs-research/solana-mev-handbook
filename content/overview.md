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

<!-- only: beginner -->

## In plain terms

**What this page is.** Nine ways people make money trading on Solana, ordered by how much of an arbitrage bot each reuses: the first few are the same speed race pointed at different targets, the last few are ordinary investing. Each has its own in-depth page; this is the one-breath version.

**Arbitrage.** The same token is priced differently in two places. Buy where it is cheap, sell where it is dear, and put both steps in one transaction that cancels itself unless it ends in profit. Almost no risk on the trade itself, but thousands of bots race for the same gaps and the winners hand much of their profit to the block producer as a tip. Everything else is measured against it.

**Liquidations.** Lending protocols let people borrow against locked-up tokens. When the tokens fall in value and the loan gets too big relative to them, anyone may repay part of the loan and take the locked tokens at a small discount. The discount is set by the protocol, so the only contest is who lands first: the arbitrage race with a price feed as the starting gun.

**JIT liquidity.** Decentralized exchanges (DEXs) trade out of pools of tokens deposited by liquidity providers (LPs), who earn a fee on every trade. A just-in-time bot sees a large trade coming, drops its own tokens into the pool right before it, collects that one fee, and pulls them out right after. The trader gets a better price; the regular LPs lose the fee. It needs to see the trade early.

**Market making.** Post a price to buy at and a price to sell at, and pocket the gap when people who just want to trade hit either one. The danger is trading against people who know something you do not, so you buy just before the price falls (adverse selection). On Solana the block interval limits how fast you can update prices, a handicap against centralized exchanges.

**Statistical arbitrage.** Two assets that should move together sometimes drift apart. A liquid staking token (staked SOL in tradeable form) should be worth SOL plus its rewards; two dollar-pegged stablecoins should trade one to one. When a gap opens, bet on it closing. Not risk-free: you hold the assets meanwhile, and sometimes the gap is permanent.

**Funding-rate / basis.** A perpetual future (perp) is a contract that tracks a token's price and never expires. To keep it near the real price, one side pays the other a small periodic fee called funding. Hold the real token, take the opposite position in the perp, and collect funding without caring where the price goes. No speed race; the work is staying balanced, surviving when the payment flips, and not getting liquidated on the perp side.

**Launchpad sniping.** Sites like pump.fun create hundreds of new tokens an hour, priced by a formula that rises as people buy (a bonding curve). Snipers buy in the first fraction of a second after creation. Speed matters more here than almost anywhere, but so does judgment: most launches go to zero, and the seller is often the token's creator.

**Yield.** Stake SOL, lend it out, or deposit it into pools, and collect the return. The least work of the nine. The return is payment for carrying risk: bugs in the code, reward tokens that lose value, and for pool deposits the loss LPs take when prices move.

**Directional trading.** Guess where the price goes over hours or weeks. No built-in edge; any advantage must come from information, a model, or discipline. Included for completeness.

**Terms you will meet on this page.** A **DEX** is an exchange run by a program on the chain. An **LP** deposits tokens into a DEX pool and earns fees. **Atomic** means all-or-nothing within one transaction. A **backrun** is a trade placed immediately after someone else's, to profit from the price move it caused. **LVR** (loss-versus-rebalancing) is the name for what LPs lose to arbitrageurs. An **oracle** posts real-world prices onto the chain. A **liquidation threshold** is the point at which a loan may be liquidated. A **CLOB** is an on-chain order book. A **slot** is Solana's block interval, a quarter of a second. A **tip** pays the validator to place your transaction first. **Impermanent loss** is what an LP loses versus simply holding.

**Bottom line.** The first three are speed races on shared machinery; from market making onward you hold inventory and can lose on the position; from statistical arbitrage onward you trade speed for a model. If you already run an arbitrage bot, liquidations are the nearest neighbour.

<!-- /only -->

## 1. Arbitrage (the baseline)

<!-- level: intermediate -->

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

<!-- level: intermediate -->

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

<!-- level: intermediate -->

A hybrid of MM and MEV. Spot a large swap, add concentrated liquidity in an ultra-tight range
right before it executes, collect the fee from that one trade, withdraw immediately, all in one
bundle. Sniper market making: you are an LP for one slot, so you carry almost no LVR.

- Needs visibility of the swap before it lands (shreds, preconfirmations) and exact ordering.
- Benign-ish: the trader gets a better price, passive LPs lose the fee they would have earned.

## 4. Market making

<!-- level: intermediate -->

Post bids and asks, earn the spread from noise traders, pay adverse selection to informed ones.
On Solana that means an on-chain CLOB (Phoenix, OpenBook, Manifest), perps auctions (Drift JIT),
or passive concentrated-liquidity LPing. The 250 ms slot (400 ms until August 2026, 250 ms since 18 September 2026) bounds how fast
quotes refresh, which is the structural handicap versus a CEX.

## 5. Statistical arbitrage

<!-- level: intermediate -->

Trade mean-reverting relationships between correlated assets. On Solana: liquid staking tokens
(mSOL, jitoSOL, bSOL) that should track SOL plus staking yield, stablecoin pairs, wrapped-asset
pegs. When one diverges from its fair value, bet on convergence.

- **Not risk-free**: real inventory, and the relationship can break (a depeg becomes permanent).
- Needs a fair-value model and inventory/risk management, not just speed. Closest to classic
  quant trading.

## 6. Funding-rate / basis strategies (perps)

<!-- level: intermediate -->

Perpetual futures (Drift, now relaunching as Velocity, and Jupiter Perps) pay a **funding rate** between longs and shorts to keep
the perp near spot. Hold spot, short the perp, collect funding while price-neutral
(**cash-and-carry**). No speed race; the skill is staying hedged and surviving funding flips and
liquidation on the short leg.

## 7. Launchpad sniping

<!-- level: intermediate -->

Bonding-curve launchpads (pump.fun, Raydium LaunchLab, Bonk.fun, Meteora DBC) create hundreds of
tokens an hour. Snipers buy in the creation slot or at graduation, before organic flow. Latency
matters more here than almost anywhere, but so does filtering: most launches go to zero, and the
counterparties are often the deployers themselves.

## 8. Yield strategies (lowest-touch)

<!-- level: intermediate -->

Staking and liquid staking, lending supply, LP fees, incentive tokens, leveraged looping. Deposit
capital, earn a return. Lowest effort, exposed to smart-contract risk, incentive dilution and
(for LPs) impermanent loss. Returns come from carrying risk, not from skill.

## 9. Directional / swing trading

<!-- level: intermediate -->

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

## Sources

- Solana Compass, "Solana 250ms Slot Time Goes Live at Epoch 1037" (18 September 2026): https://solanacompass.com/news/solana-activates-250ms-slot-time-at-epoch-1037-fourth-step-of-simd-0525
- Solana, "Reduced slot times" upgrade page (350ms and 300ms activation dates): https://solana.com/upgrades/reduced-slot-times
