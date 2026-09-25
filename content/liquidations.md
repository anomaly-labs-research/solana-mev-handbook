# Liquidations, In Depth

_As of Sep 2026._

Liquidation is the one MEV strategy the protocols *want* you to run. A lending market cannot survive without someone willing to buy bad collateral the moment it goes bad, so every lender publishes a bounty and lets anyone claim it. The strategy is simple to state: notice a loan has gone underwater before anyone else does, repay part of it, keep the discounted collateral. Everything hard about it is in the words "before anyone else does."

<!-- only: beginner -->

## In plain terms

**What it is.** A lending protocol is a program that lets anyone borrow one token by locking up more than its value in another token. Nobody checks who you are, so the locked tokens, called **collateral**, are the lender's only guarantee. If their price falls too far, the protocol lets any stranger step in: repay part of the loan and take collateral worth a little more than what they repaid. That extra is the **liquidation bonus**, and the strangers who collect it are **liquidators**. This page is about being one of them.

**A tiny example.** Alice locks up 100 SOL worth $20,000 and borrows 14,000 USDC, a token pegged to the dollar. The rule is that her debt may not exceed 80 percent of her collateral's value. SOL falls to $170, her collateral is worth $17,000, and her debt is 82 percent of that: over the line. You repay 2,800 USDC of her debt and receive $2,940 of her SOL, a 5 percent bonus, so $140 gross. After the protocol keeps a slice, you sell the SOL, and you pay to have your transaction placed ahead of the other bots, you are left with something like $40 to $90. On the newest Solana lenders the bonus is 0.1 percent instead of 5 percent, so the same event pays $2.80.

**Why the protocols want you.** A lender nobody liquidates ends up with loans worth more than the collateral behind them, and depositors eat the loss. So liquidation is the one kind of MEV that protocols advertise and pay for. Racing other liquidators is the design; using a relationship with a block producer to hold back a borrower's top-up, or to cut ahead of a rival in the same block, is not.

**Why it is hard.** Everything is public: every loan, the price at which it can be liquidated, and the size of the bonus. The price feed everyone watches, called an **oracle** (a service that posts real-world prices onto the chain), updates several times a second and every bot sees it at the same moment. The only thing that separates liquidators is who gets a transaction into the block first: fast hardware, a short path to the block producer, and a tip bid. In Kamino's October 2025 crash 114 liquidators took part and a handful handled most of the volume. The prizes are also shrinking: Kamino and Jupiter Lend now charge borrowers as little as 0.1 percent, so this is a volume business where the cost of each transaction decides who survives.

**Who wins, who pays.** The borrower pays the bonus out of their collateral. A slice goes to the protocol or its insurance fund. The liquidator keeps the rest, minus the validator tip and whatever is lost selling the seized tokens into a market that is, by definition, falling. Most of a year's income arrives in a few hours of crashes, when everyone's positions cross the line at once.

**What can go wrong.** You win the race, but the seized token keeps falling before you can sell it. The collateral is worth less than the debt by the time anyone reacts, so there is no bonus left; that is **bad debt**. The oracle price you acted on is already stale. You pay a tip and lose anyway. Or the protocol changes the rules mid-crash: pauses liquidations, or, as Solend's governance did in 2022, votes to take over a whale's account directly.

**Terms you will meet on this page.** **LTV** (loan-to-value) is debt divided by collateral value. The **liquidation threshold** is the LTV at which liquidation is allowed. A **health factor** is the same idea as one number, healthy above 1. The **close factor** is how much of the debt one liquidation may repay. A **flash loan** is an uncollateralized loan repaid within the same transaction, which is how liquidators work with almost no capital. **Atomic** means all-or-nothing: the transaction either fully succeeds or leaves no trace. A **slot** is Solana's block interval, a quarter of a second. A **Jito bundle** is a package of transactions that lands in order or not at all, with a tip attached. An **LST** (liquid staking token) is a tradeable token that represents staked SOL and slowly gains value from staking rewards.

**Bottom line.** Liquidation is the friendliest kind of MEV, because protocols need it and pay for it, and one of the least forgiving to run, because everything is public and only speed separates you from the crowd. It reuses almost the whole arbitrage stack, and the bounty keeps shrinking as the crowd grows.

<!-- /only -->

## The core idea: overcollateralized lending

A DeFi lender does not know who you are, so it only lends against collateral worth *more* than the loan. Three numbers describe every loan:

- **Loan-to-value (LTV)** = debt value / collateral value. Borrow 14,000 USDC against $20,000 of SOL and your LTV is 70%.
- **Max LTV** (also "collateral factor") — the most you can borrow at origination. Above this you can't *open* more debt, but nothing bad happens yet.
- **Liquidation threshold** (Kamino calls it "liquidation LTV", Fluid "LT") — the LTV at which anyone may start seizing your collateral. Always set above max LTV, so there's a buffer.

<!-- level: intermediate -->

Some protocols express the same thing as a **health factor**: risk-weighted collateral divided by risk-weighted debt, healthy above 1, liquidatable below. MarginFi's version is `Σ deposits × asset_weight × price` over `Σ borrows × liability_weight × price`, where asset weights are below 1 (SOL at 0.80 means $1,000 of SOL counts as $800) and liability weights are above 1. Same idea, different arithmetic.

<!-- /level -->

Two things push a position toward the threshold: collateral price falling, and interest silently accruing on the debt. Kamino's docs give the second a number — at 10% APR a position drifts from 70% to 77% LTV in a year with zero price movement.

## The liquidation mechanic

<!-- level: intermediate -->

When a position crosses the threshold, any wallet may call the protocol's liquidate instruction. The liquidator hands over some of the borrowed asset, the protocol reduces the borrower's debt by that amount, and pays the liquidator back in collateral worth *more* than what they repaid. Three dials govern it:

- **Close factor** — the maximum fraction of the debt one liquidation can repay. Save uses 20%, Kamino defaults to 20–25% and drops to 10% increments on some markets, Fluid-style engines liquidate only what is needed to restore health (Fluid claims "closer to 5% of debt"). Partial liquidation exists to protect borrowers: it gives them a chance to top up between rounds instead of losing everything. Most protocols raise the close factor to 100% for dust positions or when LTV is so high the position is near insolvency (Kamino: around 95% LTV).
- **Liquidation bonus** (borrower's view: **liquidation penalty**) — the discount at which the liquidator buys collateral. MarginFi: 5%. Save: 5%. Kamino: a curve from 1% up to 10%+ depending on asset and how deep the breach is, with the floor cut to as low as 0.1% in September 2025. Jupiter Lend / Fluid: "as low as 0.1%".
- **Protocol fee share** — the slice of the bonus the protocol keeps. MarginFi splits its 5% evenly: 2.5% to the liquidator, 2.5% to the insurance fund. Kamino has a per-reserve `protocolLiquidationFeePct` and the liquidator gets the remainder. Velocity (ex-Drift) has three per-market rates: liquidator fee, insurance fund fee, protocol liquidation fee.

Everything else — oracles, flash loans, ticks, bundles — is machinery for collecting that bonus faster and cheaper than the next bot.

## A worked example

<!-- level: intermediate -->

Alice deposits 100 SOL at $200 ($20,000) and borrows 14,000 USDC. LTV 70%. Say the reserve's liquidation threshold is 80% and the bonus is 5%.

Her liquidation price is where debt / collateral = 80%: 14,000 / (0.8 × 100) = **$175**. SOL drops to $170. Collateral is now $17,000, LTV is 82.4%, and she is liquidatable.

You call liquidate with a 20% close factor:

| Step | Amount |
|---|---|
| Debt you repay | 20% × 14,000 = 2,800 USDC |
| Collateral you receive | 2,800 × 1.05 = $2,940 of SOL = 17.29 SOL |
| Gross bonus | $140 |
| Protocol's share (say 20% of bonus) | −$28 |
| Sell 17.29 SOL via Jupiter, ~0.1% slippage | −$3 |
| Priority fee / Jito tip to win the slot | −$20 to −$70 |
| **Your net** | **~$40–90** |

Alice is left with 82.71 SOL ($14,060) and 11,200 USDC of debt — LTV 79.7%, just under the threshold. If SOL drops another dollar, round two.

Now redo the table with a 0.1% penalty (Jupiter Lend, or Kamino's new floor on major assets): gross bonus on $2,800 repaid is **$2.80**. That single number explains the shape of the business in 2026. Liquidation is no longer a bounty-hunting game with fat prizes; it's a volume game where execution cost per event — compute, oracle update, swap slippage, tip — decides who survives.

## Why it's a speed race

<!-- level: intermediate -->

The bonus is fixed by the protocol, and every position's liquidation price is public. So the *only* thing that differentiates liquidators is who lands first once a position crosses. Every other participant sees the same oracle print in the same slot; the winner is whoever had the transaction built, signed and in the leader's queue.

Three details make it especially tight on Solana:

- **Slots are 250ms** (400ms until August 2026, then cut in 50ms steps to 250ms on 18 September 2026, epoch 1037; 200ms is the next planned step). A position that becomes liquidatable in slot N is usually gone by slot N+1. There's no mempool to watch, so the "proactive" strategy from Ethereum (watching pending transactions that will *create* a liquidation) mostly doesn't exist. You react to state.
- **Partial liquidation splits the prize.** With a 20% close factor and a scaling bonus, the first liquidator takes the cheapest, safest slice. Deeper rounds pay more bonus but the collateral is now falling in a falling market.
- **Oracle cadence is the clock.** Pyth prices update every 400ms on Pythnet; the race starts the moment a price update that puts a position underwater can be posted on-chain. Whoever posts that update *and* the liquidate call in one transaction moves first (see oracles below).

Kamino's October 10, 2025 post-mortem shows the field: 114 distinct liquidators participated during the crash, 4 processed more than $1M each, 28 more than $100k. The head of the distribution took most of the volume.

## The liquidator's workflow

<!-- level: intermediate -->

1. **Index every position.** Pull all obligations / margin accounts / vault positions for the markets you cover and keep them in memory, updated by account subscriptions. For each one, precompute the liquidation price of each collateral asset holding the others fixed.
2. **Watch the oracles, not the positions.** Positions don't move; prices do. Subscribe to Pyth (Hermes) and Switchboard feeds and to the on-chain price accounts. On every tick, walk the sorted list of liquidation prices and pull out any position that just crossed.
3. **Simulate.** Compute the exact repay amount under the close factor, the collateral you'll receive under the bonus rule, the swap route to unwind it, and the all-in cost. Skip anything where net is negative after tip.
4. **Get capital.** Either hold inventory of the debt assets (mostly USDC/USDT/SOL) or flash-borrow them in the same transaction.
5. **Win the slot.** Build one atomic transaction: (optional) post price update → flash borrow → liquidate → swap collateral to debt asset → flash repay → tip. Submit via Jito bundle or with a priority fee sized to the expected profit. Everything reverts if anything fails, so you never end up holding half a trade.
6. **Decide what to hold.** If the collateral is an LST or stablecoin you want anyway, keep it and skip the swap; you save slippage but take price risk until you unwind.

## Oracles define the race

<!-- level: intermediate -->

Every liquidation is triggered by an oracle print, so oracle design *is* liquidation design.

**Pyth pull oracles.** Pyth aggregates publisher prices on Pythnet every 400ms and exposes signed updates through the Hermes API. Nobody pushes them on-chain by default: the consumer fetches an update, posts it in a price-update account and reads it in the same transaction. Programs then verify freshness with `get_price_no_older_than(max_age)` — Pyth's example uses 30 seconds. Two consequences for liquidators: you can carry your own trigger price into the transaction, and if you don't, you're waiting for someone else's update. Pyth's own best-practices page is blunt about the resulting edge: "adversaries see price changes a short time before the protocol does." (Since August 26, 2026 the recommended Hermes endpoint is `pyth.dourolabs.app/hermes`, not `hermes.pyth.network`.)

<!-- level: expert -->

**Confidence intervals.** Pyth publishes each price as μ ± σ. The recommended lending pattern is asymmetric: value collateral at the lower bound (μ − σ) and debt at the upper bound (μ + σ). MarginFi does exactly this and additionally clamps or aborts if the interval exceeds 5% of price. For a liquidator this means the effective liquidation price during volatile moments is *worse* for the borrower than the headline price — positions cross earlier — and that a spike in σ can create or destroy an opportunity without the mid moving.

<!-- /level -->

**Switchboard.** Also pull-based, TEE-attested, with "managed update instructions" you include in your own transaction. Its distinctive feature for lenders is custom feeds: an LST feed can compute fair value from the stake pool instead of reading a DEX price.

**LST pricing.** jitoSOL, mSOL, JupSOL and friends are the dominant collateral in leveraged SOL loops. Kamino prices them by **stake rate** — `SOL_staked / LST_minted` — not market price. That number only rises (epoch rewards accrue), so a DEX depeg does not trigger liquidations on Kamino. The flip side: a stake-pool exploit would show up in the rate and liquidate everything correctly, but a 5% market discount is invisible to the protocol even though it's very visible to the liquidator who has to *sell* the seized LST. Watch for the gap between protocol price and realizable price; it's where LST liquidations lose money.

**TWAP guards.** Several protocols compare spot oracle against a TWAP and disable *borrowing* when they diverge (Kamino's SOL reserve used a 10% tolerance). Velocity rejects liquidations if oracle and 5-minute TWAP diverge by 50% or more. A third-party analysis of the Oct 10, 2025 crash argued Kamino's TWAP tolerance blocked new borrows but did not gate liquidations, and estimated ~$1.08M of liquidations fired at flash-crash prices on positions that were healthy at TWAP (their estimate, not Kamino's). Whether that's a bug or the design, it's the kind of parameter you must read per protocol.

## Flash loans and unwinding collateral

<!-- level: intermediate -->

You don't need capital to liquidate on Solana — you need a flash loan and an atomic transaction.

| Protocol | Flash loan | Notes |
|---|---|---|
| Kamino | `flashBorrowReserveLiquidity` / `flashRepayReserveLiquidity` | Repay ix must reference the borrow ix index; fee 0 on many assets, ~0.001% on USDC/USDT/WSOL |
| MarginFi / Project 0 | Start/end flashloan pair around your instructions | Zero-fee; account health is checked at the end |
| Save (Solend) | `FlashBorrowReserveLiquidity` / `FlashRepayReserveLiquidity` | Fee to reserve fee receiver plus host fee; docs flag the implementation as limited pending a reentrancy-safe rewrite |
| Jupiter Lend | Liquidity-layer borrowing; no separate flash primitive documented (unverified) | The liquidate itself is designed to be routed as a swap via aggregators |

The canonical transaction is: flash borrow debt asset → liquidate → swap seized collateral back to debt asset through Jupiter's aggregator → repay flash loan → keep the difference. Jupiter matters because the collateral you seize is whatever the borrower posted — a long-tail token, an LST, JLP — and you need the best route to USDC in the same slot. Fluid took this idea one step further: its liquidate call is shaped like a swap (pay debt token, receive collateral at a discount) so aggregators can treat the lending protocol as just another AMM and route *through* liquidations.

## The Solana lenders compared

<!-- level: intermediate -->

| | Kamino Lend | MarginFi / Project 0 | Save (ex-Solend) | Drift → Velocity | Jupiter Lend (Fluid) |
|---|---|---|---|---|---|
| Position unit | Obligation | Margin account | Obligation | Cross-margined subaccount | Tick-based vault position (NFT) |
| Threshold | Liquidation LTV per reserve; eMode groups | Health < 0 at maintenance weights | Weighted liquidation threshold | Collateral < maintenance margin | LT (~90%) and LML (~95%) |
| Close factor | 20–25% default, 10% on some, 100% near insolvency | Only enough to restore health | 20% | Ramped partial liquidation to a 2%-of-notional buffer | Only what is needed; 100% absorb past LML |
| Bonus / penalty | Curve: min → max with breach depth; floor cut to 0.1% Sep 2025 | 5% (2.5% liquidator, 2.5% insurance) | 5% | Per-market liquidator + IF + protocol fee; fee ages upward | As low as 0.1% |
| Oracle | Pyth, Switchboard, stake-rate for LSTs | Pyth/Switchboard, μ±σ pricing | Pyth/Switchboard | Oracle only, 5-min TWAP band | Pyth |
| Scale (2026) | Second by deposits since Sep 2026; ~$1.4B TVL plus ~$1.05B borrowed (DefiLlama) | Sharply reduced after 2025 (~$48M TVL) | ~$95M TVL | Relaunching after Apr 2026 exploit | $2.41B deposits, ~$1.05B loans (unverified) |

<!-- level: expert -->

**Kamino Lend.** The position is an **obligation** holding multiple deposits and borrows. Reserves can be placed in **elevation groups (eMode)** for correlated pairs: SOL/USDC standard at ~75% max LTV, LST/SOL eMode at ~87–90% (up to ~10x leverage). A **borrow factor** scales risky debt (BONK at 2.0 halves borrowing capacity). The bonus formula is the interesting part: `bonus = max(minBonus, currentLTV − liquidationLTV)`, capped at the reserve max and then at `100% − currentLTV` so the liquidation can't itself create bad debt; at LTV ≥ 99% it switches to a ~1% bad-debt bonus for full recovery. So a position 0.5% over the line pays the floor; one 8% over pays 8%. **Auto-deleverage** is a separate mechanism: when a reserve's deposit or borrow cap is cut, borrowers get notice (docs cite 72 hours), then a `deleverage_liquidation_LTV` that decays over time makes positions liquidatable from highest LTV down, with a penalty floored at 50 bps and capped at the lowest liquidation penalty among the position's assets. Market owners also have a `price_triggered_liquidation_disabled` switch for oracle incidents.

<!-- /level -->

**MarginFi / Project 0.** Health is weighted assets minus weighted liabilities using maintenance weights and confidence-adjusted prices. Liquidation repays the minimum needed to bring health back to zero, charging 5% split between liquidator and insurance fund. MarginFi's Q1 2025 was the largest liquidation quarter any Solana lender has published: $1.7B across 119,000+ events and $88.5M in fees, with $517M across ~9,700 events in the single week of Feb 17–23 as SOL fell from its ~$295 January high. In 2026 the protocol was folded into **Project 0**, a cross-venue prime-broker design; marginfi runs as a venue on it with much lower TVL than its peak.

**Save (formerly Solend).** The original Solana lender and the simplest mechanics: 20% close factor, 5% bonus, isolated pools after the 2024 rebrand. Its docs' worked example is the template everyone copies (repay $1,600, receive $1,680). Roughly $95M TVL (DefiLlama, Sep 2026) and a declining share.

**Drift → Velocity.** Drift's spot borrows and perps were **cross-margined** in one subaccount, so a liquidation was computed at account level: cancel open orders first, then transfer asset/liability pairs to the liquidator at oracle price plus a per-market liquidator fee, with a separate insurance-fund fee. Insolvent remainders went to the insurance fund, then social loss. On April 1, 2026 Drift lost ~$285M when attackers who had socially engineered Security Council members into pre-signing durable-nonce transactions took admin control, whitelisted a fake token as collateral and withdrew real assets. The protocol rebranded to **Velocity** on July 1, 2026 and is relaunching. Velocity's documented engine keeps the Drift shape and adds: partial liquidation to maintenance *plus a 2%-of-notional buffer*, a ramp from a configured fraction of the shortfall to 100% over a set duration, a liquidator fee that ages up 0.01 bp per 400ms after a 600-second grace (capped at 3× base or the maintenance ratio), and rejection when oracle and 5-minute TWAP diverge ≥ 50%.

## Jupiter Lend and the Fluid design

<!-- level: intermediate -->

Jupiter Lend launched in August 2025 as a port of Instadapp's **Fluid**, hit $500M TVL in 24 hours, $1B in 8 days, ~35% of Solana lending by December 2025, and $2.41B in deposits by September 22, 2026. It changed the liquidation business on Solana more than anything since Kamino launched, for one reason: **positions are not liquidated individually.**

- **Ticks.** Each vault (one collateral, one debt asset) stores positions on a grid of ticks representing collateral/debt ratios, borrowed from Uniswap v3's range accounting. Your position is an NFT that records its tick.
- **Liquidation threshold vs. max limit.** Two lines per vault: the **liquidation threshold** (LT, ~90% on major vaults) where liquidation may begin, and the **liquidation max limit** (LML, ~95%) past which the position is 100% liquidated. Between them, liquidation takes only what's needed to bring the tick back to health.
- **Branches and one liquidate call.** When price moves, every tick above the new liquidation line is underwater. A liquidator calls `liquidate` on the *vault*, paying debt token and receiving collateral; the engine walks ticks and records the result in a **branch** — an accumulator that tracks which ticks were partially liquidated and by how much — without ever touching an individual position. Positions learn their post-liquidation state lazily, the next time the owner interacts. One call clears hundreds of positions.
- **Absorb.** Positions past the max limit are pulled into the protocol's own book via an `absorb` flag; a liquidator can then buy that absorbed debt/collateral in the same swap-like call.
- **Penalty.** Fluid advertises penalties "as low as 0.1%" versus the industry's 5–10%, and partial liquidation of ~5% of debt versus 50–100%, and on Ethereum a liquidation cost of ~150k gas versus 300k–1M for a single-position liquidation on Aave-style protocols. On Solana the analogue is compute units and account count per position, and the batch design is why one bot can clear a whole vault in a slot.

The competitive effect was immediate: Kamino's TVL slipped in Jupiter Lend's first week and on September 1, 2025 Kamino cut liquidation penalties from 1% to as low as 0.1% and moved to 10% liquidation increments. For liquidators, the two effects compound: bonuses are smaller *and* the work per event is smaller, so the winners are the ones with the lowest per-transaction cost and the fastest oracle-to-submission path.

## What the data says

<!-- level: intermediate -->

- **Oct 10, 2025** — SOL fell from $207 to $177 in under an hour (intraday $220 → $177) inside a ~$19.5B crypto-wide liquidation day. Kamino liquidated $20M of collateral across 8,000+ events and 1,700 wallets with zero bad debt; 89.5% of events landed in the single crash hour; liquidators earned ~$260k in total; median borrower loss was 0.07% of position. SOL was 58% of seized collateral, jitoSOL 9.4%; USDC was 76% of repaid debt. USDC borrow rates spiked to 45%. Jupiter Lend processed ~$1.29M (third-party figure). Solana sustained 6–10k TPS with median fees around $0.007.
- **Feb 2025** — MarginFi's $517M week and $1.7B quarter, above.
- **June 2022, Solend whale** — one wallet held 5.7M SOL (95% of the SOL pool) against ~$108M of stablecoin debt (88% of USDC borrows), liquidatable at SOL = $22.30. With a 20% close factor that meant ~$21M of SOL dumped on DEXes in one round, which the team feared would cascade and jam the chain. Governance passed "SLND1" emergency powers to take over the account (97.5% yes on 1.13% quorum), then reversed it in SLND2 (99.8%) after the backlash; the whale eventually moved ~$25M of debt to Mango. Lesson: liquidation size relative to venue depth is a systemic parameter, and liquidators who *can* absorb size without slippage have a moat.
- **Oct 2022, Mango Markets** — with ~$10M USDC across two accounts, the attacker pumped thinly traded MNGO from ~$0.02 to ~$0.91 in about ten minutes, Pyth/Switchboard faithfully reported it, the inflated collateral was borrowed against and ~$116M was drained. Mango's line was that "the oracle price reporting worked as it should have." The oracle wasn't wrong; the collateral was un-liquidatable at that size. Avraham Eisenberg was charged by the SEC, CFTC and DOJ.
- **Ethereum baseline** — Pyth's analysis of Aave/Compound found ~$2.5B of collateral liquidated with ~$150M paid in incentives, 90% of volume at a 4–5.25% premium, and a 2021 academic study concluded existing designs "well incentivize liquidators but sell excessive amounts of discounted collateral at the borrowers' expense." The 2025–26 Solana move to sub-1% penalties is a direct response to that critique.

## Risks

1. **Competition compresses margins to cost.** The bonus is public; entrants keep bidding tips until net profit approaches zero. Kamino's Oct 2025 numbers — $260k of fees on $20M of collateral, spread over 114 liquidators — are 1.3% gross before tips and slippage.
2. **Collateral falls while you hold it.** Liquidations cluster in crashes. If you don't swap atomically, you are long the exact asset that is crashing; a 5% bonus disappears in one more red candle.
3. **Bad debt.** If collateral value drops below debt before anyone liquidates (gap move, thin market, oracle pause), the last liquidator faces a position with no bonus. Protocols handle the remainder with insurance funds or socialized loss; you handle it by not being the one holding the bag.
4. **Oracle latency and staleness.** You may liquidate against a stale-but-valid price and sell into a market that already moved. Or your own transaction fails the `max_age` check because the update you attached is too old by the time you land.
5. **Being griefed by partial liquidation.** Small close factors and scaling bonuses mean the first slice pays the least. Bots that only chase the deep-breach, high-bonus rounds are chasing collateral in free fall.
6. **Failed transactions still cost.** Priority fees are paid whether or not you win; on Solana a reverted transaction is cheap in lamports but you also lose the Jito tip if the bundle lands and your liquidate errors mid-bundle after a competitor's. Model your win rate honestly.
7. **Realizable vs. protocol price.** Stake-rate-priced LSTs, JLP and long-tail tokens may be worth less on Jupiter than the protocol says they're worth. The bonus must cover that gap.
8. **Protocol-level surprises.** Liquidation-disable switches, TWAP bands, auto-deleverage schedules and governance interventions (Solend) can all change or halt the game mid-crash.

## Toxic vs. benign: protocol-sanctioned MEV

MEV research generally sorts extraction into toxic (sandwiches, frontrunning — value taken *from* a user who did nothing wrong) and benign (arbitrage, backruns, liquidations — value the system needs someone to collect). The Flashbots classification puts liquidation squarely in the benign bucket with one caveat: it stays benign "as long as it doesn't involve frontrunning someone else's attempt to liquidate, or censoring a tx attempting to recollateralize."

That caveat is the whole ethical line on Solana. Racing other liquidators to a public opportunity is the design. Using a validator relationship to drop a borrower's top-up transaction, or to reorder your liquidate ahead of theirs in the same slot, is not. The protocol *pays* you the bonus precisely because it wants a competitive, permissionless liquidator set — which is also why the bonus keeps shrinking as that set gets more competitive.

## A realistic scorecard

| Dimension | Reality |
|---|---|
| Edge source | Speed (oracle-to-land latency), capital efficiency, low per-tx cost, good swap routing for odd collateral |
| Gross margin | 0.1–5% of repaid debt depending on protocol and breach depth; shrinking |
| Net margin | Gross minus protocol share, tip, slippage, failed-tx cost; often 20–60% of gross for the top few bots, near zero below that |
| Revenue shape | Extremely lumpy — most annual revenue arrives in a handful of crash hours |
| Capital needed | Near zero with flash loans; inventory helps land faster and skip the swap leg |
| Directional risk | None if atomic; full if you hold seized collateral |
| Tail risk | Bad debt rounds, oracle incidents, protocol halts |
| Competitive moat | Weak on any one protocol; stronger across many (each has different math and instruction shape) |
| Regulatory / reputational | Cleanest MEV category — sanctioned by design, as long as you don't frontrun or censor |

## How this connects to the rest of the stack

<!-- level: intermediate -->

Liquidation is the same machine as arbitrage pointed at a different target:

- **Same speed race, same clock.** Arb reacts to a pool price moving away from fair; liquidation reacts to an oracle price moving a position past its threshold. Both are decided in the 250ms slot in which the state changes, both are won by whoever has the transaction built before the trigger fires, and both die if you're one slot late.
- **Same oracle feeds.** The Pyth and Switchboard subscriptions an arb engine already runs to know "true" price are exactly the trigger feeds a liquidator needs — plus one twist: for liquidations you also care about the *on-chain* price account, because that, not Hermes, is what the protocol reads. The gap between the two is your lead time.
- **Same bidding problem.** Priority fees and Jito tips are set against expected profit in both. Liquidation profit is more predictable (the bonus is a formula) but more contested (everyone computes the same formula), so tips as a share of gross tend to run higher.
- **Same unwind leg.** Seized collateral is an inventory problem identical to the leg of an arb you haven't closed yet, and the swap router that finds the best USDC exit for a stray token serves both.
- **Adverse selection, inverted.** In market making you are the passive party eating informed flow. In liquidation *you* are the informed party, and the borrower is the one who couldn't move fast enough. Understanding one side makes the other legible.

---

## Where to go next

<!-- level: expert -->

- **Per-protocol instruction shapes and account lists** — the doc above is deliberately about mechanics; landing requires knowing each program's accounts.
- **Oracle-to-submission latency measurement** — how far ahead of the on-chain price account your Hermes feed runs, per feed.
- **Tick/branch liquidation math in Fluid** — worth deriving by hand once; it's where the batch efficiency comes from.
- **Insurance-fund and bad-debt handling across protocols** — what happens to the last liquidator in a gap move.

## Sources

- Kamino Docs — Liquidations (curators): https://kamino.com/docs/curators/markets/liquidations
- Kamino Docs — Borrow concepts (LTV, eMode, borrow factor): https://kamino.com/docs/products/borrow/concepts
- Kamino Docs — Automated deleverage: https://docs.kamino.finance/risk/protocol-mechanisms/automated-deleverage
- Kamino Docs — LST oracles: https://kamino.com/docs/security/oracles/lst-oracles
- Kamino Docs — Flash loans: https://kamino.com/docs/build/borrow/multiply/flash-loans
- Kamino Forum — Risk event analysis, 10 October 2025: https://gov.kamino.finance/t/kamino-lend-risk-event-analysis-10th-of-october-2025/847
- SolanaFloor — Kamino drops liquidation penalties 90% as Jupiter Lend grows: https://solanafloor.com/news/kamino-drops-liquidation-penalties-90-jupiter-lend-grows
- kbrandwijk — Kamino Lend's TWAP promise that doesn't apply when it matters (third-party analysis): https://dev.to/kbrandwijk/kamino-lends-3-billion-twap-promise-that-doesnt-apply-when-it-matters-1ib2
- marginfi-v2 README (health, weights, confidence, fees): https://github.com/mrgnlabs/marginfi-v2
- Solana Internals — How marginfi works: https://paragraph.com/@solanainternals/how-marginfi-works-a-mechanism-analysis-of-solanas-leading-lending-protocol
- SmartyMetrics — MarginFi in Q1 2025: https://medium.com/@smartymetrics/a-look-into-marginfis-profitability-amidst-the-chaos-of-q1-2025-ba8b7a381185
- Save Docs — Liquidations: https://docs.save.finance/getting-started/liquidations
- Save Docs — Flash loans: https://docs.save.finance/developers/flash-loans
- Velocity (ex-Drift) Docs — Liquidation engine: https://docs.velocity.exchange/protocol/trading/liquidations/liquidation-engine
- Velocity (ex-Drift) Docs — Liquidators: https://docs.velocity.exchange/protocol/trading/liquidations/liquidators
- The Defiant — Drift rebrands to Velocity DEX: https://thedefiant.io/news/defi/drift-protocol-rebrands-to-velocity-dex-ahead-of-relaunch
- Chainalysis — Lessons from the Drift hack: https://www.chainalysis.com/blog/lessons-from-the-drift-hack/
- Jupiter Developers — Lend borrow (CF, LT, max liquidation threshold, ticks): https://developers.jup.ag/docs/lend/borrow
- Jupiter Developers — Lend liquidation (`getLiquidateIx`, absorb): https://developers.jup.ag/docs/lend/liquidation
- Code4rena — Jupiter Lend audit, Feb 2026: https://code4rena.com/audits/2026-02-jupiter-lend
- Fluid — Introducing Fluid (gas, penalty, batch liquidation claims): https://fluid.io/blog/protocol-introducing-fluid
- MixBytes — Modern DeFi lending protocols: Fluid Vault (ticks, branches, absorb): https://mixbytes.io/blog/modern-defi-lending-protocols-how-its-made-fluid-vault
- Kairos Research — Jupiter Lend, an emerging pillar: https://www.kairosresear.ch/p/jupiter-lend-an-emerging-pillar-in
- Solana Compass — Jupiter Lend hits $2.41B deposits: https://solanacompass.com/news/jupiter-lend-hits-241-billion-in-total-deposits-a-new-all-time-high
- DefiLlama — Kamino Lend, Save, marginfi TVL (Sep 2026 figures): https://defillama.com/protocol/kamino-lend, https://defillama.com/protocol/save, https://defillama.com/protocol/marginfi
- Solana Compass — Solana 250ms slot time goes live at epoch 1037 (18 September 2026): https://solanacompass.com/news/solana-activates-250ms-slot-time-at-epoch-1037-fourth-step-of-simd-0525
- Pyth Docs — Pull updates: https://docs.pyth.network/price-feeds/pull-updates
- Pyth Docs — Best practices (confidence, staleness, latency): https://docs.pyth.network/price-feeds/core/best-practices
- Pyth Docs — Using real-time data in Solana programs: https://docs.pyth.network/price-feeds/use-real-time-data/solana
- Pyth Blog — Confidence intervals primer: https://www.pyth.network/blog/pyth-primer-dont-be-pretty-confident-be-pyth-confident
- Pyth Blog — Value leakage and fragmentation in liquidations: https://www.pyth.network/blog/value-leakage-and-fragmentation-in-liquidations
- Switchboard Docs — Solana/SVM feeds and LST fair value: https://docs.switchboard.xyz/product-documentation/data-feeds/solana-svm/part-2-deploying-your-feed-on-chain
- Flashbots Collective — On the toxicity classification of MEV transactions: https://collective.flashbots.net/t/on-the-toxicity-classification-of-mev-transactions/521
- Qin, Zhou, Gamito, Jovanovic, Gervais — An Empirical Study of DeFi Liquidations (2021): https://arxiv.org/abs/2106.06389
- CoinDesk — How market manipulation led to the Mango exploit: https://www.coindesk.com/markets/2022/10/12/how-market-manipulation-led-to-a-100m-exploit-on-solana-defi-exchange-mango
- CoinDesk — Solend whale liquidation crisis and second vote: https://www.coindesk.com/business/2022/06/20/solends-whale-liquidation-crisis-prompts-second-vote-to-reverse-emergency-powers
- RockawayX — Solana proves resilient during the largest crypto liquidation on record: https://www.rockawayx.com/insights/solana-proves-resilient-during-the-largest-crypto-liquidation-on-record
- RPC Fast — Jito explained: bundles, tips and Solana MEV: https://rpcfast.com/blog/jito-explained-bundles-tips-mev-solana
