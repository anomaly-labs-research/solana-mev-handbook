# JIT Liquidity, In Depth

_As of Sep 2026._

Just-in-time liquidity is the strategy where you are a market maker for exactly one trade. You show up with a huge amount of liquidity a moment before a large swap, take most of that swap's fee, and leave before anything else can happen to you. It sounds like a free lunch. The interesting part of the story is why, on Ethereum, it stayed a niche run by a handful of bots, and why on Solana the classic version barely exists at all.

<!-- only: beginner -->

## In plain terms

**What it is.** On a decentralized exchange (DEX), trades are filled out of pools of tokens that ordinary people have deposited. Those depositors, the **liquidity providers** (LPs), earn a small fee on every trade. In newer "concentrated" pools an LP picks a narrow price band, and each trade's fee is split among whoever has money in that band, in proportion to how much they put there. Just-in-time (JIT) liquidity is a bot that exploits that rule: it learns a large trade is coming, drops a huge pile of money into the narrowest possible band a moment before, collects most of the fee, and pulls the money out a moment after. It is a market maker for exactly one trade.

**A tiny example.** Someone is about to swap $1 million into SOL on a pool that charges 0.3 percent, so the fee is $3,000. The regular LPs have $2 million in the relevant band. A JIT bot adds $18 million and now owns 90 percent of it. The trade lands, the bot takes $2,700 of the fee, and the regular LPs get $300 instead of $3,000. The trader is actually better off: a deeper pool moves less when hit, so they save roughly $2,250 in price impact. After hedging and inventory costs the bot clears maybe $2,100, before paying to get its transactions placed.

**Why it is hard.** The bot must know about the trade before it happens, and must land its deposit, the trade, and its withdrawal in exactly that order as one all-or-nothing package. It needs enormous capital for a tiny return: on Ethereum, JIT bots supplied on average 269 times the size of the trade they targeted and earned about 0.007 percent per trade. And the bot ends up holding whatever the trader sold and has to buy it back elsewhere, which on the lowest-fee pools costs more than the fee itself.

**Who wins, who pays.** The trader wins a little: better price, same fee. The bot wins a little per trade and only makes real money by doing it constantly with a lot of capital. The regular LPs lose: most of the fee they were going to earn went to someone who was in the pool for a fraction of a second. On Ethereum the trade was real but tiny, under 1 percent of exchange volume, run almost entirely by one or two operators, and most of their profit went to whoever assembles blocks, because rival bots bid it away to win placement.

**Why it barely exists on Solana.** The classic version depends on seeing a stranger's trade before it is finalized, which on Ethereum happens in a public waiting room called the mempool. Solana has no such waiting room: transactions go straight to the validator building the block, and the fast data feeds that exist only show a trade after its position in the block is fixed. You can react to it; you cannot get in front of it. What remains is JIT around trades you already know about because you are the app routing them, or that are predictable because a program schedules them. Large Solana swaps are also usually split across several pools by an aggregator, so each piece is too small to be worth it.

**What can go wrong.** If the price moves outside the bot's narrow band mid-trade, it stops earning partway through. If the package fails to land, nothing happens, but the infrastructure was still paid for. On quiet pools, setting up the accounts costs rent that is not refunded. And if JIT became widespread, regular LPs might leave, making the pool thinner for everyone.

**Terms you will meet on this page.** A **concentrated-liquidity pool** lets LPs pick a price range; **ticks** and **bins** are the units those ranges are measured in. **Price impact** is how much your own trade moves the price against you. **Hedging** means buying back what you were forced to sell. A **bundle** is a package of transactions that lands in order or not at all, with a **tip** paid to the validator. A **mempool** is a public waiting room of pending transactions; Solana does not have one. **LVR** is the money regular LPs lose to arbitrage bots when prices move. A **perp** is a futures-style contract; the "JIT auction" on the Drift (now Velocity) perps exchange borrows the name for a different, protocol-designed mechanism.

**Bottom line.** JIT liquidity is a cousin of front-running that helps the trader, hurts the passive LPs, and pays the bot very little per trade. On Solana the third-party version is effectively unavailable; the forms that work live inside something you already run.

<!-- /only -->

## The core idea

A concentrated-liquidity AMM (Orca Whirlpools, Raydium CLMM, Uniswap v3) lets an LP choose a **price range** for their capital. Swap fees are split among the LPs whose range covers the current price, **pro rata by liquidity**. A very tight range concentrates a lot of "liquidity" (in the AMM's technical sense) from relatively little capital, because none of it is wasted on prices far from the current one.

**Just-in-time (JIT) liquidity** takes that to the limit. Right before a large swap, a bot mints a position in the tightest possible range around the current price, sized to dwarf the passive liquidity already there. The swap executes against a pool that is suddenly 5x or 10x deeper. The bot collects the lion's share of the fee, then burns the position immediately after. All three steps happen in one atomic bundle, so the bot is exposed to the market for one trade and nothing else.

Two things are true at the same time:

- The **trader gets a better price**: deeper liquidity means less price impact.
- The **passive LPs get diluted**: they were going to earn that fee, and most of it just went to someone who was in the pool for a fraction of a second.

## The mechanic, step by step

<!-- level: intermediate -->

The bundle has three legs and the order is non-negotiable:

1. **Mint before.** Open a position with lower and upper ticks as close as the pool's tick spacing allows around the current price, and deposit liquidity. In a Uniswap-style pool this means the range is one or two tick spacings wide. The swap must stay inside that range, or the JIT position stops earning partway through.
2. **The target swap lands.** It trades against the combined liquidity (passive + JIT). Fees accrue to both in proportion to liquidity in the ticks the swap crosses.
3. **Burn after.** Withdraw the liquidity plus the accrued fees and close the position. The JIT LP now holds a slightly different mix of the two tokens than it started with, plus the fee.

Because the JIT LP ends up on the other side of the swap (if the trader bought SOL, the JIT LP sold SOL), it typically **hedges** immediately, buying back the inventory on a cheaper venue such as a CEX. The Uniswap Labs study estimated that hedging cost at 1–2 bps minimum, which is why 1 bp fee tiers saw essentially no JIT activity: the hedge costs more than the fee.

Atomicity is what makes this a low-risk trade. If the swap does not land, the whole bundle reverts and the JIT LP never touched the pool. If it does land, the LP's inventory exposure lasts exactly as long as the bundle.

## A worked example: a $1M swap

<!-- level: intermediate -->

Take a $1M USDC-to-SOL swap on a pool with 0.3% fees. Passive LPs have $2M of liquidity sitting in the ticks the swap will cross. A JIT bot mints $18M concentrated into a single tick spacing around the current price, so total in-range liquidity is $20M and the JIT bot owns 90% of it.

| Item | Without JIT | With JIT |
|---|---|---|
| Swap fee paid by trader | $3,000 | $3,000 |
| Fee to passive LPs | $3,000 | $300 |
| Fee to JIT LP | 0 | $2,700 |
| Price impact on trader (rough) | ~50 bps | ~5 bps |
| Average execution cost from impact | ~$2,500 | ~$250 |

The trader saves roughly $2,250 in impact. The passive LPs lose 90% of the fee they would have earned. The JIT LP's gross is $2,700, from which you subtract:

- **Inventory loss.** The JIT LP sold about $900k of SOL along the curve at an average price ~2.5 bps above the start, and the price ended ~5 bps up. Call it ~$225.
- **Hedging.** Buying back $900k of SOL on a CEX at 1–2 bps: $90–$180.
- **Fixed costs.** Position rent, compute, and the tip or priority fee paid to win block position.

Net, maybe $2,100 before the tip. In a competitive auction most of that gets bid away to whoever orders the block. This is why JIT bots historically hunted only large swaps: the fixed costs are the same for a $10k swap and a $1M swap, but the fee scales with size.

Now change only the fee tier:

| Fee tier | Fee on $1M | JIT gross at 90% | Hedge cost (1.5 bps on $900k) | Verdict |
|---|---|---|---|---|
| 0.30% | $3,000 | $2,700 | ~$135 | Comfortable |
| 0.05% | $500 | $450 | ~$135 | Thin; only on very large swaps |
| 0.01% | $100 | $90 | ~$135 | Unprofitable |

This matches what Uniswap Labs found empirically: JIT concentrated in the 5 bps and 30 bps tiers and was nearly absent in 1 bp pools.

There is also a theoretical ceiling on how much the trader can gain. Uniswap Labs derived that the **price improvement from JIT is capped at roughly twice the pool's fee rate**: beyond that, the JIT LP's inventory loss exceeds the fee it collects and it would not show up. On a 0.05% pool the trader saves at most ~10 bps. Most observed JIT trades satisfied that bound.

## Why it is a hybrid of market making and MEV

<!-- level: intermediate -->

JIT is **market making** in substance. You provide two-sided liquidity, earn the spread (here, the swap fee), end up with inventory, and hedge it. The P&L equation is the same one a market maker lives by: fee income minus adverse selection minus inventory cost minus operating cost.

JIT is **MEV** in execution. It only works if you can see a specific pending trade and place your transactions immediately before and after it. That requires the same infrastructure as sandwiching or backrunning: private order flow visibility, atomic bundles, and a way to buy ordering from whoever builds the block. Unlike a sandwich, the target trader benefits rather than loses, but the extraction mechanism is the same.

The cleanest way to say it: a passive LP is a market maker whose hands are tied and who quotes for everyone. A JIT LP is a market maker who untied their hands and quotes for exactly one counterparty they have already inspected.

## The adverse-selection puzzle

<!-- level: intermediate -->

Passive LPs bleed **loss-versus-rebalancing (LVR)**: they quote stale prices and get picked off by arbitrageurs every time the market moves. The market-making doc covers this in detail. A JIT LP faces almost none of it. It is in the pool for a single trade whose size and direction it already knows, it is never left holding a stale quote, and it can hedge within seconds.

So why do JIT LPs not simply replace passive LPs entirely? Several reasons, all of which the Ethereum data confirms:

- **It only works on trades you can see coming.** JIT needs a specific large swap to be visible before it lands. Passive LPs earn on every trade including the thousands of small ones no one bothers to JIT.
- **Capital intensity.** The Imperial College study of Uniswap v3 found JIT LPs supplied on average 269x the swap volume in liquidity, for an average ROI of 0.007% per trade. Enormous capital, tiny per-trade return, all riding on high frequency.
- **Fixed costs dominate.** Mint plus burn plus hedge plus tip is only worth it above a size threshold. Over half of JIT events on Uniswap v3 supplied more than $100k of liquidity individually.
- **Auction competition.** When several bots can do the same thing, they bid the profit away to the block builder. What survives is a thin margin for the best-capitalized, lowest-latency operator.
- **Selective participation cuts the other way.** JIT LPs cherry-pick uninformed flow, which is exactly the flow that made passive LP-ing profitable. The academic "paradox of JIT liquidity" paper models this and finds that JIT can reduce total liquidity: passive LPs, left with a more toxic mix, exit, and the pool ends up shallower for every trade JIT does not touch.

The result is not "JIT dominates" but "JIT skims the largest trades while passive LPs subsidize the pool's baseline depth." That is an uneasy equilibrium and it is the reason protocols started designing against it.

## What actually happened on Ethereum

<!-- level: intermediate -->

JIT appeared on Uniswap v3 in 2021, enabled by Flashbots bundles that let a searcher submit mint, target swap, and burn as one atomic unit to a block builder. The headline numbers from the two main empirical studies:

| Finding | Uniswap Labs (May 2021–Jul 2022) | Imperial College (20 months, to 2023) |
|---|---|---|
| JIT events | 8,287 | 36,671 |
| Share of Uniswap v3 volume | ~0.3%, never above 0.5% except two months | not stated |
| Concentration | >95% of JIT liquidity from one account; <20 addresses total | one bot took 92% of total profit |
| Total profit | not stated | 7,498 ETH |
| Passive LP fee dilution on targeted swaps | not stated | 85% on average |
| Trader price improvement | bounded by 2x fee rate | 0.139% better on average |
| Where | USDC-WETH 5 bps pool alone took over half of all JIT liquidity | concentrated in a few large pools |

Two takeaways. First, JIT was real and it did what the theory says: traders got better prices, passive LPs on the targeted swaps lost most of their fee. Second, it was **small and extremely concentrated**. A single operator, sometimes two, ran the trade. The 2025 AFT paper adds that even those operators left money on the table: accounting properly for price impact when sizing the position could have raised JIT earnings by about 69%, and the same paper estimates passive LP losses of up to 44% per targeted transaction.

The MEV-Boost era did not change the picture much. JIT remained a specialist trade for whoever had the capital, the latency, and the builder relationships.

## Who wins and who loses

| Party | Effect |
|---|---|
| Trader (the swapper) | Strictly better: less price impact, same fee. Bounded upside of ~2x the fee rate. |
| JIT LP | Small, near-riskless profit per trade; needs large capital and top-tier infra. |
| Passive LPs | Lose most of the fee on targeted swaps; keep all fees on untargeted ones. Net effect depends on how much of pool volume is large, JIT-able swaps. |
| Block builder / validator | Captures most of the JIT profit through the ordering auction. |
| Protocol | Ambiguous: better execution attracts volume, but LP flight reduces depth for everyone else. |

## Solana: the venues

<!-- level: intermediate -->

All three major Solana concentrated-liquidity venues can technically host the trade, but they differ in shape.

| Venue | Model | Fee tiers | Position granularity | JIT-relevant quirks |
|---|---|---|---|---|
| **Orca Whirlpools** | Uniswap v3-style CLMM | 0.01% to 2% | Ticks; tightest range is one tick spacing | Tick arrays of 88 ticks (~10 KB each) must be initialized before a position can use them; Orca's dynamic tick arrays shrink that rent. |
| **Raydium CLMM** | Uniswap v3-style CLMM | 0.01% / 0.05% / 0.25% / 1% | Tick spacing 1 / 10 / 60 / 120 respectively | Positions are NFTs with a personal-position account; each new tick array the range touches costs rent to initialize. |
| **Meteora DLMM** | Discrete price bins | Base fee set by bin step plus a variable fee driven by a volatility accumulator | One bin is the tightest range; max 69 bins per position | Fees are computed and distributed **per bin**, so a JIT position in the active bin alone captures its share of every bin it is present in. The variable fee rises with bin crossings, which slightly raises the fee pot on exactly the large swaps JIT targets. |

On Meteora, "mint a tight range" means "deposit into the active bin and maybe one neighbor." On Orca and Raydium it means a position whose lower and upper ticks are one tick spacing apart. In all cases the swap has to stay inside the JIT range to be fully captured, which is easy for a 1 bp move on a stable pair and hard for a volatile memecoin pool.

## Solana: there is no mempool, and that changes everything

<!-- level: intermediate -->

On Ethereum, JIT works because the target swap sits in a public mempool where anyone can read it and wrap it. Solana never had a native in-protocol mempool. Transactions go straight to the upcoming leader. Jito ran a pseudo-mempool that held transactions for about 200 ms so searchers could bid on them, and that is what enabled sandwiches and classic JIT for a while. **Jito shut that mempool down on March 8, 2024.**

Since then, the earliest a third party can see someone else's swap is after the leader has already sequenced it:

- **Shreds and shred feeds.** Shreds are the leader's block data being broadcast. Jito ShredStream delivered them directly from Jito-connected validators, saving on the order of 50–200 ms versus waiting for normal propagation (unverified figure from a secondary source), until Jito shut it down on September 5, 2026 and pointed users to DoubleZero Edge, a paid private-fiber shred feed. By definition, a shred contains transactions that are already ordered. You can react to a swap, you cannot get in front of it.
- **BAM (Block Assembly Marketplace).** Launched on mainnet in September 2025, BAM moves sequencing into trusted execution environments. Transactions are encrypted inside the enclave until execution, which is designed specifically to stop frontrunning and sandwiching. Applications can write **plugins** that define ordering rules for their own transactions, and Jito's own framing is that this enables "protected backrunning": a searcher can append a transaction after a user's swap, not before it.
- **BAM preconfirmations.** Launched September 9, 2026, covering 34.1% of stake across 383 of 665 validators at launch, distributed by Helius and Triton One. Preconfs stream a signal after the validator has scheduled a transaction but before it is packed into shreds, about 5–10 ms ahead of shred-based signals at the median. Still post-scheduling; still a signal, not a guarantee.

The consequence for JIT is blunt: **the classic version, wrapping a stranger's swap that you spotted in a mempool, is not available on Solana today.** Everything you can see from a third party's flow arrives after ordering is fixed. You can backrun it. You cannot mint before it.

What remains possible:

- **Your own or partnered flow.** If you are the router, the wallet, or the RFQ desk that a trader's swap passes through, you know about the swap before it is submitted and can wrap it yourself. This is JIT as a product feature rather than as MEV, and it is essentially what RFQ integrations in aggregators already are (unverified how much of Jupiter's large-order flow is filled this way).
- **Predictable flow.** Scheduled DCA executions, liquidation cascades, and oracle-driven rebalances are visible in advance because the logic that triggers them is on-chain. You do not need to see the transaction if you can predict it.
- **Application-level opt-in via BAM plugins.** A DEX could in principle write a plugin that invites makers to add liquidity before its own swaps land inside the enclave. Nothing like that has shipped for AMM liquidity as far as public information shows (unverified).

## Solana: bundles, rent, compute, and tick arrays

<!-- level: expert -->

If you do have a swap to wrap, the mechanics are Jito bundles. A bundle holds at most 5 transactions, executes sequentially and atomically within a single slot, and is auctioned roughly every 50 ms on tip per compute unit. Minimum tip is 1,000 lamports; in practice the tip is the competitive variable. The JIT layout is fixed:

1. Transaction 1: open the position (and initialize any missing tick arrays), deposit liquidity.
2. Transaction 2: the target swap, signed by the trader.
3. Transaction 3: withdraw liquidity, collect fees, close the position, pay the tip.

Some of the friction is Solana-specific:

- **Position-account rent.** Every position is its own account (plus an NFT mint on Orca and Raydium). Rent is reclaimed when you close the position in the same bundle, so it is a capital cost, not a loss.
- **Tick-array rent is sunk.** If the price sits in a tick array nobody has initialized yet, the first LP pays to create it. On Orca a full 88-tick array is around 10 KB, on the order of 0.07 SOL of rent-exempt balance (approximate), and LPs generally cannot reclaim it. Dynamic tick arrays on Orca reduce this. For hot pools the arrays around the current price already exist, so this is mostly a long-tail problem.
- **Compute.** Open + deposit and withdraw + close each take a meaningful compute budget; the swap in the middle can cross several tick arrays or bins and must have them all passed as accounts. Solana's per-transaction account and compute limits are why the JIT legs live in separate transactions rather than one.
- **Tick alignment.** Position bounds must be multiples of the pool's tick spacing. On a 0.25% Raydium pool with spacing 60, the tightest range is 60 ticks, about 0.6% wide. That is still "tight" for JIT purposes, but on a fast-moving pair the price can walk out of it mid-swap.

## Solana: aggregators split the swap

<!-- level: intermediate -->

The other reason a single $1M swap is rarer than it looks on Solana is **Jupiter**. Its routing engine (Metis) splits large orders across multiple pools and DEXs, including multi-hop routes through SOL or USDC and multiple splits through the same DEX at different pools. A $1M order might land as 60% on an Orca Whirlpool, 25% on a Raydium pool, and 15% on a Phoenix order book. From a JIT LP's perspective, that is three smaller swaps on three venues, each below the size threshold where the fixed costs pay off, and only the CLMM legs are JIT-able at all.

This is not accidental. Splitting is exactly what a trader would do to minimize impact without needing a JIT LP to show up, and it eats the same inefficiency JIT was monetizing.

## Related but different: JIT auctions on perps

<!-- level: intermediate -->

Drift Protocol (rebranded Velocity in July 2026 after its April 2026 exploit) pioneered a different mechanism that also carries the JIT name. When a taker submits a market order, the protocol opens a short **Dutch auction**, originally about 5 seconds, in which the fill price ramps from the taker's best price toward their limit. Makers watch the auction and fill it with a place-and-make instruction: an immediate-or-cancel, post-only order that exists only to fill this one taker, executes, and cancels the remainder in a single transaction. The venue's own AMM competes alongside makers and backstops whatever is left. Makers earn a flat maker rebate (0.25 bps of filled notional in the current Velocity docs) and a partially filled JIT order cannot be pulled.

The similarity to AMM JIT is real: the maker provides liquidity only for a specific known trade and holds inventory for as short a time as it chooses. The differences matter more:

- It is **protocol-sanctioned**. The auction is the venue's design, not an exploit of ordering. There is no passive LP being diluted; the maker is competing with the AMM, which is the protocol's own backstop.
- The maker's information advantage is **time**, not mempool visibility. Everyone sees the auction for the same few seconds. Speed and pricing win, not block-position bidding.
- The maker **takes real inventory** and must manage it like any market maker. There is no "burn after."

Think of Drift-style JIT as the order-book cousin: a request-for-quote with a public countdown. AMM JIT is the passive-pool cousin: a market maker briefly impersonating an LP.

## Benign or harmful?

The honest answer is "both, depending on which side of the pool you sit on."

**The case for benign:** every JIT event gives the trader a strictly better price. Fees paid do not change; impact falls. The Imperial study measured 0.139% average improvement. No one is deceived and no one loses money they had in hand.

**The case for harmful:** JIT LPs take the best trades and leave passive LPs the worst ones. Passive LPs still eat all the LVR from arbitrageurs while losing most of the fee on the large, uninformed swaps that were their compensation. The paradox paper's conclusion is that this can shrink total liquidity: passive LPs exit, and the pool is shallower for every trade JIT does not bother with, which is most of them. The Solana venues rely on passive depth for the long tail of small swaps, so a world with a lot of JIT and few passive LPs would make ordinary trading worse.

The empirical resolution on Ethereum was that JIT stayed under 1% of volume, so the harm was contained by JIT's own economics more than by any protocol design. Whether that would hold if the trade became cheap and widespread is the open question the protocol responses are trying to preempt.

## Protocol responses

<!-- level: intermediate -->

- **Uniswap v4 hooks.** v4 exposes callbacks before and after liquidity is added or removed, and pools can charge dynamic fees. OpenZeppelin's `LiquidityPenaltyHook` is the reference anti-JIT design: if liquidity is added and removed within a configurable block window, the LP's fees are withheld and donated to the in-range LPs that stayed. A 2026 Trail of Bits review found a bypass in one implementation (collect fees via a tiny add before the penalized remove), which is a reminder that the enforcement point matters. v4 also lets a pool internalize JIT as a hook that adds and removes liquidity around its own swaps, turning the strategy into a protocol feature rather than a third-party extraction.
- **Dynamic fees.** Meteora's DLMM variable fee rises with volatility (bin crossings), and Orca has adaptive-fee pools. These do not target JIT directly, but they raise the fee on exactly the large, price-moving swaps JIT wants, which increases the JIT LP's gross and the passive LP's loss in equal proportion; they are neutral-to-favorable for JIT, not a deterrent.
- **Meteora anti-JIT measures.** No public documentation found describing same-slot add/remove penalties on DLMM (unverified: none may exist). Meteora's anti-sniper controls on DAMM v2 target launch-time trading, not LP behavior.
- **Ordering privacy.** On Solana, the shutdown of Jito's mempool and BAM's encrypted sequencing are the most effective anti-JIT measures in practice, even though JIT was never their stated target. If you cannot see the swap before it is ordered, you cannot mint before it.

## Realistic scorecard

| Dimension | Ethereum (Uniswap v3, 2021–2023) | Solana (Sep 2026) |
|---|---|---|
| Classic third-party JIT | Real, ~0.3–0.5% of volume, 1–2 dominant bots | Effectively unavailable: no mempool, sequencing hidden until shreds/preconfs |
| Own-flow / RFQ JIT | Possible | Possible; this is what routers and RFQ desks already do |
| Predictable-flow JIT (DCA, liquidations) | Possible | Possible; the main live angle |
| Capital needed | Very high (~269x swap size on average) | Same |
| Per-trade margin | ~0.007% ROI average before tips | Same order of magnitude, minus Jito tip |
| Main cost drivers | Gas, hedging (1–2 bps), builder tip | Tip, tick-array rent on cold pools, hedging |
| Risk profile | Near-zero LVR; execution and hedging risk only | Same, plus bundle-landing uncertainty |
| Harm to passive LPs | ~85% fee dilution on targeted swaps | Would be the same if it existed at scale |
| Perps analogue | none native | Drift/Velocity JIT auctions, protocol-sanctioned |

Bottom line: on Solana, JIT as a standalone MEV strategy is a paper trade. JIT as a **capability** inside something you already run (a router, an RFQ integration, a liquidation engine that knows a big swap is about to happen) is real and worth building.

## How this connects to the rest of the stack

<!-- level: intermediate -->

- **Backrunning arb** is JIT's mirror image. Backrunning reacts to a swap after it lands and captures the price displacement it caused. JIT gets ahead of the same swap and captures the fee while *reducing* the displacement. On Solana the detection pipeline is identical (shreds, preconfs, BAM signals), but only the backrun is executable against third-party flow. If you can predict a swap well enough to JIT it, you can usually also backrun it, and the two are not mutually exclusive in one bundle.
- **Market making** supplies the P&L model. A JIT position is a two-sided quote for one counterparty. The fee is the spread, the inventory you end up holding is exactly the adverse-selection cost, and the CEX hedge is the same hedge a market maker runs continuously. The difference is that JIT knows its counterparty's size and direction in advance, which is the market maker's dream and the reason the strategy is so capital-efficient per unit of risk.
- **Concentrated-liquidity LP-ing** is the baseline JIT competes with. Everything in this doc about dilution is a cost to the passive strategy. If the stack runs passive CLMM positions anywhere, knowing which pools and swap sizes attract JIT is a direct input to where those positions are profitable.
- **Perps market making** on Drift/Velocity is JIT in its sanctioned form. The auction-watching, fast-quote infrastructure for JIT auctions is the same latency-sensitive quoting stack an order-book market maker needs.

---

## Sources

- Uniswap Labs, "Just-In-Time Liquidity on the Uniswap Protocol" (May 2021–Jul 2022 study): https://blog.uniswap.org/jit-liquidity
- Xiong et al., "Demystifying Just-in-Time (JIT) Liquidity Attacks on Uniswap V3" (IACR ePrint 2023/973): https://eprint.iacr.org/2023/973
- Capponi, Jia, Zhu, "The Paradox of Just-in-Time Liquidity in Decentralized Exchanges" (arXiv 2311.18164): https://arxiv.org/abs/2311.18164
- "Strategic Analysis of Just-In-Time Liquidity Provision in Concentrated Liquidity Market Makers" (AFT 2025, arXiv 2509.16157): https://arxiv.org/abs/2509.16157
- Milionis, Moallemi, Roughgarden, Zhang, "Automated Market Making and Loss-Versus-Rebalancing": https://arxiv.org/pdf/2208.06046
- Helius, "Solana MEV: An Introduction" (Jito mempool shutdown, bundle basics): https://www.helius.dev/blog/solana-mev-an-introduction
- Jito docs, low-latency transaction send / bundles (5-tx limit, atomicity, tips, 50 ms auction): https://docs.jito.wtf/lowlatencytxnsend/
- Jito Labs, ShredStream proxy: https://github.com/jito-labs/shredstream-proxy
- Jito docs, ShredStream (September 5, 2026 shutdown notice, DoubleZero Edge migration): https://docs.jito.wtf/lowlatencytxnfeed/
- Helius, "Block Assembly Marketplace (BAM)": https://www.helius.dev/blog/block-assembly-marketplace-bam
- Pine Analytics, "An Introduction to Jito's Block Assembly Marketplace": https://pineanalytics.substack.com/p/bam-and-the-future-of-solana-defi
- Solana Compass, "Jito BAM Preconfirmations Go Live" (Sep 9, 2026): https://solanacompass.com/news/jito-bam-preconfirmations-go-live-on-solana-covering-34-of-network-stake
- Raydium docs, CLMM overview (per-position fee accrual, position NFTs, tick-array rent): https://docs.raydium.io/products/clmm/overview
- Orca, "Create Pools for Less with Orca's Dynamic Tick Arrays": https://orca-so.medium.com/create-pools-for-less-with-orcas-dynamic-tick-arrays-13e8c5dbcc8c
- Orca Whirlpools program source, tick state: https://github.com/orca-so/whirlpools/blob/main/programs/whirlpool/src/state/tick.rs
- "Deep-Dive on Meteora DLMM" (bins, active bin, per-bin fees, 69-bin position limit): https://tutorials.hashnode.dev/deep-dive-on-metora-dlmm
- Meteora, "DLMM: New dynamic liquidity protocol to boost LP fees on Solana": https://meteoraag.medium.com/dlmm-new-dynamic-liquidity-protocol-to-boost-lp-fees-on-solana-84867bad0907
- Drift, "Just-in-Time (JIT) Liquidity Mechanism": https://www.drift.trade/updates/jit-liquidity-mechanism
- Velocity (formerly Drift) docs, JIT auctions for market makers: https://docs.velocity.exchange/developers/market-makers/jit-auctions
- Velocity docs, Rewards (0.25 bps flat maker rebate): https://docs.velocity.exchange/protocol/rewards
- The Defiant, "Drift Protocol Rebrands to Velocity DEX Ahead of Relaunch": https://thedefiant.io/news/defi/drift-protocol-rebrands-to-velocity-dex-ahead-of-relaunch
- Trail of Bits, "Building secure Uniswap v4 hooks" (LiquidityPenaltyHook bypass): https://blog.trailofbits.com/2026/07/30/building-secure-uniswap-v4-hooks/
- Uniswap hooklist, LiquidityPenaltyHook entry: https://github.com/Uniswap/hooklist/pull/5739
- Jupiter developer docs, "How Jupiter Swap Works" (Metis route splitting): https://developers.jup.ag/docs/guides/swap/how-swap-works
