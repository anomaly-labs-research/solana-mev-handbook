# Solana Block Building

_As of Sep 2026._

How Jito, BAM, Harmonic and plain Agave order transactions, and what that means for bidding.

<!-- only: beginner -->

## In plain terms

**What a validator does.** Solana is run by a few hundred computers called **validators**. Every few hundred milliseconds one of them takes a turn as the **leader**: it collects the transactions people have sent in, decides which go into the next block and in what order, and broadcasts the result. The schedule of who leads when is published ahead of time.

**Why order is worth money.** Many transactions want the same thing at the same instant: a token whose price just moved, a liquidation, a price gap between two exchanges. Only the first one in the block gets the prize; the rest fail. So being placed ahead of your rivals has a cash value, and the leader, who decides placement, can sell it. There are two ways to pay. A **priority fee** is an extra per-transaction amount, understood by the network itself, that goes to the leader. A **tip** is a plain transfer of SOL to a special account that outside block-building software treats as a bid.

**Bundles and tips.** A **bundle** is a package of up to five transactions that must land together, in the order given, or not at all. If the opportunity is gone by the time your bundle is checked, it simply does not happen and you pay nothing. Bundles are how bots say "put my transaction right after that one, and here is my tip." The block-assembly software collects the tips and, in some designs, keeps a cut before passing the rest to the validator and its stakers.

**The four flavours.** There is no single way Solana leaders build blocks; it depends on which software the validator runs, and today the network is split roughly a third BAM, a fifth classic Jito, a fifth Harmonic, and the rest smaller clients or plain Agave.

- **Plain Agave** is the stock validator software: no bundles and no auction, just a queue drained by priority fee, so arriving early and paying more both help.
- **Classic Jito** adds a side channel where bundles are auctioned every 50 milliseconds, highest tip wins, and the winners are slotted in alongside the ordinary queue.
- **BAM**, Jito's newer system, moves the ordering into a sealed hardware enclave that produces one verified sequence the leader must follow, so the leader itself cannot peek at transactions and trade around them.
- **Harmonic** lets each validator pick a rule for its own blocks, such as 50-millisecond batches sorted by fee, strict first-come-first-served, or a revenue-maximizing option, and passes 100 percent of the fees to the validator.

**A tiny example.** Suppose a leader collects transactions in 50-millisecond batches and sorts each batch by fee, and two bots pay the same fee for the same opportunity. Being one millisecond faster only matters if it is the difference between making a batch and missing it, which happens about 2 percent of the time; one microsecond faster is worth nothing measurable. Under first-come-first-served, by contrast, speed is all that matters and an extra fee buys nothing.

**Who wins, who pays.** Validators and their stakers collect the fees and tips. Bots that win pay to land; bots that lose pay for the attempt unless they used a bundle. All of these systems now promise not to sandwich users, that is, trade around a user's transaction to profit from the price move it causes.

**What can go wrong.** You paid a priority fee but the opportunity vanished before your transaction ran. The leader for that slot runs software your bundle cannot reach, so it never lands. Bundles cannot carry over to the next leader and must be re-sent every slot.

**Terms you will meet on this page.** A **slot** is one leader's turn. **CU** (compute units) measure how much work a transaction does; fees are quoted per CU. The **TPU** is the leader's front door for ordinary transactions. A **block engine** is the off-chain service that runs Jito's or Harmonic's auction. **FIFO** means first in, first out. **FBA** is a frequency batch auction, the 50-millisecond batch rule. **MREV** is Harmonic's revenue-maximizing rule. **SFDP** is the Solana Foundation's stake-delegation program. A **TEE** is the sealed hardware enclave BAM uses. **Preconfirmations** are early notices, a few milliseconds ahead, of what BAM has scheduled. **Shreds** are the pieces of a block as it is broadcast. **Revert protection** means a failed bundle costs nothing.

**Bottom line.** On Solana the block builder is the exchange you are really trading on. Which software the next leader runs decides whether speed, price, or a tip wins, and a sender that does not check first has already lost.

<!-- /only -->

## TL;DR

<!-- level: intermediate -->

- **Plain Agave**: continuous scheduler, priority fee per CU.
- **Classic Jito**: Agave scheduler + parallel bundle path (50ms tip auction).
- **BAM**: one verifiable sequence from BAM nodes; leader must follow it.
- **Harmonic**: validator bound to a builder running a chosen strategy (FBA / FIFO / MREV / custom).
- Latency is a *threshold* on batched stacks (ms, not µs) and *direct* on continuous ones. Price wins everywhere except FIFO.

## Stake share

<!-- level: intermediate -->

| Client | Share | Source |
|---|---|---|
| Jito family (Agave + BAM) | ~54% | Blockworks Q2 2026 |
| ↳ BAM | ~33% (Q2); 34.1%, 383/665 validators (Sep 9) | Blockworks, SolanaFloor |
| ↳ Classic Jito-Agave | ~21% (derived) | — |
| Harmonic | ~21% | Blockworks Q2 2026 |
| Rakurai | ~9% | Blockworks Q2 2026 |
| Frankendancer | ~8% | Blockworks Q2 2026 |

Categories overlap (Frankendancer can run Jito/Harmonic overlays; FireBAM exists). Harmonic's strategy split is not public.

## Classic Jito

<!-- level: expert -->

**Components**
- **Bundles**: ≤5 txs, sequential, atomic, all-or-nothing, single slot. One tx transfers SOL to one of 8 tip accounts (= the bid).
- **Block Engine** (off-chain, regional): simulates, runs auction every ~50ms, groups bundles by overlapping write locks, highest tip wins per group; non-conflicting bundles all win. Forwards to connected Jito leaders.
- **Validator (jito-solana)**: bundle stage (atomic) runs *in parallel* with the normal banking stage (priority-fee scheduler) for the whole slot.
- **Tips**: leader sets itself as tip receiver → tips swept to its tip distribution account → epoch-end merkle root → validator commission + staker claims (+ Jito protocol cut).

**Facts that matter**
- No 200ms Relayer delay anymore — Jito shut its hosted Relayer fleet on 29 Apr 2026; validators connect directly to the Block Engine.
- No public mempool (shut 2024).
- No reserved top-of-block. Blocks stream as entries; bundles interleave all slot. Only a small CU reservation for tip-program cranks (unverified).
- Priority is per contested account, not block position.

**Losing an auction**
- Pay nothing (tip is inside the bundle).
- May win a later tick if still valid; usually the winner changed state → re-sim fails → dropped.
- Can't cross slots; ~2 slot useful life (third-party docs).
- No fallback to non-Jito leaders.
- Status via `getInflightBundleStatuses` (5 min lookback): `Pending` / `Failed` / `Landed` / `Invalid`.
- Watch uncled blocks — confirm at `confirmed`, not `processed`.

**Ordering**
- Within tick: tip. Across ticks: earlier first.
- TPU txs: priority fee per CU from buffer.
- **Cross-path race**: bundle stage vs banking stage on the same account → whoever grabs the lock first. Arrival/timing, not unified price.

## Jito BAM

<!-- level: expert -->

- BAM nodes (TEE-based) receive txs, sequence by published rules, forward to leader.
- Leader executes exactly in that order; BAM nodes verify; reorder/insert → disconnected.
- Single sequence → no bundle-vs-banking race.
- Within batch: scheduler rule (priority by default, unverified). Plugins can change it. Exact batch length unverified.
- Preconfirmations (live Sep 9, 2026): sequenced txs streamed early to subscribers (~5–10ms edge) via Helius / Triton. Creates an information race.
- Frankendancer support via FireBAM.

## Harmonic

<!-- level: expert -->

**Architecture**
- **Remote TPU**: aggregates txs, forwards to all builders.
- **Builders**: construct blocks per strategy.
- **Block Engine**: routes between validators and builders.
- **Validator**: executes + broadcasts.
- Streaming mode replaced the former Full Block Auction → validator is *bound* to one builder; builders compete for bindings, not per slot.
- Builder failover + direct fallback path.
- Clients: **Salsa** (Agave), **Samba** (Firedancer). Strategy via `--strategy` (Salsa) or `[tiles.bundle] strategy` (Samba); default `fba`.
- Whitelisted onboarding (validators and searchers).

**Strategies**

| Strategy | Mechanism | SFDP |
|---|---|---|
| FBA | 50ms batches, ordered by priority fee + tip | ✅ |
| FIFO | Continuous, arrival order, no fee influence | ✅ |
| MREV | Continuous, proprietary revenue-max selection | ❌ |
| Custom | Built by Harmonic on request | — |

- Tips = CU priority fees (no tip account). 100% to validator, no protocol fee.
- Red lines on all strategies: no sandwiching, no content-based censorship.
- Bundle control accounts for anti-frontrun.

**Critique angle**: Harmonic argues Jito is conflicted (infra + BAM + IBRL scoring). Harmonic is run by Temporal (also Nozomi; HumidiFi link widely reported) (unverified) — same critique applies.

## Plain Agave

<!-- level: expert -->

- No bundles, no auction.
- Continuous banking stage: buffer drained by priority fee per CU + write-lock availability.
- Pre-leader: holds txs received shortly before its slots.
- Arrival matters to be in the buffer; ~first-come on quiet accounts.

## Comparison

<!-- level: intermediate -->

| Stack | Ordering | Bid | Arrival matters | Revert protection |
|---|---|---|---|---|
| Plain Agave | Continuous, fee/CU | Priority fee | Yes | No |
| Classic Jito | 50ms tip auction ∥ Agave scheduler | Tip transfer / priority fee | Tick cutoff + lock race | Bundles |
| BAM | Single verified sequence | Priority | Batch cutoff + preconf info race | Bundles |
| Harmonic FBA | 50ms batch, fee+tip | Priority fee | Batch cutoff | Bundles |
| Harmonic FIFO | Arrival | None | Everything | Bundles |
| Harmonic MREV | Continuous, proprietary | Priority fee | Likely (opaque) | Bundles |

## Latency under batching

<!-- level: intermediate -->

- Arrival ~uniform vs batch boundary → Δ faster ≈ Δ/T more cutoffs won.
- 50ms batch: 1ms ≈ 2% more cutoffs; 1µs ≈ 0.002%.
- Batching kills the µs race, not the ms race.
- Race starts upstream: seeing state (shreds / ShredStream) + compute.
- Spam substitutes for latency (SWQoS drops, lock conflicts, skipped slots) → high failed-tx rate.

## TPU path vs bundles

<!-- level: intermediate -->

**TPU + priority fee**
- Works on every leader (incl. Harmonic via Remote TPU).
- Pays on failure. No atomicity. Can lose contested accounts to Jito bundles in the same tick.
- Needs: staked QUIC (SWQoS), direct leader targeting (current + next few), tight CU limit.

**Bundle**
- Atomic, ordered, no pay on fail, anti-frontrun controls.
- Leader-dependent (Jito/BAM or Harmonic).

**Dual-send**: send both; ensure mutual exclusion (same signature or durable nonce).

## Sender playbook

<!-- level: intermediate -->

1. Resolve leader client + strategy per slot.
2. Jito / BAM leader → bundle + tip-account transfer; optionally race a TPU copy.
3. Harmonic / plain Agave → TPU with priority fee; Harmonic bundle if atomicity needed.
4. FIFO leader → speed only; extra fee buys nothing.
5. Always: staked QUIC, leader targeting, minimal write locks, size tips off `getTipFloor`, multi-region Block Engine submit, resubmit per slot.


## Sources

- Harmonic docs: https://docs.harmonic.gg/ · scheduling strategies · FAQ
- Jito low-latency send docs: https://docs.jito.wtf/lowlatencytxnsend/
- Blockworks Q2 2026 Jito report (via Solana Compass): https://solanacompass.com/news/jito-q2-2026-protocol-revenue-falls-45-to-128m-as-bam-reaches-33-of-solana-stake
- Solana Compass, BAM preconfirmations (launch Sep 9, article Sep 11, 2026): https://solanacompass.com/news/jito-bam-preconfirmations-go-live-on-solana-covering-34-of-network-stake
- SolanaFloor / Syndica client distribution (Mar 2026)
- Shoal Research, block building on Solana
- Figment, anatomy of a Solana validator (Relayer fleet shutdown 29 Apr 2026): https://www.figment.io/insights/the-anatomy-of-a-solana-validator-where-rewards-originate-and-which-rewards-are-durable/
