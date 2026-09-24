# The State of MEV on Solana

_As of Sep 2026._

A landscape and market-structure document. It covers what MEV is on Solana, how much of it there is, who extracts and who captures it, and where the market is heading. It does not explain strategies: arbitrage economics live in [mev-strategies/arbitrage.md](mev-strategies/arbitrage.md), and ordering mechanics for each block-building stack live in [solana-block-building.md](solana-block-building.md). Claims marked (unverified) could not be confirmed against a primary source.

## TL;DR

- Solana MEV is a **latency and state-visibility game**, not a mempool game. There is no public mempool, blocks stream continuously, and the leader is known in advance.
- Value flows to validators and stakers through two channels: **Jito tips** (an out-of-protocol bundle auction) and **priority fees** (in-protocol, 100% to the leader since SIMD-0096).
- The tip market has collapsed from its Q1 2025 peak: Jito tips were $9.9M in Q2 2026 vs $19.85M in Q1 2026 and roughly $767M for all of 2024. Priority fees are now 60% of Solana's real economic value; tips are under 20%.
- Sandwiching was never eliminated. It moved from Jito's mempool (shut March 2024) to private mempools and modified validators, was pushed to the fringe by delegation-program removals and Jito's blacklist, and persists at a lower level today. Live trackers still show thousands of SOL a day extracted in September 2026.
- Block building consolidated into three camps: **Jito BAM** (~33–34% stake), **Harmonic** (~21%), and **Rakurai** (~9%), on top of classic Jito-Agave. All three sell ordering to searchers under "no sandwiching" rules.
- The frontier moved upstream: who sees state first (DoubleZero shreds, BAM preconfirmations) and who pays the right builder the right price.

## 1. What MEV means on Solana

**MEV** (maximal extractable value) is the value a party can capture by choosing which transactions land and in what order. On Ethereum this is organised around a public mempool, 12-second discrete blocks, and **proposer-builder separation** (PBS) with an explicit builder auction. Solana has none of these, and the differences shape everything below.

| Property | Ethereum | Solana |
|---|---|---|
| Pending-tx visibility | Public mempool | None; txs go straight to the leader (Jito's 200ms preview mempool shut March 2024) |
| Block cadence | 12s discrete blocks | Continuous streaming, ~300ms slots since 25 Aug 2026 (400ms before 19 Aug) |
| Who orders | Builder chosen by auction (PBS) | The scheduled leader, or a builder the leader has bound itself to (Jito/BAM/Harmonic) |
| Bid mechanism | Builder payment to proposer | Priority fee per compute unit (in-protocol) or Jito tip transfer (out-of-protocol) |
| Failed-tx cost | Full gas | Base fee only; spam is cheap and common |
| Leader knowledge | Per slot, public | Leader schedule known one epoch ahead |

Three consequences follow. First, **front-running requires privileged flow**: without a mempool, you can only sandwich if you see a transaction before the leader commits it, which means running the leader, sitting between users and leaders, or buying a private feed. Second, the dominant benign strategies are **backruns of observed state changes**: arbitrage after a swap lands, liquidation after an oracle update. The race is to see shreds or preconfirmations first and land next. Third, because failing is cheap, **spam substitutes for latency**. Umbra Research documented in 2023 that around 96% of atomic-arb attempts failed on-chain, and failed transactions peaked at 75.7% of all non-vote transactions in April 2024 before the Agave 1.18 scheduler tightened things.

How value reaches validators: a priority fee is paid to the leader who includes the transaction (SIMD-0096, live February 2025, ended the 50% burn). A Jito tip is a SOL transfer to one of eight tip accounts inside a bundle; the leader sweeps it to a tip-distribution account and stakers claim their share at epoch end via a merkle root, net of validator commission and a Jito protocol cut. Harmonic has no tip account; its "tip" is the priority fee and goes 100% to the validator. Details of each path are in `solana-block-building.md`.

## 2. The extraction landscape in numbers

### Aggregate flows

Jito's tip volume is the best public proxy for the paid-ordering market, and it has fallen for five consecutive quarters.

| Period | Jito tips | Jito protocol revenue | Notes | Source |
|---|---|---|---|---|
| CY2024 | 3.75M SOL (~$767.5M) | — | >3B bundles; daily tippers 20k (Jan) to 938k (Dec) | Helius MEV Report (Jan 2025) |
| Q1 2025 | — | $26.1M (peak) | Trump/Melania memecoin mania in January | Blockworks via Solana Compass |
| Q3 2025 | — | ~$4.7M (Block Engine fees) | (unverified: secondary source, no primary cited) | tokenomics.com |
| Q1 2026 | $19.85M | $2.33M | 1.04B txs through Jito; BAM stake 14.0% to 28.1% | Blockworks Q1 2026 |
| Q2 2026 | $9.9M (−50% QoQ) | $1.28M (−45% QoQ) | 1.045B txs, flat; fifth consecutive revenue decline | Blockworks Q2 2026 |

The transaction count through Jito did not fall; the price paid per transaction did. That is a margin story, not a volume story.

Solana's total **REV** (real economic value: priority fees + tips + vote and base fees) was $51.0M in Q2 2026, down 43% from $89.8M in Q1. Priority fees were $30.8M (60%), Jito tips $9.9M (19%), vote and base fees $10.3M. Galaxy Research puts total network fee revenue at ~$155M for the quarter (−44%) and notes that inflation still provides ~90% of staking yield, so MEV is a rounding error for the average staker today.

### Share by strategy

No single source measures every strategy on a consistent basis, so the table mixes windows. Treat it as order-of-magnitude.

| Strategy | Measured figure | Window | Source |
|---|---|---|---|
| Atomic arbitrage | 90.4M successful arbs, $142.8M profit, mean $1.58, max $3.7M; 88.7% SOL-denominated | CY2024 | Helius MEV Report |
| Atomic arbitrage | $380M volume/profit lower bound (unverified whether volume or profit) | Jan 2024 – May 2025 | Ghost / sandwiched.me |
| Sandwiching | $370M (SOL/USDC/USDT) to $500M (incl. memecoins) extracted; peak ~600k SOL in Nov 2024 | Jan 2024 – May 2025 | Ghost / sandwiched.me |
| Sandwiching | >500K attacks, >$7.7M victim losses, 2.4M defensive behaviours observed | ~4 months, early 2025 | ACM IMC 2025 (Northeastern) |
| Sandwiching (single bot) | 1.55M sandwiches, 65,880 SOL ($13.4M) profit, 22,760 SOL paid in tips, 88.9% success; ~50% of all sandwiches | 7 Dec 2024 – 5 Jan 2025 | Helius (DeezNode "Vpe" bot) |
| Sandwiching (live) | 6,783 SOL extracted, 129,972 sandwiches, 66,735 victims, 518 attacker addresses | 24h to 24 Sep 2026 | sandwiched.me live counter |
| Sandwiching (live) | ~8,700 SOL/day, ~74,000 victim wallets, ~$12 blended cost per victim swap | mid-Sep 2026 | dev.to write-up citing a live tracker |
| Liquidations | No Solana-wide public measurement found | — | — |
| Sniping / memecoin flow | No clean public measurement; tips track launches (WIF Jan 2024, Pengu Dec 2024, TRUMP Jan 2025) | — | sandwiched.me |
| CEX-DEX | No public Solana measurement; Ethereum data in `mev-strategies/arbitrage.md` | — | — |
| Tips as share of profit | Arb bots pay 50–60% of profit as tips; sandwich bots 15–20% | to May 2025 | Ghost at Accelerate 2025 |

Two figures circulate widely without a traceable primary source and should be treated as (unverified): "$720M of MEV revenue in the last year" and "$480M cumulative searcher profits through Jito bundles". Both appear on infrastructure vendors' blogs, not in Blockworks, Helius, or Ghost data.

### Where the measurements come from

- **Helius, "Solana MEV Report"** (Jan 2025): the most complete public survey; 2024 tip totals, arb census, DeezNode case study, protection products.
- **Ghost / sandwiched.me** (live dashboard since June 2024; "State of Solana MEV", May 2025; "Detecting Evasive Sandwich Attacks", Sep 2025): the standard sandwich tracker, including per-validator and per-stake-pool sandwich rates.
- **Blockworks Research** quarterly Jito and Solana token-holder reports: tips, protocol revenue, REV, client stake shares.
- **Umbra Research, "MEV on Solana"** (May 2023): first documentation of spam-as-competition and of the risk of validator self-extraction.
- **ACM IMC 2025**, Gerzon et al., "Quantifying the Threat of Sandwiching MEV on Jito": four months of 2025 data, 500K+ attacks.
- **arXiv 2604.00234**, Wang et al., "Blockspace Under Pressure" (Jul 2026): equilibrium model of spam MEV; credits Solana as the origin of the phenomenon, empirical work is on Base and Arbitrum.
- **arXiv 2504.18055**, Zheng et al., "Why Does My Transaction Fail?" (Apr 2025): 1.5B failed Solana transactions across 72M blocks, attributed to bots.
- **Syndica** monthly on-chain deep dives: per-client revenue per block.

Sources disagree on definitions. Ghost's sandwich counts include "wide" sandwiches (legs 50–300ms apart, not adjacent in a bundle) and grew roughly 30x as a share after anti-sandwich measures; Helius's DeezNode figure counts only that program. A live tracker showing 6,000–9,000 SOL/day in September 2026 is consistent with the ~$500M/16-month peak-era figure only if you accept that most of what remains is small: median victim loss is a few dollars.

## 3. Sandwiching: how it survived, and where it stands

**Timeline**

| Date | Event |
|---|---|
| Mar 2024 | Jito shuts its public mempool (200ms preview) citing sandwiching during the memecoin frenzy. Jito forgoes revenue; sandwiching drops briefly. |
| Spring 2024 | Private mempools appear. Validators report receiving profit-share proposals; DeezNode circulates "DeezMempool". The "arsc" wallet cluster is reported to have taken ~$60M in two months (unverified; secondary press). |
| 7 May 2024 | Solana Foundation posts SFDP rule: participating in a private mempool that enables sandwiching is grounds for removal. |
| 9–10 Jun 2024 | Foundation removes a group of operators (press reports "more than 30") from the delegation program. Tim Garcia: "Decisions in this matter are final. Enforcement actions are ongoing." |
| Nov–Dec 2024 | DeezNode validator's stake grows from 307,900 to 802,500 SOL, ~20% from Marinade mSOL; its Vpe bot does ~half of all sandwiches. |
| Early 2025 | Jito StakeNet governance blacklists high-sandwich validators (epoch 789); Marinade becomes the dominant staker to the remaining offenders. Ghost measures median validator sandwich rate 2.4%, outliers 20–60%. |
| 2025 | Helius's own validator: 0.72% of 412,325 blocks contain a sandwich over 60 days; worst validators 27%. Blind (no-mempool) sandwiching rises from 1% to 30% of attacks. |
| Jul 2025 – 2026 | BAM (TEE ordering) and Harmonic (Nov 2025) both launch with explicit no-sandwich rules; combined they reach ~54% of stake by Q2 2026. |
| Apr 2026 | A claim circulates that a fix on 8 April 2026 ended "simple" sandwiching, with remaining attacks targeting sub-$1 trades (unverified; contradicted by live trackers below). |
| Sep 2026 | sandwiched.me shows 6,783 SOL extracted in 24 hours from 66,735 victims by 518 addresses. |

**How it survived the mempool shutdown.** Sandwiching on Solana needs sight of a user transaction before the leader commits it. After March 2024 that came from three places: RPC providers or wallets forwarding flow to a private feed; validators running a modified client that leaks or reorders their own incoming transactions; and the leader itself acting as the searcher. The DeezNode case combined the last two: a large validator, mostly funded by liquid-staking delegations, ran the bot against transactions it received as leader. Because stake pools delegate algorithmically, the offenders kept receiving stake until pool governance blacklisted them, which is why Ghost's analysis pivoted from "which bot" to "which stake pool funds it".

**Did BAM and Harmonic end it?** No, but they changed its shape. Both stacks refuse to build sandwiches on the ~54% of stake they cover, and TEE-based ordering in BAM removes the leader's own ability to peek. What remains is concentrated on the ~45% of slots led by plain Agave or unaligned Jito-Agave validators, and in the "blind" or "wide" variants that do not need adjacency: a bot statistically guesses that a Pump.fun-style buy is coming and brackets it across two transactions 50–300ms apart. That is lower-margin and hits small trades, which matches the live tracker's profile of many victims and low per-victim loss. There is no measurement yet of sandwich rate by client (Ghost has a "clients" view but no 2026 report), so the "BAM/Harmonic ended it" claim is plausible for their own slots and unproven for the network.

**Delegation-program enforcement.** The Solana Foundation's stake has fallen from 13% of the network (Aug 2024) to 5% (Mar 2026) under a three-out-one-in policy, so SFDP removal is a weaker lever than it was. Jito's StakeNet blacklist and Marinade's stake-auction rules now matter more than Foundation stake.

**Protection products for users** (what each actually does):

| Product | Mechanism | Trade-off |
|---|---|---|
| Jupiter Ultra v3 (Oct 2025) | Iris meta-router; ShadowLane private landing; JupiterZ RFQ (~$100M/day, zero slippage); claims 34x better sandwich protection | Flow never reaches public searchers; Jupiter internalises the backrun |
| Jupiter Dynamic Slippage (Aug 2024) / MEV Protect | Slippage tuned per token; Jito-only routing | Higher fees, slower on non-Jito leaders |
| Helius Sender | Fans out to Helius, Jito, Harmonic, Rakurai simultaneously; `mev-protect=true` skips validators statistically linked to sandwiches | 0.001 SOL minimum tip for full routing |
| Temporal Nozomi MEV Protect | Whitelist of trusted validators only | Slower, higher expiry risk; docs say protection is "reduced, not eliminated" |
| bloXroute leader-aware routing (Oct 2025) | Scores upcoming leaders, delays or skips risky ones; `frontRunningProtection` routes via Jito + Paladin + bloXroute | Adds a slot or two of latency on risky leaders |
| Jito `dontfront` | Read-only account with `jitodontfront` prefix forces the tx to index 0 of any bundle | Only protects on Jito/BAM leaders |
| Pyth Express Relay (Kamino Swap) | Protocol-run auction; searchers bid for the right to fill, winner's bid returns to user | Flow leaves the open market |
| DFlow conditional liquidity | Segmenters price flow by toxicity | Retail gets tighter quotes; searchers see none of it |
| Sandwich-resistant AMM (Ellipsis Plasma) | No fill better than slot-start price | Application-level only |
| Paladin P3 | Modified client, priority port, ~6% stake in early 2025 | Trust-based; small footprint |

The common thread: every product works by keeping flow away from the open ordering market. That protects users and shrinks the pie for independent searchers at the same time.

## 4. Infrastructure and market structure

### Block builders

| Stack | Stake (Q2 2026) | Ordering | Searcher access | Economics |
|---|---|---|---|---|
| Jito BAM | 33% (34.1%, 383/665 validators on 9 Sep 2026) | TEE-sequenced, verifiable; plugins for custom ordering | Bundles via BAM nodes | Plugin fees to validators and DAO; preconf revenue split 35/35/30 |
| Classic Jito-Agave | ~21% (derived) | 50ms tip auction alongside Agave scheduler | Bundles via Block Engine | 6% protocol cut of tips (JIP-24: 100% to DAO) |
| Harmonic | ~21% (17% in Mar 2026) | FBA (50ms batch), FIFO, MREV, custom; validator picks | Whitelisted gRPC bundles with bundle-control accounts | 100% of fees to validator, no protocol fee; MREV is not SFDP-compliant |
| Rakurai | ~9% (6% in Mar 2026) | Heuristic scheduler, fork of jito-solana | Via Jito paths | No client fee; Rakurai-earned tips +76% vs network mean per block (Syndica, Apr 2026) |
| Frankendancer / Firedancer | ~8% (12% + 2% by execution client, Mar 2026) | Agave or overlay rules | Via FireBAM or Harmonic Samba | — |

Numbers come from Blockworks (Q2 2026) and SolanaFloor/Syndica (Mar 2026); categories overlap because Frankendancer can run BAM or Harmonic overlays. The "95% of stake runs jito-solana" figure often quoted counts code lineage, not who sells ordering: Rakurai and several forks descend from jito-solana.

Harmonic launched 5 Nov 2025 with a $6M Paradigm-led seed; co-founder Jakob Povsic also co-founded Temporal (Nozomi). Harmonic's pitch is that the validator, not the builder, chooses the ordering rule; its critique is that Jito is conflicted by owning infrastructure, BAM and stake-pool scoring. The same critique applies to Temporal, which runs a transaction-landing service and is widely believed to operate HumidiFi (unverified). Syndica's April 2026 data showed Harmonic's Firedancer "PRF" validators earning the most per block (0.0555 SOL, +79% vs mean), almost all of it priority fees rather than tips.

### Data and preconfirmations

- **Jito ShredStream shut down on 5 Sep 2026** after a 60-day notice in early July. Jito pointed users to **DoubleZero Edge**, a paid private-fiber shred feed covering 62.6% of stake. On 9 Sep 2026 DoubleZero cut off RPCs that had been retransmitting its feed without a licence and claimed a 70%+ lead on leader shreds. Third-party benchmarks had already put Jito's feed 6.5ms behind at the median. Early state is now a licensed product.
- **BAM preconfirmations went live 9 Sep 2026** via Helius and Triton: BAM-sequenced transactions are streamed to subscribers before the block, a claimed 5–10ms p50 edge over shreds. Revenue splits 35% to BAM validators (stake-weighted, paid as priority fees), 35% to the Jito DAO, 30% to distribution partners; payouts start October 2026. A preconfirmation is a schedule, not a guarantee; the BAM Verifier disconnects validators that deviate.

Together these two events mark the point where **information about the next block became a priced good** sold by the block builder and the network operator, rather than something a searcher could infer for free by running nodes.

### Protocol changes that touch MEV

| Change | Status | Effect on MEV |
|---|---|---|
| SIMD-0096: 100% of priority fees to leader | Live Feb 2025 | Made priority fee a full substitute for tips; Harmonic's model depends on it |
| SIMD-0525: slot time 400→350→300→250→200ms | 350ms at epoch 1019 (19 Aug 2026), 300ms at epoch 1023 (25 Aug 2026); 250/200 pending | Shorter leader windows, more slots per second, less time per batch auction |
| SIMD-0123 (+0291, 0249, 0232): block-revenue commission | Supporting gates live Jun–Sep 2026; sharing gate not yet active as of 17 Sep 2026 | Lets validators pass priority fees to stakers; default keeps 100% |
| SIMD-0553: 2,500-lamport inclusion fee to leader + resource fee 0.5 lamports/CU, burned | Proposed by Temporal Jun 2026; vote 5–18 Aug 2026; outcome not confirmed in sources read | Prices compute rather than signatures; raises the cost of spam probing; 648→7,500–9,000 SOL/day burn at terminal rate |
| SIMD-0550: faster disinflation | Voted alongside 0553 | Makes fee and MEV income a larger share of validator revenue over time |
| Alpenglow (SIMD-0326): Votor + Rotor, ~150ms finality | Community cluster May 2026; Agave v4.3 mainnet 18 Sep 2026 with inert code; testnet 23 Sep; mainnet gates tentatively from 28 Sep 2026, Votor first, Rotor later | Removes vote transactions from blocks; compresses the window in which a leader can delay for ordering gain; enables multiple concurrent leaders later |

### Where the order flow went

Two structural shifts matter more to a searcher than any block-builder change.

**Proprietary AMMs.** SolFi (Ellipsis), Tessera V (Wintermute), HumidiFi, ZeroFi, GoonFi and Obric quote from oracles, refresh quotes in as little as 143 CUs, buy cancel priority with small Jito tips, and reject takers below 100k CUs as likely bots. They took over 60% of SOL/USDC volume by July 2025 (peak 86%), roughly 65% of all on-chain volume by December 2025 (Chorus One), and quote 0.4–1.6bp on SOL/USDC. Nearly all their volume (88–99%) arrives through aggregators. The effect is that the stale-quote arbitrage that made up most of 2024's $143M of atomic-arb profit is now internalised by market makers who are never stale. Passive-pool LVR is still there on long-tail tokens; on majors it has largely been competed away.

**Jupiter and order-flow internalisation.** Jupiter routes over 80% of aggregator volume and over half of all DEX volume. Ultra v3 sends most of that through private lanes and an RFQ, so the backrun a searcher used to pick up after a large Jupiter swap increasingly does not exist on the public path. DFlow, Titan and OKX compete on the same model (DFlow reportedly topped daily aggregator share at one point in 2026; unverified). On the auction side, Pyth Express Relay runs protocol-controlled auctions for liquidations and swaps with a named searcher set (Wintermute, Flow Traders, Auros and others), and BAM plugins are the Jito-native path for an application to define its own ordering or auction and take a fee. Solana has no Flashbots-style MEV-Share; the equivalent role is being filled by aggregators and by builder plugins, each keeping the rebate inside its own product.

### Validator economics

- Inflation is ~90% of staking yield (Q2 2026). Tips plus priority fees are the rest, and the split has swung toward priority fees (60% of REV) as the Jito tip auction thinned.
- jitoSOL passes 92–95% of rewards to holders (5–8% commission). Its advertised MEV boost of 1.2–1.8% APY (early 2026) is not consistent with Blockworks' Q2 2026 median implied APY of ~5.7%, which is barely above native; the boost has shrunk with tips. jitoSOL supply fell 20% QoQ to 9.86M SOL and 17.3% LST share in Q2 2026.
- Jito's own revenue mix flipped: staking fees were 57% of Q2 2026 protocol revenue and tip-related fees 42%. Its next bets are BAM plugin fees, preconfirmation revenue, and the JTX trading front end (launched 14 Jul 2026).
- Harmonic passes 100% to the validator, and Rakurai charges nothing, so validators are now choosing builders on realised SOL per block rather than on brand. Per-client revenue tables (Syndica) have become the scoreboard.

## 5. The players

**Who extracts.** Concentration is high at the top and long-tailed at the bottom. One program (DeezNode's Vpe) did about half of all sandwiches in late 2024; on 24 Sep 2026 the top address on sandwiched.me took ~40% of the day's SOL across 518 active attacker addresses. On the arbitrage side, 2024's 90.4M successful arbs averaged $1.58 each, which is a market of many small bots plus a few large operators taking the multi-thousand-dollar backruns. Ghost's tip data (arb bots paying 50–60% of profit as tips, sandwich bots 15–20%) shows the benign side is the one competing hardest. The proprietary AMM operators and RFQ market makers are now the largest "searchers" in economic terms, although they never submit a bundle labelled as such.

**Who captures.** Validators and their stakers receive the tips and all priority fees; Jito's DAO takes a protocol cut of tips (6% per 2026 sources; historically described as a 5% Labs fee plus a 3% TipRouter fee split among DAO, node operators and vaults, unverified) and 35% of preconfirmation revenue; Harmonic takes nothing; DoubleZero and its fiber contributors take shred-feed subscriptions; distribution partners (Helius, Triton) take 30% of preconfirmation revenue. TipRouter has routed more than $250M since February 2025.

**Who pays.** Three groups. **LPs in passive pools**, through LVR, which is the same number as arbitrage profit seen from the other side (see `mev-strategies/arbitrage.md`); this bill is shrinking on majors because prop AMMs do not bleed. **Sandwiched users**, $370–500M over the 16 months to May 2025 and a few dollars per victim on tens of thousands of victims a day in September 2026. **Everyone, via spam**: failed transactions pay base fees and consume blockspace, which SIMD-0553 is designed to make expensive.

## 6. Trends and open questions, next 12 months

**Does BAM plus Harmonic remove the searcher, or relocate it?** Relocate. Both stacks still need someone to find the backrun and pay for it; what they remove is the bundle-versus-banking-stage lock race and the leader's ability to self-deal. The searcher role migrates toward three places: plugin authors who sit inside the application's ordering rule, market makers who quote on prop AMMs and RFQs, and preconfirmation subscribers who act 5–10ms before the block. The independent bundle-submitting searcher of 2024 is the party being squeezed.

**The preconfirmation information race.** Preconfs turn the sequence into a paid feed. Expect: subscriber concentration among a handful of latency shops; a tension between BAM's TEE privacy story and selling the schedule early; Harmonic answering with its own stream or arguing that FIFO makes preconfs worthless. Watch the October 2026 payout numbers to see how much validators earn from selling early sight versus from tips.

**Encrypted and TEE ordering.** BAM's TEE is the first production example; Harmonic's argument is that ordering-rule choice, not hardware trust, is the guarantee. Open questions are attestation transparency, what plugins can see, and whether TEE side channels become a searcher edge.

**MEV under Alpenglow and shorter slots.** 300ms slots and 150ms finality shrink every batch auction and leader window. Helius's own analysis expects leaders with in-house building to gain and independent latency arbitrageurs to lose. Vote transactions leave blocks, freeing compute. Multiple concurrent leaders, if they arrive, would split the write set and create cross-lane MEV that nobody has designed for.

**Regulatory attention.** The Peraire-Bueno Ethereum case ended in a mistrial in November 2025 with prosecutors seeking a retrial; it turned on exploiting MEV bots, not on sandwiching itself, and left the legality of sandwiching unresolved. ESMA published a risk analysis of MEV in July 2025. The SEC/CFTC March 2026 interpretive release classified SOL as a digital commodity and said nothing specific about MEV. Nothing today restricts benign extraction; sandwiching remains a reputational and delegation problem rather than a legal one, and that could change with one enforcement action.

**Searcher margin compression.** Tips per Jito transaction halved in one quarter while transaction count held flat. Prop AMMs removed most stale-quote arbitrage on majors. Aggregators internalise backruns. Shred and preconf data are now paid. Fees on compute (SIMD-0553) make probing dearer. Every one of these is a permanent, not cyclical, reduction in the share of DEX volume that reaches an open ordering market.

## 7. What this means for a searcher operation

**Where the remaining edge is**

- **Early state.** DoubleZero Edge for shreds and BAM preconfirmations via Helius or Triton are now the only fast feeds; the free tier is gone. Budget for both and measure your own p50 against them.
- **Per-builder tip calibration.** Each leader is now a BAM, Harmonic (FBA/FIFO/MREV), Rakurai, or plain Agave slot with different price sensitivity. Bidding a Jito tip into a FIFO slot is wasted money; bidding a priority fee into a BAM slot without a bundle loses the lock race. See the sender playbook in `solana-block-building.md`.
- **Benign strategies only.** Backruns, cyclic arb on long-tail and launch tokens, liquidations, and JIT liquidity all run inside every builder's rules. Liquidations in particular are increasingly auctioned (Express Relay) or app-sequenced (BAM plugins); getting whitelisted where that is the model is part of the job.
- **Long-tail pools.** Passive LVR still exists where prop AMMs do not quote. That is where 2024-style stale-quote arb survives.

**What has closed**

- Mempool sandwiching (March 2024) and its private-mempool successors on any BAM or Harmonic slot; what remains is small, blind, and a delegation-program liability for any validator that hosts it.
- Spam as a substitute for latency: 300ms slots, tighter schedulers, and compute-priced fees make blind probing lose money.
- Free early sight (ShredStream) and majors arbitrage against passive pools.

**What to watch**

- Blockworks Q3 2026 Jito report: whether tips stabilise below $10M/quarter, and first BAM preconfirmation revenue.
- Ghost per-client sandwich rates for 2026; whether the residual is on plain Agave slots.
- Alpenglow mainnet activation (tentatively from 28 Sep 2026) and the 250ms slot gate.
- SIMD-0553 outcome and phase-in; SIMD-0123 block-revenue sharing activation.
- Harmonic's response to preconfirmations, and whether its stake share moves from 21%.
- Any Jupiter, DFlow or Titan move to a formal order-flow auction with searcher rebates, which would reopen internalised flow to outside bidders.

## Sources

- Helius, "Solana MEV Report: Trends, Insights, and Challenges" (Jan 2025): https://www.helius.dev/blog/solana-mev-report
- Helius, "Solana's Proprietary AMM Revolution" (2025): https://www.helius.dev/blog/solanas-proprietary-amm-revolution
- Helius, "Solana Foundation Delegation Program" (Aug 2024): https://www.helius.dev/blog/solana-foundation-delegation-program-sfdp
- Helius, "Alpenglow: Solana's Great Consensus Rewrite": https://www.helius.dev/blog/alpenglow
- Helius Sender docs: https://www.helius.dev/docs/sending-transactions/sender
- Blockworks Research, Jito Q2 2026 token-holder report (via Solana Compass, 10 Aug 2026): https://solanacompass.com/news/jito-q2-2026-protocol-revenue-falls-45-to-128m-as-bam-reaches-33-of-solana-stake
- Blockworks Research, Solana Q2 2026 token-holder report: https://x.com/Blockworks/article/2079204785425670413
- Blockworks Research, Jito Q2 2026 token-holder report: https://x.com/Blockworks/article/2086815115874013246
- Galaxy Research, Solana Q2 2026 (via Solana Compass): https://solanacompass.com/news/galaxy-research-solana-held-dex-1-for-seven-consecutive-quarters-as-rwas-crossed-3-billion
- Solana Compass, "Jito BAM Preconfirmations Launch" (Sep 2026): https://solanacompass.com/news/jito-bam-preconfirmations-go-live-on-solana-covering-34-of-network-stake
- Solana Compass, "DoubleZero Removes Unauthorized Retransmitters" (Sep 2026): https://solanacompass.com/news/doublezero-removes-unauthorized-shred-retransmitters-claims-70-plus-lead-over-all-competitors
- Solana Compass, SIMD-0553 / SIMD-0550 vote coverage (Aug 2026): https://solanacompass.com/news/solana-formal-vote-on-simd-0553-and-simd-0550-has-10-days-left
- Solana Compass, Ghost at Accelerate 2025, "The State of Solana MEV" (20 May 2025): https://solanacompass.com/learn/accelerate-25/scale-or-die-at-accelerate-2025-the-state-of-solana-mev
- Ghost / sandwiched.me, "State of Solana MEV May 2025": https://sandwiched.me/research/state-of-solana-mev-may-2025-analysis
- Ghost / sandwiched.me, research index and live dashboard: https://sandwiched.me/research · https://sandwiched.me/sandwiches
- Gerzon, Weintraub, In, Mislove, Nita-Rotaru, "Quantifying the Threat of Sandwiching MEV on Jito", ACM IMC 2025: https://dl.acm.org/doi/10.1145/3730567.3764493
- Wang, Saraf, Heimbach, Babel, Zhang, "Blockspace Under Pressure: An Analysis of Spam MEV on High-Throughput Blockchains", arXiv 2604.00234 (Jul 2026): https://arxiv.org/abs/2604.00234
- Zheng, Wan, Lo, Xie, Yang, "Why Does My Transaction Fail? A First Look at Failed Transactions on the Solana Blockchain", arXiv 2504.18055 (Apr 2025): https://arxiv.org/abs/2504.18055
- Umbra Research, "MEV on Solana" (May 2023): https://www.umbraresearch.xyz/writings/mev-on-solana
- The Block, "Solana Foundation removes certain operators from delegation program" (10 Jun 2024): https://www.theblock.co/news/ecosystems/2024-06-10-solana-foundation-removes-certain-operators-from-delegation-program-over-malicious-sandwich-attacks-299244
- The Block, "Paradigm leads $6 million seed round for Harmonic" (5 Nov 2025): https://www.theblock.co/post/377791/paradigm-harmonic-funding-solana-nasdaq-speed
- The Block, "Jupiter unveils Ultra v3" (17 Oct 2025): https://www.theblock.co/post/375184/solana-decentralized-exchange-aggregator-jupiter-unveils-ultra-v3-improved-trade-execution-mev-protections-gasless-support
- The Block, Peraire-Bueno mistrial (11 Nov 2025): https://www.theblock.co/news/regulation/2025-11-11-prosecutors-seek-new-trial-mit-brothers-25-million-ethereum-fraud-case-ends-mistrial-378414
- Harmonic docs, scheduling strategies: https://docs.harmonic.gg/concepts/scheduling-strategies
- Jito docs, ShredStream deprecation notice: https://docs.jito.wtf/lowlatencytxnfeed/
- OrbitFlare, "Jito ShredStream Shutdown: Migration Guide" (2026): https://orbitflare.com/blog/developers/jito-shredstream-shutdown-migration-guide
- BAM site: https://bam.dev/ · FireBAM: https://github.com/jito-foundation/firebam
- Rakurai: https://rakurai.io/ · https://github.com/rakurai-io/rakurai-validator
- Syndica, "Deep Dive: Solana Onchain Activity, April 2026": https://blog.syndica.io/deep-dive-solana-onchain-activity-april-2026/
- SolanaFloor, "Solana Validator Independence Grows as Foundation Stake Drops to 5%" (Mar 2026): https://solanafloor.com/news/solana-validator-independence-grows
- xroot.dev, "Solana Slots Are Going to 200ms" (SIMD-0525 activation dates): https://xroot.dev/blog/solana-200ms-slots-simd-0525
- xroot.dev, "Validators will share block revenue with you" (SIMD-0123 status, 17 Sep 2026): https://xroot.dev/blog/solana-validator-block-revenue-sharing-two-commissions
- Blockdaemon, "SIMD-0553: What Solana's fee burn vote means": https://www.blockdaemon.com/blog/what-is-simd-0553-and-why-does-it-matter-for-institutional-sol-holders
- Solana, Alpenglow upgrade page: https://solana.com/upgrades/alpenglow · CoinDesk, Alpenglow community testing (11 May 2026): https://www.coindesk.com/tech/2026/05/11/the-biggest-consensus-overhaul-in-solana-history-is-officially-live-for-testing
- Chorus One, "Market Making, propAMMs, and Solana Execution Quality Landscape" (19 Dec 2025): https://chorus.one/reports-research/market-making-propamms-and-solana-execution-quality-landscape
- DL News, "Solana's $6bn 'dark' exchanges" (7 Aug 2025): https://www.dlnews.com/articles/defi/solana-dark-amms-make-trading-more-efficient-but-at-a-cost/
- Temporal Nozomi docs, tipping and MEV Protect: https://use.temporal.xyz/nozomi/tipping-and-faq
- bloXroute, "A New Era of MEV on Solana": https://medium.com/bloxroute/a-new-era-of-mev-on-solana-ae5cff390b71
- Solana docs, "MEV Protection with Jito DontFront": https://solana.com/docs/defi/mev-protection
- Pyth Network, Express Relay: https://docs.pyth.network/express-relay/how-express-relay-works
- tokenomics.com, "Jito Tokenomics" (7 Feb 2026; secondary, used for fee percentages): https://tokenomics.com/articles/jito-tokenomics-how-jto-captures-mev-and-staking-revenue-on-solana
- Jito Foundation, TipRouter: https://www.jito.network/restaking/tiprouter/learn-more/
- dev.to, "Solana Sandwich Attacks: Detect Them From Public Data" (16 Sep 2026): https://dev.to/sulimanmukhtar/solana-sandwich-attacks-detect-them-from-public-data-43k2
- CryptoRank, "Solana is no longer threatened by sandwich attacks" (Apr 2026; unverified claim): https://cryptorank.io/news/feed/ecb51-solana-no-longer-threatened-sandwich-attacks
- ESMA, "Maximal Extractable Value: Implications for crypto markets", TRV Risk Analysis (1 Jul 2025): https://www.esma.europa.eu/sites/default/files/2025-07/ESMA50-481369926-29744_Maximal_Extractable_Value_Implications_for_crypto_markets.pdf
