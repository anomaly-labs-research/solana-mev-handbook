# Arbitrage, In Depth

_As of Sep 2026._

Arbitrage is the simplest trade to describe and the most crowded trade in crypto: the same asset is priced differently in two places, so you buy where it's cheap and sell where it's expensive. On Solana most of it happens inside a single transaction, which changes the risk profile completely and turns the whole game into a latency-and-fees contest.

<!-- only: beginner -->

## In plain terms

**What it is.** The same token has two prices in two places. Buy where it is cheap, sell where it is dear, keep the difference. On Solana the "places" are decentralized exchanges (DEXs): pools of tokens that anyone can trade against, with a price set by a formula rather than by a person. When one pool says SOL is worth $100 and another says $102, that $2 gap is the whole opportunity.

**The trick that makes it safe.** On a blockchain you can put both steps, the buy and the sell, inside one transaction and add a rule: cancel everything unless I finish with more money than I started with. So either you make money or nothing happens. This all-or-nothing property is called being **atomic**, and it is why arbitrage is the one trade in this handbook with almost no risk on the trade itself.

**A tiny example.** Two pools each hold about $1 million. One prices SOL at $100, the other at $102. Buying about $3,700 of SOL from the cheap pool and selling it into the dear one nets roughly $28 after fees. Not $74, because every dollar you buy pushes the cheap pool's price up and every dollar you sell pushes the dear pool's price down, and both pools charge a fee. Real Solana arbs are mostly smaller than this: the average winning one earns about $1.58.

**Why gaps exist at all.** Someone makes a big trade on one exchange because that is where their wallet sent them, and that trade pushes the exchange's price while the others sit still. Or the price moves on a big centralized exchange like Binance and the on-chain pools have not caught up yet. Either way the gap sits there until the fastest bot takes it, which on Solana means within a fraction of a second.

**Why it is hard.** Everyone knows the trick. Thousands of bots watch every pool. To win you have to notice the gap first (a matter of milliseconds), and then win a bidding contest to have your transaction placed before your rivals'. That bid is a **tip** paid to the validator that builds the block, and winning bots now hand over half or more of their profit in tips. Most attempts fail outright, and the servers and data feeds needed to compete cost thousands of dollars a month. The result is that most arbitrage bots lose money once you count the hardware, and a handful of well-funded teams take most of the profit.

**Who pays.** The people who deposited tokens into the pools, called **liquidity providers** or LPs, are the ones on the other side. They sold at a stale price, so the arbitrageur's profit is their loss. This is a known, measurable cost of being an LP, and the trading fees they earn are meant to compensate for it.

**Four versions of the same idea.**

- **Cross-DEX:** buy on one exchange, sell on another.
- **Cyclic:** trade through a loop of three or more tokens (SOL to USDC to JUP and back to SOL) and end with more than you started.
- **CEX-DEX:** one leg on a centralized exchange, one on-chain. Bigger gaps, but not atomic, so real risk.
- **Backrunning:** watch for a big swap that creates a gap and land your trade right behind it, in the same block. This is the dominant form on Solana today.

**What it is not.** Arbitrage reacts to a price move after it happened. **Sandwiching** is different: seeing a user's trade before it lands and trading around it so the user gets a worse price. That takes value straight from the user, and the systems that assemble Solana blocks now refuse to carry it.

**Terms you will meet on this page.** A **slot** is Solana's block interval, a few hundred milliseconds. A **validator** is a computer that produces blocks. A **Jito bundle** is a small package of transactions that lands in order or not at all, with a tip attached. **Priority fee** is the other way to pay for placement. A **mempool** is a waiting room of pending transactions; Solana does not have a public one. **LVR** (loss-versus-rebalancing) is the name for what LPs lose to arbitrageurs.

**Bottom line.** Arbitrage is the simplest strategy to describe and the most competitive one to run. It is an infrastructure business, not a trading idea, and understanding it explains most of the rest of this handbook, because liquidations, JIT liquidity and market making all reuse its machinery.

<!-- /only -->

## The core idea

Two pools both quote SOL/USDC. Orca says $100, Raydium says $102. You spend USDC to buy SOL on Orca and immediately sell that SOL on Raydium for more USDC than you started with. You never hold SOL, you never took a view on where SOL is going, and you ended with more of the same asset you began with.

That last part matters. The **profit is measured in the input token** (you started with USDC and ended with more USDC), so there is no inventory to unwind and no price risk after the trade. On a blockchain you can go further: put both legs in one transaction and make the transaction **revert unless the ending balance exceeds the starting balance**. Now the trade is **atomic**: either you profit or nothing happens at all.

Your profit per opportunity is roughly: **price gap, minus fees on both legs, minus the price impact your own trade causes, minus what you pay to land it.** Everything else in this document is about the pieces of that sentence.

## The four flavors

<!-- level: intermediate -->

**Cross-DEX spread arbitrage.** Two venues quote one pair at different prices. Buy at the low venue, sell at the high one. The most common Solana version, per Umbra Research's early study, was picking off an AMM with stale quotes and hedging on an on-chain order book (Phoenix) whose market makers had already moved. Today the "already moved" venue is more often a proprietary AMM (more below).

**Cyclic (triangular) arbitrage.** No single pair is mispriced, but the cycle is: SOL to USDC to JUP to SOL leaves you with more SOL than you began with. Three or more hops, one input token, same output token. Blockworks Research literally defines cyclic arb on Solana as "transactions that have the same input and output token." Cycles find mispricings that pairwise comparison misses, and they're how you arbitrage a long-tail token that only has one pool against the majors.

**CEX-DEX arbitrage.** Binance prints a new SOL price; an on-chain pool hasn't caught up. Buy on the pool, sell on Binance (or the reverse). This is **non-atomic**: the two legs settle on different systems seconds apart, so you hold inventory in between and need capital pre-positioned on both sides. It's the strategy with the best edge (CEXs lead price discovery, so the gap is real information) and the most risk (the price can move between legs, and you must manage hedges and rebalance inventory across venues). The Ethereum study by Heimbach et al. (arXiv 2507.13023) found CEX-DEX searchers hedge within seconds and that the top three firms captured roughly 73 percent of all extracted value, rising to about 90 percent by Q1 2025, which is what a latency-and-capital game looks like when it matures.

**Backrunning.** A large swap lands and moves a pool's price off fair value. You land immediately after it, in the same slot, buying the now-cheap token from that pool and selling it elsewhere. Backrunning is just cross-DEX arb where you know exactly when the gap will appear, because you saw the trade that created it. On Solana this is the dominant form of atomic arb, and the whole infrastructure fight (bundles, shred feeds, preconfirmations) is about seeing that swap a few milliseconds before anyone else.

Liquidations, incidentally, are a backrun of an oracle update rather than of a swap. Same shape, same tooling.

## Where the spread comes from

<!-- level: intermediate -->

Nobody leaves free money on the table on purpose. Gaps exist because of two things:

- **Uninformed flow.** A retail user swaps $200k of SOL on one pool because that's where their wallet routed them. Their trade pushes that pool's price 1 percent away from every other venue. They didn't care about the cross-venue price; they just wanted SOL. That 1 percent is now sitting in the pool for whoever takes it first.
- **Stale AMM prices.** An `x * y = k` pool only changes price when someone trades against it. If SOL moves 2 percent on Binance in 400ms, the pool still quotes the old price until an arbitrageur shows up and trades it back to fair. The pool's LPs sold SOL at the old price to the arb.

<!-- level: expert -->

The second one has a name. **LVR (loss-versus-rebalancing)**, from Milionis, Moallemi, Roughgarden and Zhang (2022), measures how much an AMM LP loses relative to holding the same position but rebalancing at true market prices. Its central result: **LVR is exactly the arbitrageurs' best-case profit against that pool.** Every dollar an LP bleeds to stale pricing is a dollar the arb collected. Arb profit and LVR are the same number seen from opposite sides of the trade.

For a constant-product pool the instantaneous LVR rate is **sigma squared over 8** of pool value per unit time. Worked: at 5 percent daily volatility, sigma squared is 0.0025, over 8 is 3.125 basis points per day. On a $10M pool that's about **$3,125 per day** of theoretical arb revenue, before fees, if arbitrageurs are perfectly fast and competitive. Double the volatility and it quadruples. This is the total pie available against that pool; the fight is over who gets what slice.

Fees shrink the pie. Milionis et al.'s follow-up on fees shows that with a fee of `f`, no arb happens until the market price drifts outside the band `[(1-f) P_pool, P_pool / (1-f)]`, and the arb only pushes the pool back to the edge of that band, not the center. Higher fees mean fewer, larger arbs and more of the volatility captured by LPs rather than searchers.

<!-- /level -->

## How fees and price impact cap your size

<!-- level: intermediate -->

The gap between two pools isn't a price you can trade unlimited size at. Every unit you buy from the cheap pool raises its price; every unit you sell to the expensive pool lowers its. You trade until the two **post-fee marginal prices meet**, and not one lamport further. Profit is the area of the triangle between the two converging price curves.

### Constant-product pools, worked

<!-- level: expert -->

Pool A (buy SOL here): 10,000 SOL and 1,000,000 USDC, price $100.
Pool B (sell SOL here): 10,000 SOL and 1,020,000 USDC, price $102.
Both charge 0.25 percent. Gross gap 2 percent, net of two fees 1.5 percent.

Writing `r = 1 - fee = 0.9975`, the optimal USDC to put into Pool A has a closed form:

**dy\* = ( r · sqrt(X_A · Y_A · X_B · Y_B) − X_B · Y_A ) / ( r · X_B + r² · X_A )**

Plugging in: dy\* ≈ **3,727 USDC**, which buys 37.04 SOL on A and sells for 3,754 USDC on B. **Profit ≈ $27.67.** After the trade, Pool A quotes $100.75 and Pool B quotes $101.25: the gap has shrunk to exactly the two-fee width, 0.5 percent, and no further arb is possible.

| Scenario | Optimal input | Profit |
|---|---|---|
| As above, 0.25% fees | $3,727 | $27.67 |
| Same pools, zero fees | $4,975 | $49.51 |
| 10x deeper pools, 0.25% fees | $37,268 | $276.74 |

Three things to take from the table. Fees roughly halve the capturable profit on a 2 percent gap. Profit scales **linearly with pool depth** for a fixed percentage gap, so shallow memecoin pools produce many tiny arbs and deep SOL/USDC pools produce a few meaningful ones. And a 2 percent gap on a $1M pool yields $28, which is why Jito's detection data puts the **average successful Solana arb at $1.58** of profit.

### Concentrated-liquidity pools, worked

<!-- level: expert -->

In a concentrated pool (Orca Whirlpools, Raydium CLMM, Meteora DLMM) the math is different within a tick range. Liquidity is a constant `L`, and moving the price from `P_0` to `P_1` costs exactly `L · (sqrt(P_1) − sqrt(P_0))` of the quote token and yields `L · (1/sqrt(P_0) − 1/sqrt(P_1))` of the base token.

Say a Whirlpool quotes SOL at $100 with `L = 500,000` in the active range and a 0.3 percent fee, while a firm order-book bid sits at $101.50 with a 0.1 percent taker fee. You buy SOL from the pool until its post-fee marginal price equals the book's post-fee bid:

`P* = 101.50 · (1 − 0.001) / (1 + 0.003) ≈ $101.10`

Buying up to P\* takes `500,000 · (sqrt(101.10) − 10) ≈ 27,306 USDC` (27,388 with fee) and yields about `271.6 SOL`. Selling those at $101.50 less taker fee returns 27,537 USDC. **Profit ≈ $150** on a $27k trade, again about half the net edge times the size.

The catch: if `P*` lies past the edge of the current tick range, `L` changes at the boundary and you have to step through ranges, recomputing at each. Solvers do this by walking ticks; there is no single closed form once you cross one. The intuition to keep is that concentrated pools pack much more `L` near the price than an equivalent `x * y = k` pool, so the same TVL supports larger arbs and higher profit per gap. That is exactly the LP's LVR: concentration multiplies both fee income and what arbitrageurs can extract.

## Why atomicity makes it near risk-free

In a normal two-legged trade the risks are: the first leg fills and the second doesn't; the price moves between legs; you end holding inventory you didn't want. An atomic on-chain arb has none of these. Both legs execute in one transaction, and a final balance check reverts the whole thing if the ending balance isn't higher than the start. You cannot lose on the trade itself.

What you can lose is the cost of trying:

- **Base fee on a failed transaction.** Solana charges 5,000 lamports per signature whether or not the transaction succeeds. Trivial per attempt, not trivial times ten thousand attempts a day.
- **Priority fee.** Paid on failure too, if you sent via the normal path.
- **Tips on landed-but-unprofitable bundles.** A Jito or Harmonic bundle that reverts is dropped entirely and costs nothing. But if your bundle lands and the arb barely clears zero after tip, you paid for a win that wasn't one.
- **Infrastructure.** Dedicated nodes run $1,800 to $3,800 a month; colocation and shred feeds cost more. Most Solana arb bots lose money net of infrastructure, because the profits are concentrated in the few that win the races.

CEX-DEX arb does not get this protection. It carries genuine inventory and execution risk, which is also why its margins are fatter.

## Solana specifics

<!-- level: intermediate -->

### The clock

Solana produces blocks continuously, with a leader rotating every four slots. Slots were 400ms for years. Staged reductions under SIMD-0525 then landed on mainnet: 350ms on 19 August 2026 (epoch 1019), 300ms on 25 August (epoch 1023) and **250ms on 18 September (epoch 1037)**; the final 200ms step has no announced date and is gated on block skip rate. Alpenglow, the consensus replacement targeting roughly 150ms finality, began activating on testnet in late September 2026; Anza's tentative Agave v4.4 schedule puts mainnet activation at 9 November 2026, with all dates subject to change. The practical point is unchanged: state updates every few hundred milliseconds, there is no idle period, and an arb you detect from a confirmed block is already a slot stale.

### No public mempool

Solana never had a native mempool; transactions go straight to the leader. Jito's block engine ran one from late 2023, and it enabled a six-week surge of sandwich attacks, so **Jito shut it down in March 2024**, sacrificing revenue to do so. The consequence for arbitrageurs: you cannot see pending user transactions, so you cannot frontrun them. You can only react to state after it changes, or get transaction data early through the shred layer.

### Jito bundles and the tip auction

A **Jito bundle** is up to five transactions that land in order, all or nothing, in the same block. You attach a **tip** (a SOL transfer to one of eight tip accounts, minimum 1,000 lamports; a 6 percent protocol cut, 3 percent Block Engine fee plus 3 percent TipRouter fee, all routed to the Jito DAO since JIP-24) and the block engine runs **parallel auctions every 50ms**. Bundles that touch the same accounts compete in one auction, ranked by **tip per compute unit**; non-conflicting bundles don't compete at all. Failed bundles cost nothing.

The auction turns a latency race into a price race. Umbra observed tips at 20 to 50 percent of arb value in 2023; by 2025 Ghost's data had **arb bots paying 50 to 60 percent of profits in tips**, versus 15 to 20 percent for sandwich bots, which face less competition because the strategy needs privileged flow. The Jito-Solana client ran on roughly 92 percent of stake at the start of 2025.

### BAM

Jito's **Block Assembly Marketplace** moves sequencing into a trusted execution environment: transactions stay encrypted until execution, a BAM node schedules them, and validators execute the sequence in strict FIFO order and attest to it. Because nothing is visible pre-execution, sandwiching is structurally blocked. BAM reached about 33 percent of stake by end of Q2 2026 and 34 percent (383 of 665 validators) by 9 September 2026, when **BAM preconfirmations** launched: a signal that a transaction has been scheduled, delivered 5 to 10ms before it enters the block. For backrunners that is the new early-detection channel, though a preconf is a scheduling signal, not a guarantee of landing.

### Harmonic

**Harmonic** (Paradigm-backed, launched November 2025, roughly 21 percent of active stake by Q2 2026) is a competing block-building system where validators pick a scheduling strategy: 50ms frequency batch auction ordered by priority fee, pure FIFO, or **MREV**, a revenue-maximizing continuous scheduler. Searchers submit bundles over a Jito-compatible gRPC interface after being whitelisted. Two differences matter for arb economics. Harmonic tips are ordinary **compute-unit priority fees, 100 percent to the validator**, so a 1 SOL Harmonic tip is worth more to a validator than a 1 SOL Jito tip after Jito's 6 percent cut. And revert protection is conditional: flow that consistently reverts loses access, so spray-and-pray does not work there.

### Shreds and early detection

Before a block is complete, the leader streams it as **shreds**. Whoever reassembles shreds fastest sees the swap that created an opportunity before everyone waiting on a confirmed block. **Jito ShredStream** delivered shreds directly from leaders via the block engine, claiming hundreds of milliseconds of edge, and was **shut down on 5 September 2026**, with Jito directing users to **DoubleZero Edge**, a dedicated-fiber network that claims a 70 percent-plus lead on leader shreds after removing unauthorized retransmitters on 9 September (vendor claim, unverified). Between shred feeds and BAM preconfirmations, the detection edge for backrunning is now sold as infrastructure rather than built in-house.

### Spam versus latency

Solana's native scheduler is not first-come-first-served, and a failed transaction costs 5,000 lamports. So a rational bot, unsure whether it will win, sends many attempts and eats the failures. The results are stark: reverted transactions peaked at **75.7 percent of non-vote transactions in April 2024**, with Helius attributing most of those to bot arb attempts (the 95 percent share often quoted is unverified); the Agave 1.18 scheduler in May 2024 brought that down. A year-long academic study (arXiv 2504.18055) found **bots fail 58 percent of the time versus 6 percent for humans**, with "price or profit not met" (slippage and arb conditions) the top cause at 48 percent. Umbra estimated 96 percent of atomic arb attempts failed in 2023. Flashbots frames this generally: for one bot they studied, every successful arb cost about 350 failed attempts. Bundles fix this partially (a losing bundle never lands), which is why auctions are the ecosystem's preferred answer to spam.

### Jupiter, prop AMMs, and the disappearing spread

An aggregator splits a user's swap across every venue with the best marginal price. If a trade is routed well, it never leaves a 2 percent gap between Orca and Raydium; it fills both until their prices meet. **Jupiter** routes the large majority of Solana DEX volume (86 to 94 percent of aggregator-routed volume in 2025 depending on the month, with aggregators handling roughly three-quarters of all DEX volume), so the classic "retail user hits one pool and leaves a gap" setup is rarer than it was.

The bigger shift is **proprietary AMMs** (HumidiFi, SolFi, Tessera V, ZeroFi, GoonFi, Obric, Lifinity). These are single-market-maker vaults with no frontend that quote off oracles and refresh their quotes for around 143 compute units, which gives them **cancel priority**: they reprice before a taker can hit a stale price. They took over 80 percent of aggregator execution by late 2025 (unverified) and are reported to trade more SOL/USD volume than Binance (unverified). For arbitrageurs this means the venue that "already moved" is now on-chain, so CEX-DEX gaps can be captured atomically against lagging public pools, and Blockworks documents a tight correlation between prop-AMM share and cyclic-arb share of aggregator volume, with cyclic arb reportedly rising from about 2.5 percent of aggregator volume in August 2024 to over 40 percent by late 2025 (figure widely repeated, primary source unverified). The public `x * y = k` pools are the ones bleeding LVR; the prop AMMs are the market makers who stopped getting picked off.

## How competition compresses margins

<!-- level: intermediate -->

Gather the data points and the shape is clear:

| Metric | Figure | Source |
|---|---|---|
| Successful arbs detected, one year to 2025 | 90.4M, $142.8M profit, $1.58 average, $3.7M largest | Jito data via Helius |
| Atomic arb extracted, Jan 2024 to May 2025 | ~$380M | Ghost / sandwiched.me |
| Sandwich extracted, same period | $370M to $500M | Ghost / sandwiched.me |
| Arb bot tips as share of profit | 50 to 60% | Ghost, Accelerate 2025 |
| Bot transaction failure rate | 58% | arXiv 2504.18055 |
| Jito MEV tip volume, Q2 2026 | $9.9M, down 50% quarter on quarter | Jito Q2 report via Solana Compass |
| Top 3 CEX-DEX searchers (Ethereum), Q1 2025 | ~90% of extracted value | arXiv 2507.13023 |

Read together: the pie is real but the average slice is tiny, more than half of each slice goes to the validator via tips, most attempts fail, and the survivors are a handful of operators with colocated hardware and custom clients. Jito's own tip volume halving in Q2 2026 is partly share loss to Harmonic and BAM and partly the market maturing; treat the absolute number cautiously, but the direction is compression. Any edge you find from public data has, by construction, already been found.

## Toxic versus benign MEV

Not all extraction is equal, and the distinction now has teeth because block builders enforce it.

**Sandwiching** requires seeing a user's swap before it executes, buying ahead of it to push the price up, letting the user fill at the worse price, then selling into their impact. The user is strictly worse off; the profit is taken directly from them. It is only possible with pre-execution visibility, which on Solana means a mempool, a leaked feed, or a validator running modified software. Jito killed its mempool over it. Sandwiching still came back within a month through private channels: Helius documented one program executing 1.55M sandwiches for 65,880 SOL (about $13.4M) in a single month, and a 2025 ACM IMC measurement found over 500K sandwiches and $7.7M in victim losses over four months of early 2025, plus 2.4M defensive transactions from users trying to avoid them.

**Arbitrage and backrunning** trade against pools after a price change. The user who caused the gap already got their fill; the arb restores the pool to fair value, which if anything helps the next user. The cost lands on LPs as LVR, and LPs are compensated by fees for exactly that exposure. Liquidations are the same: they enforce a contract the borrower agreed to.

This is why **Harmonic's hard rule** reads "No sandwiching. Harmonic builders do not sandwich transactions. No strategy, including MREV, inserts transactions around a user's trade to extract value from the price movement," alongside bans on censorship and frontrunning, described as architectural commitments rather than policy. **BAM** achieves the same by encrypting transactions until execution. Both systems welcome backrun bundles because backrunning is the mechanism that keeps on-chain prices honest. As a practical matter: if a strategy needs to see a user's transaction before it lands, builders will not carry it and the Foundation delegation program penalizes validators who do.

## Realistic scorecard

| Strategy | Trade risk | Capital | Competition | Where the edge is |
|---|---|---|---|---|
| Cross-DEX atomic | None on trade; fees and tips on failure | Small, or flash-loaned | Extreme | Detection latency, tip calibration |
| Cyclic atomic | Same as above | Small | Very high | Graph search speed, long-tail coverage |
| Backrunning | Same as above | Small to medium | Extreme | Shred / preconf feed, bundle placement |
| CEX-DEX | Real: inventory, hedge slippage | Large, on both venues | High, few winners | CEX latency, capital, risk management |

The honest summary: atomic arb on Solana is a low-risk, low-margin, high-fixed-cost business where the marginal dollar goes to whoever is fastest and pays the validator the most. The strategy is a commodity; the infrastructure and the tip model are the product.

## How this connects to the rest of the stack

<!-- level: intermediate -->

- **Liquidations** are backruns of oracle updates. They use the same bundle path, the same tip auction, the same early-detection feeds, and the same "revert if unprofitable" guard. A team that can backrun a swap in the same slot can liquidate in the same slot.
- **Market making** is the other side of the same trade. An arb engine knows the cross-venue fair price at every instant; that is the input a market maker needs to quote and the reason prop AMMs stopped getting picked off. When your MM is slow, the arbitrageur collecting LVR from you is running exactly the strategy described here.
- **JIT liquidity** is a backrun-shaped strategy pointed the other way: land concentrated liquidity right before a large swap in the same slot, collect its fees, withdraw after. It needs the same early view of the incoming swap that backrunning needs, and lives or dies on the same detection latency.
- **Fee and tip economics** are shared across all four. Learning what fraction of profit a bundle must tip to land, per builder, per congestion regime, is a single model that every atomic strategy consumes.

## Where to go next

<!-- level: expert -->

- The LVR papers (Milionis et al. 2022 and the 2023 fee follow-up) for the math behind "arb profit equals LP loss."
- Tick-walking swap simulation for concentrated pools, since every real solver does this rather than the single-range closed form above.
- Builder-by-builder tip calibration: Jito auction (tip per CU, 50ms), Harmonic (priority fee, landed-rate gated), BAM (FIFO after TEE scheduling).

## Sources

- Helius, "Solana MEV Report: Trends, Insights, and Challenges" (Jito arb detection data, mempool shutdown, DeezNode sandwich case study, 2024 tip volumes): https://www.helius.dev/blog/solana-mev-report
- Umbra Research, "MEV on Solana" (atomic arb mechanics, 96% failure rate, spam-vs-latency, early tip shares): https://www.umbraresearch.xyz/writings/mev-on-solana
- Milionis, Moallemi, Roughgarden, Zhang, "Automated Market Making and Loss-Versus-Rebalancing" (2022): https://arxiv.org/abs/2208.06046
- a16z crypto, "LVR: Quantifying the Cost of Providing Liquidity to AMMs" (sigma squared over 8, 3.125 bps/day example): https://a16zcrypto.com/posts/article/lvr-quantifying-the-cost-of-providing-liquidity-to-automated-market-makers/
- Milionis, Moallemi, Roughgarden, "Automated Market Making and Arbitrage Profits in the Presence of Fees" (2023): https://moallemi.com/ciamac/papers/lvr-fee-model-2023.pdf
- Heimbach et al., "Measuring CEX-DEX Extracted Value and Searcher Profitability" (2025): https://arxiv.org/html/2507.13023v1
- Jito Labs docs, Low Latency Transaction Send (bundle size, 50ms auctions, tip-per-CU ranking, minimum tip): https://docs.jito.wtf/lowlatencytxnsend/
- Jito Labs docs, ShredStream (mechanics and 5 September 2026 shutdown notice): https://docs.jito.wtf/lowlatencytxnfeed/
- Blockworks, "Jito Labs ends mempool functionality citing impact on Solana users" (March 2024): https://blockworks.com/news/jito-labs-suspends-mempool-functionality
- Helius, "Block Assembly Marketplace (BAM)" (TEE scheduler, FIFO execution, plugins, rollout phases): https://www.helius.dev/blog/block-assembly-marketplace-bam
- Solana Compass, "Jito BAM Preconfirmations Launch on Solana: 34% Stake Coverage" (9 September 2026): https://solanacompass.com/news/jito-bam-preconfirmations-go-live-on-solana-covering-34-of-network-stake
- Solana Compass, "Jito Q2 2026: Revenue Falls 45%, BAM Hits 33% Solana Stake" (BAM, Harmonic, Rakurai stake shares; tip volume): https://solanacompass.com/news/jito-q2-2026-protocol-revenue-falls-45-to-128m-as-bam-reaches-33-of-solana-stake
- Harmonic docs, Introduction and Scheduling Strategies (FBA, FIFO, MREV; anti-sandwich rule text): https://docs.harmonic.gg/ and https://docs.harmonic.gg/concepts/scheduling-strategies
- Harmonic docs, Harmonic Bundles (priority-fee tips, whitelist, landed-rate gated revert protection): https://docs.harmonic.gg/searchers/harmonic-bundles
- Ghost / sandwiched.me, "State of Solana MEV, May 2025" and Accelerate 2025 talk (atomic arb and sandwich totals, tip shares): https://sandwiched.me/research/state-of-solana-mev-may-2025-analysis and https://solanacompass.com/learn/accelerate-25/scale-or-die-at-accelerate-2025-the-state-of-solana-mev
- Gerzon et al., "Quantifying the Threat of Sandwiching MEV on Jito" (ACM IMC 2025; abstract figures): https://dl.acm.org/doi/10.1145/3730567.3764493
- "Why Does My Transaction Fail? A First Look at Failed Transactions on the Solana Blockchain" (arXiv 2504.18055): https://arxiv.org/html/2504.18055
- Flashbots, "MEV and the Limits of Scaling" (speculative arb spam, 350 failures per success): https://writings.flashbots.net/mev-and-the-limits-of-scaling
- Blockworks Research, "Solana DEX Winners: All About Order Flow" (prop AMMs, cyclic arb correlation, flash-loan arb): https://app.blockworksresearch.com/unlocked/solana-dex-winners-all-about-order-flow
- Helius, "Solana's Proprietary AMM Revolution" (prop AMM list, 143 CU quote updates, cancel priority, Jupiter share): https://www.helius.dev/blog/solanas-proprietary-amm-revolution
- Extropy, "An Analysis of Arbitrage Markets Across Ethereum, Solana..." (bot concentration, infrastructure costs): https://academy.extropy.io/pages/articles/mev-crosschain-analysis-2025.html
- Solana, "Reduced slot times" upgrade page (350ms and 300ms activation dates): https://solana.com/upgrades/reduced-slot-times
- Solana Compass, "Solana Activates 250ms Slot Time at Epoch 1037" (18 September 2026): https://solanacompass.com/news/solana-activates-250ms-slot-time-at-epoch-1037-fourth-step-of-simd-0525
- Solana Compass, "Alpenglow Activates on Testnet, Agave v4.4 Schedule Targets November 9 Mainnet" (22 September 2026; dates tentative): https://solanacompass.com/news/alpenglow-activates-on-solana-testnet-as-frankendancer-era-ends-agave-v44-schedule-targets-november-9-mainnet-activation
- Jito Foundation forum, "JIP-24: Jito DAO Receives All Jito Block Engine Fees and Future BAM Fees" (3 percent Block Engine fee plus 3 percent TipRouter fee, all to the DAO): https://forum.jito.network/t/jip-24-jito-dao-receives-all-jito-block-engine-fees-and-future-bam-fees/860
- Solana Compass, "DoubleZero Removes Unauthorized Retransmitters" (ShredStream successor, vendor claims): https://solanacompass.com/news/doublezero-removes-unauthorized-shred-retransmitters-claims-70-plus-lead-over-all-competitors
