# Launchpad Sniping, In Depth

_As of Sep 2026._

Launchpad sniping is the purest latency game on Solana: the whole edge is being the first buyer on a brand-new bonding curve, before anyone else has moved the price. It is also the strategy where the counterparty is most often the person who created the token. Understanding both facts is the difference between a strategy and a donation.

## The core idea

A **launchpad** lets anyone create a token for free and immediately sells it on a **bonding curve**: a deterministic price schedule where every buy pushes the price up and every sell pushes it down. There is no order book, no LP to seed, and no liquidity at all beyond what buyers put in.

Because the curve is deterministic, the first buyer always gets the lowest price. If a token attracts N SOL of buying after you, your position is worth a known, computable multiple. **Sniping** is buying in the same slot as the token's creation (or the same slot as its migration to a real DEX) so that you *are* that first buyer, then selling into the buyers who arrive after you.

The intuition: you are not predicting which meme wins. You are buying a ticket at the guaranteed-lowest price and selling it a few seconds later to whoever shows up. The strategy lives or dies on (a) how often anyone shows up, and (b) whether the creator was already standing in front of you.

## How a bonding-curve launchpad works: pump.fun

Pump.fun's curve is a **constant-product AMM with virtual reserves**: the same `x * y = k` as Uniswap V2, except the SOL side starts with a fictional 30 SOL that nobody deposited. The virtual SOL gives the curve a starting price greater than zero; the real SOL is what buyers actually pay in.

The official program constants (token has 6 decimals, so 1e15 base units = 1 billion tokens):

| Constant | Value |
|---|---|
| Total supply | 1,000,000,000 tokens |
| Initial virtual token reserves | 1,073,000,000 |
| Initial virtual SOL reserves | 30 SOL |
| Initial real token reserves (sellable on the curve) | 793,100,000 |
| Invariant `k` | 30 × 1.073B = 3.219 × 10^10 |
| Curve completes when | real token reserves hit 0 |

Working the arithmetic: the curve is exhausted when 793.1M tokens have been sold, leaving 279.9M virtual tokens. Then `vSOL = k / 279.9M = 115 SOL`, so buyers must put in **115 − 30 = 85 SOL** to complete the curve. Starting price is 30 / 1.073B ≈ 2.80 × 10^-8 SOL per token (a "market cap" of ~28 SOL on the full billion supply); ending price is 115 / 279.9M ≈ 4.11 × 10^-7, a **14.7x** rise from first buy to graduation, with market cap around 411 SOL. The marketing figure of "~$69k graduation" is just that 411 SOL at a historical SOL price; the on-chain trigger is the token reserve hitting zero, not a dollar number.

The remaining ~207M tokens (1B − 793.1M) are held back and, together with the ~85 SOL, become the initial liquidity of the post-graduation pool.

**Fees on the curve** (pump.fun docs, last updated 20 May 2026): 1.25% per trade, split 0.30% to the creator and 0.95% to the protocol. Creating a coin costs 0 SOL; migration costs 0.015 SOL. Fees have changed several times (the older program README still says 100 bps), so treat any fee figure as dated.

### Worked example: first buyer, then sell after N SOL of inflow

You land the very first buy of 1 SOL in the creation slot.

- Fee: 1.25% → 0.9875 SOL reaches the curve. New `vSOL` = 30.9875.
- New virtual tokens = k / 30.9875 = 1,038.81M. You receive 1,073M − 1,038.81M = **34.19M tokens** (3.42% of supply) at an average 2.89 × 10^-8 SOL each.

Case A: **20 SOL of organic buying follows** (gross, fees included). `vSOL` rises to 50.74; spot price is 2.68x your entry. You sell all 34.19M tokens: reserves go back to k / (631.3M + 34.19M) = 48.37 SOL, so you receive 2.59 SOL gross, **2.56 SOL net of fee**. Profit **+1.56 SOL** on 1 SOL. Notice you do not capture the 2.68x spot move; your own sell walks the price back down.

Case B: **the token graduates** (85 SOL total in). Selling 34.19M tokens at `vSOL = 115` returns **12.36 SOL**, about 12.4x. This is the outcome every sniper is underwriting, and it happens on well under 1% of launches (see below).

Case C: **nobody comes.** Zero inflow, you sell immediately: 0.975 SOL back. You need roughly **0.4 SOL of follow-on buying just to break even** on the round-trip fee plus your own price impact.

Case D: **a bundler was in front of you.** The creator's own wallets bought 5 SOL in the same slot, ordered before you. Your 1 SOL now buys 25.33M tokens, **26% fewer**. After the same 20 SOL of inflow the bundler dumps first for 11.42 SOL, and your exit shrinks from 2.56 SOL to **1.46 SOL**. Same token, same inflow, half the profit, because of transaction ordering inside a single slot. This one example is the entire strategy in miniature.

## Graduation and migration

When the curve completes, pump.fun atomically closes the curve and moves the SOL and remaining tokens into a **PumpSwap** pool (its own AMM, launched March 2025 to stop paying Raydium's migration fee). LP tokens are burned, so the pool liquidity is permanent. PumpSwap canonical pools charge a fee that steps down with market cap, from 1.25% total at the bottom tier (0.30% creator, 0.93% protocol, 0.02% LP) to 0.30% at the top tier (0.05% / 0.05% / 0.20%). Creator fees are collected into a vault the creator can claim, which is the legitimate revenue model for launching a token, and also the reason many creators launch dozens of tokens a day.

The migration itself is a second sniping opportunity, covered below.

## The other launchpads

Most of the 2025–2026 "launchpad wars" were fought on two underlying programs. **Raydium LaunchLab** and **Meteora's Dynamic Bonding Curve (DBC)** are permissionless curve programs; brands like Bonk.fun, Believe and Jupiter Studio are mostly *config accounts* inside one of those programs rather than separate contracts. This matters for a sniper: one decoder covers many front-ends.

| Launchpad | Underlying program | Curve | Default graduation | Notable for snipers |
|---|---|---|---|---|
| pump.fun | own program | constant product, virtual reserves | ~85 SOL in, ~411 SOL cap | Largest volume; standard SPL mint; migrates to PumpSwap |
| Raydium LaunchLab / Bonk.fun (LetsBonk) | LaunchLab | linear, exponential or logarithmic; "JustSendit" preset | 85 SOL (customizable) | 1% curve fee; since Aug 2025 all launches migrate to CPMM with LP burned/locked; Bonk.fun routes 30% of revenue to BONK buybacks and briefly held ~82% of curve volume in July 2025 |
| Believe, Jupiter Studio, others | Meteora DBC | multi-segment configurable curve | configurable (Believe: ~$100k cap; Jup Studio default 85 SOL) | **Fee scheduler**: launch fee starts very high and decays over time, explicitly to tax snipers; **rate limiter** raises fee with trade size; migrates to DAMM v1/v2 |
| Boop.fun | own program | bonding curve on 75% of supply | ~400 SOL bonded (unverified) | Much higher threshold; 5% of supply to BOOP stakers; low graduation counts |
| Moonshot (DEX Screener) | own program | quadratic: slow start, steep end | ~431 SOL cap when 80% sold | Mobile/fiat on-ramp audience; migrates to Meteora or Raydium |

The differences that actually change a sniper's math: the **curve shape** (a linear or quadratic curve gives the first buyer a smaller edge than constant-product with a small virtual reserve), the **share of supply on the curve** (LaunchLab and DBC can sell 100%, so there is no reserved chunk seeding the pool), **anti-sniper fees** (DBC's decaying fee can make a same-slot buy cost 50%+ of the notional, converting the snipe into a donation to the creator), and the **graduation size** (Boop's ~400 SOL threshold means far fewer graduations but much deeper post-curve liquidity).

## What "sniping" means, precisely

A snipe is a buy that lands **in the same slot as the create instruction**, ideally in the transaction immediately following it. Solana slots are ~300 ms (400 ms until August 2026) and a leader packs many transactions per slot, so "same slot" is a queue with hundreds of entrants. Being in the slot is not enough; **position within the slot** is what set the 26% haircut in Case D. Everyone who buys in slot 0 pays a price that depends only on who was ahead of them.

Pine Analytics found that by spring 2025 **over half of pump.fun tokens were bought in the exact slot they were created**. Same-slot entry stopped being an edge and became table stakes; the edge moved to *which* tokens to snipe and *how far forward* in the slot you land.

## The sub-strategies

**Same-slot creation sniping.** The baseline described above. Pure latency plus a filter. The filter matters more than the speed: sniping every launch is a guaranteed loss because most curves never see 0.4 SOL of follow-on buying.

**Dev-wallet and bundler detection.** The creator's create instruction is public, and so is their funding history. Snipers score a launch in the few hundred microseconds before deciding: has this deployer launched before, and what happened? Was the deployer funded minutes ago by a wallet that also funded twenty other fresh wallets (a **bundler** farm)? Does the create transaction already contain buys from multiple wallets (a **bundled launch**, where the creator buys with 5–20 wallets inside the create bundle)? MemeTrans found bundled accounts held **36.5% of supply** on average, and the first 10 buyers of high-risk launches held 17 percentage points more supply than on low-risk ones. If the dev is already holding 30%+ of supply in slot 0, you are their exit liquidity by construction. The counter-arms race exists: paid tools distribute SOL through 100+ hops specifically to defeat Bubblemaps-style clustering on Axiom, GMGN and Photon.

**Migration sniping.** When a curve completes, ~85 SOL and ~207M tokens move into a fresh PumpSwap (or CPMM / DAMM) pool. The migration transaction is visible in the same slot it lands, and post-migration pools are thin. The play is to buy in the migration slot betting on the "graduated" attention spike, or to arb the new pool against the last curve price. It is lower variance than creation sniping because the token has already attracted 85 SOL of demand, but graduations are rare (a few hundred a day network-wide) and are heavily contested.

**Copy-trading known wallets.** Instead of scoring tokens, score people. A handful of wallets are reliably early on winners; the arXiv pump.fun study found the single most profitable wallet booked **9,373 SOL** through 1,793 *sell-only* transactions, meaning it aggregated positions acquired elsewhere. Copy-traders follow such wallets' buys within the same slot. The catch, documented in the UCL copy-trading paper: manipulators know they are being copied and deliberately build "smart money" reputations, then use the followers as exit liquidity.

**Volume and social filters.** Slower snipes (seconds to minutes in) that wait for confirmation: unique-buyer count, buy/sell ratio, velocity of SOL inflow, a matching X post from a real account, a livestream. The arXiv study found **trading velocity** (reaching a SOL threshold in few trades) was the single strongest predictor of graduation, and that tokens with a non-bot trade share above 0.7 graduated markedly more often. You give up the slot-0 price for a much better base rate.

## Execution mechanics: why latency matters here more than almost anywhere

In most arbs, being 200 ms late costs you a fraction of a spread. In sniping, being 200 ms late means you are not in slot 0 at all; you are buying from the people who were.

**Detection.** Three tiers of data feed, in order of speed:

1. **Shreds** — raw block fragments streamed from the leader as it builds the block, before the block is complete or confirmed. This is how you see a create instruction *in the slot it is being built*, which is the only way to land a buy in that same slot. Jito ShredStream was the default source for years; Jito **shut it down on 5 September 2026** and pointed users to DoubleZero Edge, a multicast shred feed over private fibre that claims a 70%+ lead over competitors. Practitioners typically quote shreds as 100–150 ms ahead of gRPC (unverified, vendor claims).
2. **Geyser gRPC** — a validator plugin streaming processed transactions. Fast enough for migration sniping and filtered strategies; usually too late for slot-0 creation snipes.
3. **RPC polling / websockets** — fine for research, hopeless for sniping.

**Landing the buy.** Once the create is detected you have one shot at getting a transaction into the *same* slot, and a normal transaction submitted through RPC will not make it. Two tools:

- **Jito bundles**: up to 5 transactions executed sequentially and atomically within one slot, all-or-nothing, prioritised in a tip-weighted auction that runs every 50 ms. Minimum tip is 1,000 lamports; competitive tips on contested launches run 0.001–0.05 SOL and, per practitioner estimates, the ceiling settles at 50–70% of expected profit (unverified). Atomicity is what makes a same-slot snipe safe: bundle your buy *with* a guard that fails if the curve state is not what you expected, and the whole thing reverts rather than buying into a curve someone else already pumped. Creators use the same tool in reverse: a create-plus-N-buys bundle guarantees their wallets are first no matter how fast you are.
- **Priority fees**: for non-bundle submission via Jito's `sendTransaction`, the recommended split is roughly 70% priority fee / 30% tip. Priority fees buy position in the scheduler; they do not buy atomicity.

**Pre-computing everything.** The only work allowed between detection and submission is signing. Snipers pre-create or use idempotent creation of the **associated token account** (an extra instruction in the same transaction, not a separate round-trip), derive the bonding-curve PDA from the mint address the instant it is seen, hold pre-fetched recent blockhashes, keep a warm connection to the block engine in the leader's region, and often pre-sign templated transactions with the mint address patched in. Every network hop you remove is a position in the slot queue.

**Why the arms race is brutal.** The prize is fixed by the curve math (Case A: 1.56 SOL on a token that attracts 20 SOL), and it goes to the front of a queue that several hundred bots enter simultaneously. Competition therefore bids the tip toward the expected profit, exactly like any MEV auction. The people who win consistently either have a data edge (which tokens), a colocation edge (which slot position), or an information edge (they are the creator).

## The economics, candidly

Start with the base rates.

| Metric | Figure | Source |
|---|---|---|
| pump.fun lifetime graduation rate | ~1.4% | Dune (jondar) |
| Graduation rate, Sep 2025 sample of 655,770 tokens | 0.63%; median 4.4 min and 457 trades to graduate | arXiv 2602.14860 |
| Graduation rate, mid-June 2026 | ~0.26%, down ~80% in three months | DEXTools citing Dune |
| Believe / Moonshot graduation rates (2025) | 0.056% / 0.14% | blocmates |
| pump.fun tokens (Jan 2024–Mar 2025) that fell below $1k liquidity | 98.6% of 7M+ | Solidus Labs |
| Raydium pools showing soft-rug characteristics | 93% of 388k, median rug ~$2.8k | Solidus Labs |
| Launches classified high-risk (>70% drop within 20 min of migration, or manipulative pattern) | 84.1% of 41,470 | MemeTrans |
| Tokens with at least one dump event | 92.2% of 184,282 | arXiv 2602.14860 |

Solidus' 98.6% is worth reading correctly: pump.fun pushed back that "below $1k liquidity" measures collapse, not proven fraud. Both are true. Nearly everything goes to zero; a large fraction of that is deliberate.

Now the snipers themselves. Pine Analytics' **deployer-funded** same-slot snipers (wallets with a direct SOL transfer from the token's creator) were profitable on **87%** of snipes, extracted **15,000+ SOL in one month** across 15,000+ launches, exited **55% of positions within 60 seconds** and 85% within five minutes, usually in one or two sells. That is the profitability of *insiders*. Nobody has published comparable win rates for independent snipers, and the structure of the game says why: the insider's 87% is funded by whoever bought after them, and the fastest outside buyer is the first person in that queue.

For the broad trader population, CoinGecko's realised-PnL series is the best public data: fewer than half of pump.fun wallets that closed positions were profitable in most months of 2024–2025 (low of 30.1% in June 2025), then a sharp rise to 73.3% in April 2026 — driven, they argue, by unprofitable traders leaving (active wallets fell from 5.2M to 1.8M) rather than by the game getting easier. Even in that best month, 65% of all wallets made between $1 and $500, and the series excludes anyone still holding.

A rough expected-value sketch for an unfiltered slot-0 sniper with 1 SOL per launch, using Cases A–C: if 1% of launches hit Case B (+11.4 SOL), 10% hit something like Case A (+1.5 SOL), and 89% hit Case C or worse (−0.05 to −0.5 SOL), EV per launch is about 0.114 + 0.15 − 0.25 ≈ **+0.01 SOL before tips**. A 0.01 SOL tip erases it, and a bundler in front of you (Case D) turns every winning branch smaller. Unfiltered sniping is negative EV; the whole job is the filter.

## Risks

**Rugs and honeypots.** On pump.fun the program creates a standard SPL mint with mint and freeze authority revoked, so the classic honeypots cannot happen on the curve. On launchpads that let creators bring their own mint, or that support Token-2022, check before buying: **mint authority** (infinite dilution), **freeze authority** (your account gets frozen; BONKKILLER was the canonical case), **Token-2022 transfer hooks** (arbitrary code on every transfer, which can simply reject sells), **transfer fees** (a hidden tax on each hop), and **permanent delegate / closable / balance-mutable extensions**. Any of these on a random memecoin is a hard reject. Post-migration, a creator holding unlocked LP can still pull liquidity; LaunchLab's mandatory LP burn/lock and pump.fun's LP burn exist precisely because Solidus counted 361k soft rugs on Raydium.

**Dev bundling and insider sniping.** Covered above, and the dominant risk. The Pine finding that >50% of launches are same-slot sniped means most of your competitors in slot 0 are not other snipers; they are the creator.

**The arms race.** Your latency edge decays monthly. Infrastructure that put you first in Q1 puts you fifth in Q3, and fifth is Case D.

**Exit-liquidity dynamics.** Every sniper's exit is the next buyer's entry. The arXiv study noted that selling *before* graduation returns more SOL per token than selling just after (virtual liquidity is thinner than the real pool), so rational early holders dump pre-graduation, which is why so many tokens stall at 60–80 SOL. When snipers all use the same signal, they all exit at the same moment, into each other.

**Operational.** Bundles that land partially (never, if built correctly), stale blockhashes, block-engine rate limits (default 1 request per second per IP per region), and the infra churn shown by ShredStream's shutdown.

## Ethical and legal framing

Buying a public token in the first slot is legal trading; there is no rule reserving early prices for humans. The SEC staff stated on 27 February 2025 that meme coins are not securities, which removes securities-law protection for buyers but also removes securities-law cover for what happens around launches. Fraud remains fraud: wire-fraud and commodities-manipulation statutes do not require the token to be a security, and pump.fun itself has faced class actions.

The honest framing for a trading desk: independent sniping is speculation with a latency edge; *funded* sniping (buying your own launch from pre-funded wallets to fake demand) is textbook manipulation; wash-volume bots and fake social signals are the same. The strategy sits next to manipulation on the ledger, which means you must be able to show your wallets are yours, funded by you, trading tokens you did not create.

## Realistic scorecard

| Dimension | Assessment |
|---|---|
| Edge source | Latency (slot position) plus token selection; neither durable alone |
| Base rate | <1% of launches graduate; ~90% show a dump; most curves never see 0.4 SOL after you |
| Payoff shape | Small frequent losses, rare 10x; heavy left tail from bundled launches |
| Capital needed | Low per trade (0.1–2 SOL); real cost is infra and tips |
| Infra needed | Shred feed, block-engine access, colocation, own decoders for 3+ programs |
| Competition | Several hundred bots per launch plus the creator; tips trend toward expected profit |
| Counterparty | Frequently the token's creator; assume so until proven otherwise |
| Data on outsider profitability | None credible published; insider win rate 87% (Pine) |
| Regulatory posture | Legal to trade; adjacent to manipulation; keep clean wallet provenance |
| Verdict | Viable only as a filtered, latency-competitive operation; unfiltered slot-0 sniping is negative EV after tips |

## How this connects to the rest of the stack

Sniping reuses almost everything the arb and liquidation infrastructure already needs, which is the main argument for a team to run it at all:

- **Shred-level detection** is the same feed used to see a DEX swap or an oracle update before the block is final. A sniper decodes create/migrate instructions; an arb decodes swaps. Same pipeline, different filter, and the ShredStream-to-DoubleZero migration hits both.
- **Bundles and tips** are the identical submission path used for atomic arbs and liquidations. A snipe is just a bundle whose profit condition is "I am first" rather than "prices differ across venues." The tip-auction economics (bid up to a fraction of expected profit, lose if you overbid) carry over unchanged.
- **Priority-fee and blockhash management**, pre-created accounts, warm block-engine connections and per-leader routing are shared plumbing.
- **Migration sniping is literally arbitrage**: a freshly migrated PumpSwap or CPMM pool is a new venue whose price can be compared against the closing curve price and against any other pool for the same mint.
- **The MEV framing is the same**: in arb you are the informed taker collecting LVR from passive LPs; in sniping you are trying to be the informed taker against later buyers, while the creator is trying to be it against you. Adverse selection did not go away, it just moved to slot 0.

## Where to go next

- **Program-level decoders for pump.fun, LaunchLab and DBC** — the three account layouts cover most of the market.
- **Deployer scoring** — a persistent graph of deployer wallets, funding sources and past outcomes is the filter that turns the EV positive.
- **Migration-slot arbitrage** — the least manipulation-exposed variant and the one closest to existing arb tooling.

## Sources

- Pump.fun, "The Pump.fun bonding curve" — https://pump.fun/docs/bonding-curve
- Pump.fun, "Pump.fun fees" (updated 20 May 2026) — https://pump.fun/docs/fees
- pump-fun/pump-public-docs, PUMP_PROGRAM_README.md (program constants) — https://github.com/pump-fun/pump-public-docs/blob/main/docs/PUMP_PROGRAM_README.md
- The Block, "Pump.fun launches DEX called PumpSwap" — https://www.theblock.co/post/347360/pump-fun-launches-dex-called-pumpswap-to-instantly-migrate-graduated-tokens
- Raydium Docs, LaunchLab — https://docs.raydium.io/products/launchlab
- Messari, "State of Raydium Q2 2025: LaunchLab Emerges" — https://messari.io/report/state-of-raydium-q2-2025
- Solana Compass, "Raydium LaunchLab mandates CPMM-only graduation and locks creator LP" — https://solanacompass.com/news/raydium-launchlab-mandates-cpmm-only-graduation-and-locks-creator-lp-at-token-migration
- blocmates, "Launchpad wars: which Solana launchpad will win" — https://www.blocmates.com/articles/all-you-need-to-know-about-the-solana-launchpad-wars
- Meteora Docs, DBC bonding curve configs (fee scheduler, rate limiter) — https://docs.meteora.ag/developer-guide/guides/dbc/bonding-curve-configs
- Moonshot Docs, "Bonding Curve - Solana" — https://docs.moonshot.cc/developers/bonding-curve-solana
- Solana Compass, Boop project page — https://solanacompass.com/projects/boop
- stepdata, "Letsbonk claims 82% of bonding curve volume" — https://stepdata.substack.com/p/letsbonk-claims-82-of-bonding-curve
- Pine Analytics, "Exit Liquidity Machines" — https://pineanalytics.substack.com/p/exit-liquidity-machines
- Solidus Labs, "Solana Rug Pulls & Pump-and-Dumps" (2025 Rug Pull Report) — https://www.soliduslabs.com/reports/solana-rug-pulls-pump-dumps-crypto-compliance
- CoinDesk, pump.fun response to the Solidus report — https://www.coindesk.com/business/2025/05/07/98-of-tokens-on-pump-fun-have-been-rug-pulls-or-an-act-of-fraud-new-report-says
- arXiv 2602.14860, "Predicting the success of new crypto-tokens: the Pump.fun case" — https://arxiv.org/html/2602.14860v1
- arXiv 2602.13480, "MemeTrans: A Dataset for Detecting High-Risk Memecoin Launches on Solana" — https://arxiv.org/html/2602.13480v1
- arXiv 2601.08641, "Resisting Manipulative Bots in Meme Coin Copy Trading" — https://arxiv.org/html/2601.08641v2
- CoinGecko Research, "Pump.fun Traders Are Making a Comeback" — https://www.coingecko.com/research/publications/pump-fun-traders-are-making-a-comeback
- DEXTools, "Pump.fun in 2026: Graduation Rate Collapses to 0.26%" — https://www.dextools.io/news/pump-fun-graduation-collapse-solana-fees-2026
- Dune, "Pump.fun - Graduations, Bots, and Profits" (jondar) — https://dune.com/jondar/pumpfun
- Jito Docs, Low Latency Block Updates (ShredStream) and shutdown notice — https://docs.jito.wtf/lowlatencytxnfeed/
- Jito Docs, Low Latency Transaction Send (bundles, tips, auction) — https://docs.jito.wtf/lowlatencytxnsend/
- Solana Compass, "DoubleZero removes unauthorized retransmitters, claims 70%+ leader shred lead" — https://solanacompass.com/news/doublezero-removes-unauthorized-shred-retransmitters-claims-70-plus-lead-over-all-competitors
- RPC Fast, "Jito Explained: Bundles, Tips & Solana MEV in 2026" — https://rpcfast.com/blog/jito-explained-bundles-tips-mev-solana
- DEV Community, "Freeze authority is the Solana honeypot" (Token-2022 extension checklist) — https://dev.to/mrvlyouknowwho/freeze-authority-is-the-solana-honeypot-how-to-check-any-spl-token-in-10-seconds-free-no-wallet-15h4
- WilmerHale, "The State of Meme Coin Regulation: SEC Staff's Statement" — https://www.wilmerhale.com/en/insights/client-alerts/20250313-the-state-of-meme-coin-regulation-sec-staffs-statement-and-other-considerations
