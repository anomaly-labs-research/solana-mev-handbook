# Market Making, In Depth

_As of Sep 2026._

Market making is deceptively simple to state and genuinely hard to do well — the entire discipline is about managing one central tension.

## The core idea

You continuously offer to both buy and sell an asset. You post a **bid** (price you'll buy at) and an **ask** (price you'll sell at), with the ask higher than the bid. The gap is the **spread**.

Example on an order book:

- SOL mid-price: $100
- Your bid: $99.90 (you'll buy here)
- Your ask: $100.10 (you'll sell here)
- Spread: $0.20

If one trader sells to your bid and another buys from your ask, you bought at $99.90 and sold at $100.10 — **$0.20 profit**, and you never took a directional view. You're a shopkeeper: buy wholesale, sell retail, earn the markup, do it thousands of times.

Your profit is roughly: **spread × volume × fill rate.** Tighten the spread and you win more volume but earn less per trade; widen it and you earn more per trade but win less volume. That tradeoff is the first dial.

## The central tension: you get filled precisely when you don't want to be

Your two orders don't get hit randomly. **You get filled on the side the market is moving against.**

If good news hits and SOL is genuinely heading to $105, informed traders lift your $100.10 ask *fast* — you sell SOL cheaply right before it rises. If SOL is crashing to $95, they hit your $99.90 bid — you buy right before it falls. You systematically accumulate the wrong inventory at the wrong time.

This is **adverse selection**, and it's the same force as LVR — just in order-book clothing. The traders who take your quotes know something (or are simply faster than your quote updates), and you're the passive counterparty eating it.

So market making is a fight between two revenue streams:

- **Spread capture** from uninformed/noise traders (people trading for reasons unrelated to price direction — this is your profit).
- **Adverse selection losses** to informed traders (this is your cost).

You're profitable only when spread capture > adverse selection. Everything sophisticated in market making is about widening that difference.

## Inventory risk, made concrete

Say you've been getting hit on your bid repeatedly — now you're holding 500 SOL you didn't want. You're no longer neutral; you're long 500 SOL and exposed to it dropping. If it falls $2, you're down $1,000 regardless of any spread you earned.

Market makers manage this with **inventory skewing**: shift your quotes to encourage trades that flatten your position. Holding too much SOL? Lower *both* your bid and ask. Now your ask is more attractive (people buy your excess SOL from you) and your bid is less attractive (you stop accumulating more). You're nudging the market to rebalance you back toward neutral.

The classic formalization is the **Avellaneda-Stoikov model**, which sets your quotes around a "reservation price" that shifts away from the mid based on how much inventory you hold and how risk-averse you are. Intuition, no heavy math:

- **Reservation price** = mid-price adjusted for your inventory. Long too much SOL → your personal "fair value" drops below mid → you quote lower to shed it.
- **Optimal spread** widens with volatility (more risk per unit time) and with how much time is left in your trading horizon.

The two knobs: *where* you center your quotes (inventory control) and *how wide* you make them (adverse-selection and volatility protection).

## DEX vs. order-book market making — an important split

They're mechanically very different.

**Order-book MM (Phoenix on Solana, or a CEX):** You actively post and cancel limit orders. You have fine control — you reprice constantly as the market moves, skew for inventory, pull quotes when you're uncertain. This is "real" market making and where the sophisticated strategies live. Phoenix is notable because it's a fully on-chain *central limit order book*, so you get order-book mechanics with on-chain settlement. The challenge: repricing costs transactions, and on Solana you're repricing against that 400ms slot clock — you can't update quotes continuously the way you can on a CEX with microsecond APIs.

**AMM LP-ing (Orca, Raydium):** You're a *passive* market maker. You deposit into a pool and the AMM formula quotes on your behalf using `x * y = k`. You can't reprice or skew — the curve does it mechanically. This means:

- You cannot pull your quotes when informed flow shows up. You eat *maximum* adverse selection (this is exactly LVR).
- Your only levers are *which* pool and, in concentrated liquidity (Orca Whirlpools), *what price range* you provide in.
- **Concentrated liquidity is the bridge:** by picking a tight range, you're crudely mimicking an order-book maker who concentrates depth near the current price — earning more fees per dollar but bleeding more LVR when price moves out of your range, and earning nothing when price leaves it entirely.

The key insight: an AMM LP is a market maker with their hands tied. An order-book MM has full control but must actively manage everything. More control = more upside but more work and more ways to lose.

## What actually determines if you make money

Five factors, roughly in order of importance:

1. **Flow toxicity** — what fraction of your counterparties are informed vs. noise. Retail-heavy venues are profitable; venues dominated by other bots are toxic. *Where* you make markets matters more than how.
2. **Speed of requoting** — how fast you update quotes when the market moves. Slow requoting = you're a sitting duck for adverse selection. On Solana this is slot-bound, a real structural constraint.
3. **Inventory discipline** — never letting your position drift so far that one adverse move wipes out days of spread earnings.
4. **Spread width calibration** — tight enough to win flow, wide enough to survive volatility. Dynamic, not fixed.
5. **Fee tier / rebate structure** — many venues pay makers a rebate. That rebate can be the entire margin; the spread is gravy.

## How this connects to arbitrage

Market making and arbitrage are two sides of liquidity provision, and they share infrastructure:

- Both need **fast, accurate price feeds** and low-latency execution against the slot clock (300ms since August 2026).
- Arb is *taking* (you cross the spread to capture a gap); MM is *making* (you post the spread and wait). A sophisticated operation often does both — an arb engine already knows the "true" price across venues, which is *exactly* the input a market maker needs to set fair quotes and detect when its own quotes are stale.
- The MEV/adverse-selection framing is identical: in arb you're the informed taker collecting LVR; in MM you're the passive maker *paying* it. Understanding both sides makes you better at each — when you're market making, you now know exactly who's picking you off and why.

## The Avellaneda-Stoikov model, with the formulas

Now the math behind the intuition above. Avellaneda and Stoikov (2008) model a market maker who quotes around a mid-price `s` that follows a random walk with volatility `sigma`, holds inventory `q`, and must be flat by a horizon `T`. Fills arrive at a rate that decays exponentially with distance from the mid: `lambda(delta) = A * exp(-k * delta)`. Solving for the quotes that maximize expected utility gives two closed forms.

**Reservation price** (where you center your quotes):

    r = s - q * gamma * sigma^2 * (T - t)

**Optimal total spread** (bid-to-ask, centered on `r`):

    delta_ask + delta_bid = gamma * sigma^2 * (T - t) + (2 / gamma) * ln(1 + gamma / k)

What each symbol means:

- `s` — current mid-price.
- `q` — your inventory in base units, signed (long positive, short negative). Hummingbot uses deviation from *target* inventory, which is the practical reading.
- `gamma` — **risk aversion**, in units of 1/price. Higher gamma = you hate inventory more = quotes skew harder and widen. Hummingbot users typically run values in the 1–20 range after normalizing; the raw paper values are tiny (0.1 or less) because they're in raw price units.
- `sigma` — volatility of the mid, in price units per square root of your time unit. Must match the units of `T - t`.
- `T - t` — time left in the session. More time left = more chance inventory hurts you = bigger skew and wider spread.
- `k` — **order-book liquidity / arrival decay**. High k means fills die off fast as you quote away from mid (a dense, competitive book), so the model tightens. Low k means you can quote wide and still get filled.
- `A` — baseline arrival rate. Drops out of the two formulas above but matters for the GLFT version below.

**Worked example.** SOL mid `s = $100`, daily volatility 2% so `sigma = $2/day^0.5` and `sigma^2 = 4`, half a day left (`T - t = 0.5`), `gamma = 0.05`, `k = 1.5`.

- Flat (`q = 0`): `r = 100`. Spread `= 0.05 * 4 * 0.5 + (2/0.05) * ln(1 + 0.0333) = 0.10 + 1.31 = $1.41`. Bid **$99.29**, ask **$100.71**.
- Long 5 SOL (`q = +5`): `r = 100 - 5 * 0.05 * 4 * 0.5 = $99.50`. Spread is unchanged at $1.41 (it doesn't depend on q). Bid **$98.79**, ask **$100.21**.

Read the skew: being long moved *both* quotes down $0.50. Your ask now sits 21 cents above mid instead of 71 — you're practically begging someone to take your SOL — while your bid retreated to $1.21 below mid so you stop accumulating. Push `q` or `gamma` higher and the ask drops *through* the mid: the model is telling you to cross the spread and dump. That's a feature; it's the point where holding is worse than paying to exit.

**Practical simplifications people actually run:**

- **Infinite horizon (Guéant–Lehalle–Fernandez-Tapia, 2011/2013).** A perpetual bot has no `T`. GLFT add hard inventory bounds ±Q and solve the long-horizon limit, where `(T - t)` vanishes and the quotes become closed forms:

      delta_bid ≈ (1/gamma) * ln(1 + gamma/k) + ((2q + 1) / 2) * sqrt( sigma^2 * gamma / (2 * k * A) * (1 + gamma/k)^(1 + k/gamma) )
      delta_ask ≈ (1/gamma) * ln(1 + gamma/k) - ((2q - 1) / 2) * sqrt( ...same term... )

  Same structure: a constant half-spread term plus a skew that is *linear in q*. Spread grows with `sigma` and shrinks with `k` and `A`. This is the version most production code descends from.
- **Fixed rolling horizon.** Hummingbot's "infinite" mode keeps a finite `closing_time` but lets `t` cycle and recalibrates parameters each time `t = T`, so the `(T - t)` term stays bounded.
- **Backing out gamma from spreads you'd accept.** Rather than guessing risk aversion, Hummingbot bounds it as `gamma <= (max_spread - min_spread) / (2 * |q| * sigma^2)` and scales by a 0–1 aversion knob, then estimates `k` and `A` from live order-book depth (a 200-tick buffer by default).

The two dials from the intuition section survive intact: `r` is *where* (inventory control), the spread formula is *how wide* (volatility and book-density protection).

## Measuring flow toxicity

"Where you make markets matters more than how" is only actionable if you can measure toxicity. Two families of metric:

**VPIN / order-flow imbalance (the academic one).** Easley, López de Prado and O'Hara's **Volume-synchronized Probability of INformed trading** slices trading into `n` equal-*volume* buckets (not equal time), classifies each bucket's volume as buy- or sell-initiated, and takes the average absolute imbalance:

    VPIN = (1/n) * sum_i |V_buy_i - V_sell_i| / V

Ranges 0 (balanced flow) to 1 (every bucket one-sided). Classification is usually **bulk volume classification**: assign the buy fraction of a bucket from the normal CDF of its standardized price change, so a bucket that rallied is mostly buys. The canonical window is ~50 buckets. High VPIN means persistent one-sided flow, which is what informed trading looks like from the maker's chair. Caveat: Andersen and Bondarenko argue its Flash-Crash "prediction" was mostly a volume–volatility artifact, and it is sensitive to bucket size. Treat it as a venue-level regime indicator, not a per-quote signal.

**Markout (the practical one).** Markout is simply: after I got filled, where did the mid go? It is the direct, dollar-denominated measurement of adverse selection on *your own* fills, and it needs nothing but your fill log and a mid-price series.

How to compute it from fills, per fill and per horizon `h` (1s, 10s, 1min are the standard trio; add 100ms if you're fast and 5min if you hold):

    buys:  markout_h  = (mid(t_fill + h) - fill_price) / fill_price * 10_000   (bps)
    sells: markout_h  = (fill_price - mid(t_fill + h)) / fill_price * 10_000

Positive means the market moved *in your favor* after the fill (you bought and it went up). Join every fill to the mid at `t + h` (an as-of join), then average per horizon, per venue, per counterparty type, per hour-of-day. Plot the averages against `h` and you get a **markout curve**. Compute it fill-to-mid (includes your half-spread) and mid-to-mid (pure information content) — both are useful.

What good and toxic look like, for a maker quoting a 10 bps half-spread:

- **Good flow:** fill-to-mid markout starts near +10 bps at `h = 0` (you captured the half-spread), drifts down a few bps as the mid nudges against you, and flattens around **+5 to +8 bps** by 1 minute. Mid-to-mid is near zero or mildly *positive* (mean reversion — noise traders pushed price, it came back). You keep most of the spread.
- **Toxic flow:** fill-to-mid drops fast and *keeps* falling: **0 bps by 1s, −5 bps by 10s, −15 bps by 1 minute**, with no recovery. Mid-to-mid is steeply negative. The taker knew where price was going; your spread was a discount they collected. If the curve never flattens, the counterparties are hedging against a faster venue and your quote is the stale one.

Two more things the curve tells you. Where it *flattens* is your permanent adverse-selection cost per fill — that number, not the quoted spread, is what you need fee-plus-rebate to exceed. And *how long* it takes to flatten is your hedging window: if the damage is done by 1s, you need to hedge inside a slot or not at all. Segment the curve by taker (known arb wallets vs. everything else) and you will usually find a small set of addresses producing most of the negative markout — the on-chain equivalent of a CEX's "toxic client" list.

## Market making on Solana venues, concretely

The venues differ in *how orders settle*, *what a requote costs you*, and *who pays whom*. First the constraint everything sits on: Solana mainnet slot time was 400ms for years, dropped to 350ms on Aug 19, 2026 and to **300ms on Aug 25, 2026**, with 250ms and 200ms live on devnet/testnet but unscheduled for mainnet. Every "400ms" in the sections above should now be read as "one slot, currently 300ms". A requote is a transaction; you cannot update faster than the slot, and in practice you land one cancel-and-replace per slot at best.

**Phoenix (Ellipsis Labs)** — a fully on-chain CLOB whose defining feature is being **crankless**. Serum/OpenBook-style books leave fills in an event queue that a third-party "crank" bot must process before anyone can withdraw; Phoenix keeps a single account per market holding all traders' balances, so the matching transaction updates both sides atomically — no pending state, no bot dependence. Makers hold **seats** (a per-market registration) which lets the program keep quoting cheap for accounts that cancel and replace constantly. Fees are per-market parameters charged to the taker in the quote token; maker fee on spot is generally zero (unverified — the fee page I could read is for Phoenix's newer perps venue, which lists 3.5 bps taker / 0.5 bps maker). Ellipsis reports major Solana spot pairs compressing from ~30 bps to ~5 bps price impact once Phoenix makers arrived.

**OpenBook v2** — the Serum lineage, rebuilt on Mango v4 code. Still uses the request/event-queue design (`place_order` emits events, `consume_events` settles), so someone must crank, though v2's hybrid crank is lighter than Serum's. Published fee model: **4 bps taker, 2 bps maker rebate**, plus a 2 bps referrer/UI rebate for anyone hosting their own frontend or SDK integration; stable markets 1 bps / 0.5 bps (unverified). Supports oracle-pegged orders that reprice with an oracle without you sending a tx (unverified).

**Manifest (CKS Systems)** — a **feeless** spot CLOB: the core program charges no maker or taker fee ever; fees, if any, live in optional wrapper programs. Crankless like Phoenix, market creation costs 0.007 SOL of rent (vs. ~2 SOL OpenBook, 3+ SOL Phoenix), and the whitepaper claims roughly 45% less compute per order than Phoenix (unverified). Two features aimed squarely at makers: **global orders** let one pool of capital rest bids on many markets and only move tokens at fill time, and **reverse orders** flip side when filled, mimicking a one-tick AMM range without a requote.

**Drift / Velocity** — Drift was drained of roughly $285–295M on 1 Apr 2026 (a compromised admin/multisig path, not a matching-engine bug) and relaunched as **Velocity** on 1 Jul 2026 in private beta, reportedly USDT-settled (unverified); the JIT design below is Drift's and carries over to Velocity, whose docs now serve it. A perps venue with three liquidity layers: **JIT auctions**, a decentralized limit order book (DLOB) and a backstop AMM. A taker's market order opens a reverse Dutch auction from a start price (best for the taker) linearly to an end price (their limit) over a duration set in 400ms wall-clock units — `duration = 10` is 4 seconds regardless of slot time. Makers call a single instruction that places, fills against the taker and settles in one transaction, so you never rest a stale order on the book. Fills go sequentially by price, not pro rata; unfilled size falls through to the DLOB, then the AMM. Fee schedule on majors: taker **6 / 5 / 4 / 2 bps** by 30-day volume tier, maker rebate a flat **0.25 bps** at every tier (older docs quoted up to 2 bps; the schedule has been cut). Spot on Velocity has no orderbook and no maker fee. Treat the rebate schedule as beta-era and subject to change.

**Passive MM via concentrated liquidity** — Orca Whirlpools, Raydium CLMM, Meteora DLMM. Fee tier picks your tick granularity: Orca tiers run 0.01% to 2% with tick spacing tied to the tier; Raydium's four standard configs are 0.01%/1 tick, 0.05%/10, 0.25%/60, 1%/120. Positions out of range earn exactly zero fees (the fee-growth accumulator for the range stops moving). Raydium routes 84% of swap fees to LPs, the rest to RAY buybacks and treasury (unverified). Meteora DLMM arranges liquidity in discrete **bins** with zero slippage inside a bin and a **dynamic, volatility-aware fee** that rises when price is whipping — the closest an AMM gets to "widen when vol is high". Requote cost here is a position rebalance (burn + mint + swap), so you rebalance on a timer or a band, not per slot.

**What a requote costs.** Base fee is 5,000 lamports per signature; the priority fee is `ceil(cu_price * cu_limit / 1e6)` lamports and goes entirely to the leader. Illustrative: a cancel-and-place using 40k CU at 50k micro-lamports/CU pays 2,000 + 5,000 = 7,000 lamports, about $0.0014 at $200 SOL. Requoting *every* slot at 300ms is ~288k transactions/day, roughly **$400/day per market** in fees alone before any congestion premium — which is why nobody requotes every slot on every market, and why maker rebates (2 bps on a $1,000 fill is $0.20, or ~140 requotes) are the margin.

**Last look and quote staleness.** On a CEX, some venues give makers a **last look**: a few milliseconds to reject a fill after the taker commits. On-chain there is no such thing — your resting order is a firm commitment until your cancel *lands*, and the taker effectively gets the last look instead: they see your quote *and* the Pyth/Binance price in the same instant and only hit you when you're wrong. Your **staleness window** is the gap between the market moving and your cancel being included: at minimum one slot, realistically two to three once you count RPC propagation and leader scheduling, and much worse under congestion. Every design that helps is a way of shortening or sidestepping that window: JIT (never rest), oracle-pegged orders (the program reprices for you), wider spreads in the seconds after an oracle update, and pulling quotes entirely when your own markout at 1s turns negative.

| Venue | Model | Fee / rebate | Requote cost |
|---|---|---|---|
| Phoenix (spot) | On-chain CLOB, crankless, atomic settlement, maker seats | Taker pays per-market fee in quote token; maker ~0 (unverified) | 1 tx per cancel/replace, base + priority fee |
| OpenBook v2 | On-chain CLOB, event queue + crank | 4 bps taker / 2 bps maker rebate (+2 bps UI rebate) | 1 tx per cancel/replace, plus crank dependency for settlement |
| Manifest | On-chain CLOB, crankless, feeless core, global orders | 0 / 0 in core; wrappers may add fees | 1 tx; lowest compute per order of the three (unverified); reverse orders avoid some requotes |
| Drift / Velocity (perps; post-exploit relaunch, private beta) | JIT auction + DLOB + AMM backstop | Taker 6→2 bps by tier; maker rebate 0.25 bps flat | JIT: 1 tx per fill, none to rest; DLOB: 1 tx per cancel/replace |
| Orca / Raydium CLMM | Concentrated-liquidity AMM, passive | LP earns pool fee tier (0.01%–2%); Raydium LP share 84% (unverified) | Rebalance = burn + mint (+ swap), so periodic not per-slot |
| Meteora DLMM | Binned liquidity, dynamic volatility fee | LP earns base + variable fee in active bin | Rebalance across bins, periodic |

## LVR, quantified

The intuition section called adverse selection on an AMM "exactly LVR". Here is the number. Milionis, Moallemi, Roughgarden and Zhang (2022) define **loss-versus-rebalancing** as the gap between an LP's position and a portfolio that holds the same token quantities but rebalances at the *external* market price instead of the pool's stale one. Arbitrageurs capture exactly this gap. In continuous time, with the risky asset following geometric Brownian motion with volatility `sigma`:

    LVR rate = (sigma^2 * P^2 * |x*'(P)|) / 2  =  -(sigma^2 * P^2 * V''(P)) / 2

where `x*(P)` is the pool's holding of the risky asset as a function of price (its demand curve) and `V(P)` the pool value. `|x*'(P)|` is the pool's **marginal liquidity** — how much it hands over per unit of price move — so LVR scales *linearly with depth at the current price* and **quadratically with volatility**. The intuitive version: losses scale with variance, and the AMM's curvature converts every price wiggle into a small, guaranteed sale-at-the-wrong-price.

For a constant-product pool this collapses to a clean constant:

    LVR / pool value = sigma^2 / 8   per unit time

Worked: ETH-USDC at 5% daily vol gives `0.05^2 / 8 = 3.125 bps per day`, about **11% per year** of pool value handed to arbitrageurs. At a 30 bps fee tier the pool must turn over about **10.4% of its assets per day** in fee-paying volume just to break even against LVR; double volatility to 10% and the required volume quadruples. The same paper finds that over 99.99% of LP return *variance* in the ETH-USDC v2 pool is plain market beta — the LVR term is small in variance but it is a steady negative drift, which is precisely what compounds.

**The empirical finding.** Loesch, Hindman, Richardson and Welch (2021) audited 17 Uniswap v3 pools covering 43% of TVL from launch to late 2021: those pools earned **$199.3M in fees against $260.1M of impermanent loss**, a net **−$60.8M versus holding**. Roughly half of individual LP positions lost money against holding (unverified), and among active managers the more frequently a position rebalanced the worse it did on average. Concentrated liquidity did not fix the problem; it made the bet bigger.

**What this implies for concentrated-liquidity market making:**

- Concentration is *leverage on the same bet*. Tightening the range multiplies your share of fees and `|x*'(P)|` by the same factor, so the fee/LVR ratio is unchanged by concentration alone. It only helps if the *volume-to-volatility* ratio at that price is high enough — i.e. lots of uninformed swaps and little repricing.
- Out of range you earn nothing but also pay no LVR — you're just holding one asset. Pretending an out-of-range position is "waiting" ignores that it's now a directional bet with zero income.
- Every rebalance realizes the loss and pays a swap fee to do it. The break-even test is per-rebalance: cumulative fees since last rebalance versus `sigma^2 * P^2 * |x*'(P)| / 2` integrated over the same window plus the rebalance cost.
- Fees that rise with volatility (Meteora's dynamic fee) and shorter block times (the arbitrageur gets fewer free bps per correction) both attack the `sigma^2` term directly; they are the AMM-side analogues of an order-book maker widening spreads and requoting faster.
- If your markout on CLMM "fills" (price crossing your ticks) looks like the toxic curve above, LVR is the reason, and the only levers are fee tier, range width, rebalance cadence, and — most of all — the pair.

## Where to go next

- **Calibrate A-S on your own fills.** You have the formulas; the hard part is estimating `k` and `A` from live depth and picking `gamma` so the skew stays inside your risk limits.
- **Build the markout pipeline first, before any strategy.** Fill log + as-of join to mid at 1s/10s/1min, segmented by venue and taker. It is the one metric that tells you whether any of the rest is working.
- **Per-venue rebate math.** Take the table above, plug in your realistic requote cadence and fill rate, and see which venues are net positive *before* spread capture.
- **Hedging the inventory leg.** A-S assumes you shed inventory by skewing; a perps venue lets you hedge it instead. Cross-venue MM (quote spot, hedge on Drift/Velocity or another perps venue) is the natural next step for a stack that already does arb.

## Sources

Read for this document; access dates Sep 2026. Papers first, then venue and protocol documentation.

- Avellaneda & Stoikov, *High-frequency trading in a limit order book* (2008) — https://www.math.nyu.edu/~avellane/HighFrequencyTrading.pdf (PDF fetched; formulas cross-checked against the Hummingbot pages below because the PDF text would not extract)
- Guéant, Lehalle & Fernandez-Tapia, *Dealing with the Inventory Risk* — https://arxiv.org/html/1105.3115v5
- Hummingbot, Avellaneda Market Making strategy docs — https://hummingbot.org/strategies/v1-strategies/avellaneda-market-making/
- Hummingbot, *Technical deep dive into the Avellaneda & Stoikov strategy* — https://hummingbot.org/blog/technical-deep-dive-into-the-avellaneda--stoikov-strategy/
- Hummingbot, *Guide to the Avellaneda & Stoikov strategy* — https://hummingbot.org/blog/guide-to-the-avellaneda--stoikov-strategy/
- Milionis, Moallemi, Roughgarden & Zhang, *Automated Market Making and Loss-Versus-Rebalancing* — https://arxiv.org/abs/2208.06046 and https://arxiv.org/pdf/2208.06046
- a16z crypto, *LVR: quantifying the cost of providing liquidity to AMMs* — https://a16zcrypto.com/posts/article/lvr-quantifying-the-cost-of-providing-liquidity-to-automated-market-makers/
- Loesch, Hindman, Richardson & Welch, *Impermanent Loss in Uniswap v3* — https://arxiv.org/abs/2111.09192
- QuantMedia, *What is VPIN?* — https://quantmedia.io/learn/what-is-vpin.html
- Databento microstructure guide, *Markout* — https://databento.com/microstructure/markout
- QuestDB cookbook, *Post-trade markout analysis* — https://questdb.com/docs/cookbook/sql/finance/markout/
- Ellipsis Labs, phoenix-v1 repository — https://github.com/Ellipsis-Labs/phoenix-v1
- Solana Compass, Phoenix project page — https://solanacompass.com/projects/Phoenix
- Solana Compass, *Level up: go crankless* (Jarry Xiao, Ellipsis) — https://solanacompass.com/learn/Validated/level-up-go-crankless-w-jarry-xiao-ellipsis-labs
- Phoenix (perps) docs, Fees — https://docs.phoenix.trade/phoenix/matching-engine/fees and https://docs.phoenix.trade/
- Solana Compass, OpenBook project page — https://solanacompass.com/projects/openbook
- openbook-dex/openbook-v2 repository — https://github.com/openbook-dex/openbook-v2
- CKS-Systems/manifest repository — https://github.com/CKS-Systems/manifest
- CKS Systems, *The Orderbook Manifesto* — https://www.manifest.trade/assets/The_Orderbook_Manifesto.pdf
- The Defiant, *Drift Protocol rebrands to Velocity DEX ahead of relaunch* (Apr 2026 exploit, ~$295M) — https://thedefiant.io/news/defi/drift-protocol-rebrands-to-velocity-dex-ahead-of-relaunch
- CryptoTimes, *Drift rebrands to Velocity ahead of private beta launch* (Jul 2026) — https://www.cryptotimes.io/2026/07/02/drift-rebrands-to-velocity-ahead-of-private-beta-launch/
- Drift / Velocity docs, Trading fees — https://docs.velocity.exchange/trading/trading-fees
- Drift / Velocity docs, JIT auctions — https://docs.velocity.exchange/developers/market-makers/jit-auctions
- Orca docs, *Ticks, tick spacing and fee tiers* — https://docs.orca.so/liquidity/concepts/ticks-and-fees
- Raydium docs, CLMM fees — https://docs.raydium.io/products/clmm/fees
- Meteora docs index (DLMM overview) — https://docs.meteora.ag/
- Solana docs, *Transaction fees* — https://solana.com/docs/core/fees
- Solana, *Reduced slot times* upgrade page — https://solana.com/upgrades/reduced-slot-times
