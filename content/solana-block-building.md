# Solana Block Building

_As of Sep 2026._

How Jito, BAM, Harmonic and plain Agave order transactions, and what that means for bidding.

## TL;DR

- **Plain Agave**: continuous scheduler, priority fee per CU.
- **Classic Jito**: Agave scheduler + parallel bundle path (50ms tip auction).
- **BAM**: one verifiable sequence from BAM nodes; leader must follow it.
- **Harmonic**: validator bound to a builder running a chosen strategy (FBA / FIFO / MREV / custom).
- Latency is a *threshold* on batched stacks (ms, not µs) and *direct* on continuous ones. Price wins everywhere except FIFO.

## Stake share

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

**Components**
- **Bundles**: ≤5 txs, sequential, atomic, all-or-nothing, single slot. One tx transfers SOL to one of 8 tip accounts (= the bid).
- **Block Engine** (off-chain, regional): simulates, runs auction every ~50ms, groups bundles by overlapping write locks, highest tip wins per group; non-conflicting bundles all win. Forwards to connected Jito leaders.
- **Validator (jito-solana)**: bundle stage (atomic) runs *in parallel* with the normal banking stage (priority-fee scheduler) for the whole slot.
- **Tips**: leader sets itself as tip receiver → tips swept to its tip distribution account → epoch-end merkle root → validator commission + staker claims (+ Jito protocol cut).

**Facts that matter**
- No 200ms Relayer delay anymore — validators connect directly to the Block Engine.
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

- BAM nodes (TEE-based) receive txs, sequence by published rules, forward to leader.
- Leader executes exactly in that order; BAM nodes verify; reorder/insert → disconnected.
- Single sequence → no bundle-vs-banking race.
- Within batch: scheduler rule (priority by default, unverified). Plugins can change it. Exact batch length unverified.
- Preconfirmations (live Sep 9, 2026): sequenced txs streamed early to subscribers (~5–10ms edge) via Helius / Triton. Creates an information race.
- Frankendancer support via FireBAM.

## Harmonic

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

**Critique angle**: Harmonic argues Jito is conflicted (infra + BAM + IBRL scoring). Harmonic is run by Temporal (also Nozomi, HumidiFi) — same critique applies.

## Plain Agave

- No bundles, no auction.
- Continuous banking stage: buffer drained by priority fee per CU + write-lock availability.
- Pre-leader: holds txs received shortly before its slots.
- Arrival matters to be in the buffer; ~first-come on quiet accounts.

## Comparison

| Stack | Ordering | Bid | Arrival matters | Revert protection |
|---|---|---|---|---|
| Plain Agave | Continuous, fee/CU | Priority fee | Yes | No |
| Classic Jito | 50ms tip auction ∥ Agave scheduler | Tip transfer / priority fee | Tick cutoff + lock race | Bundles |
| BAM | Single verified sequence | Priority | Batch cutoff + preconf info race | Bundles |
| Harmonic FBA | 50ms batch, fee+tip | Priority fee | Batch cutoff | Bundles |
| Harmonic FIFO | Arrival | None | Everything | Bundles |
| Harmonic MREV | Continuous, proprietary | Priority fee | Likely (opaque) | Bundles |

## Latency under batching

- Arrival ~uniform vs batch boundary → Δ faster ≈ Δ/T more cutoffs won.
- 50ms batch: 1ms ≈ 2% more cutoffs; 1µs ≈ 0.002%.
- Batching kills the µs race, not the ms race.
- Race starts upstream: seeing state (shreds / ShredStream) + compute.
- Spam substitutes for latency (SWQoS drops, lock conflicts, skipped slots) → high failed-tx rate.

## TPU path vs bundles

**TPU + priority fee**
- Works on every leader (incl. Harmonic via Remote TPU).
- Pays on failure. No atomicity. Can lose contested accounts to Jito bundles in the same tick.
- Needs: staked QUIC (SWQoS), direct leader targeting (current + next few), tight CU limit.

**Bundle**
- Atomic, ordered, no pay on fail, anti-frontrun controls.
- Leader-dependent (Jito/BAM or Harmonic).

**Dual-send**: send both; ensure mutual exclusion (same signature or durable nonce).

## Sender playbook

1. Resolve leader client + strategy per slot.
2. Jito / BAM leader → bundle + tip-account transfer; optionally race a TPU copy.
3. Harmonic / plain Agave → TPU with priority fee; Harmonic bundle if atomicity needed.
4. FIFO leader → speed only; extra fee buys nothing.
5. Always: staked QUIC, leader targeting, minimal write locks, size tips off `getTipFloor`, multi-region Block Engine submit, resubmit per slot.


## Sources

- Harmonic docs: https://docs.harmonic.gg/ · scheduling strategies · FAQ
- Jito low-latency send docs: https://docs.jito.wtf/lowlatencytxnsend/
- Blockworks Q2 2026 Jito report (via Solana Compass)
- Solana Compass, BAM preconfirmations (Sep 11, 2026)
- SolanaFloor / Syndica client distribution (Mar 2026)
- Shoal Research, block building on Solana
- Figment, anatomy of a Solana validator
