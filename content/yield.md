# Yield Strategies, In Depth

_As of Sep 2026._

Yield is the least glamorous corner of DeFi and the one where the most money quietly gets made and lost. The whole discipline reduces to one question you should ask of every number ending in "% APY": **who is paying this, and why would they keep paying it?**

<!-- only: beginner -->

## In plain terms

**What it is.** "Yield" is money you earn for parking crypto somewhere instead of holding it in a wallet. Every yield has a payer. Stakers are paid by the network's new-coin issuance and by traders' tips. Lenders are paid by borrowers. Liquidity providers are paid by people swapping tokens. If you cannot say who is paying and why they will keep paying, the number on the screen is a subsidy that will end. That one question sorts the whole field.

**The four main sources.**

- **Staking.** Lock SOL to help run the network and earn about 5% a year today, falling over the next few years as the network cuts issuance. A **liquid staking token** (LST, such as jitoSOL) is a receipt for staked SOL that you can still trade and use elsewhere.
- **Lending.** Deposit USDC or SOL into a lending protocol (Kamino, Jupiter Lend, Save); borrowers pay interest and you get most of it. Roughly 4-9% on USDC this year, spiking when traders want to borrow to bet.
- **Providing liquidity (LP).** Deposit two tokens into a pool that swappers trade against and earn the swap fees. The catch is in the next paragraph.
- **Rewards and points.** A protocol pays you in its own token to attract deposits. That is a one-off gift of unknown size, not a rate: the more people join, the smaller each share, and the token usually falls as everyone sells it.

**A tiny example.** You put 10 SOL plus $1,000 into a pool when SOL is $100, so $2,000 in total. SOL then rises 50% to $150. The pool automatically sells some of your SOL on the way up, so you end with about $2,449 of tokens. Had you simply held, you would have $2,500. That $51 gap is called **impermanent loss**, and it is what the pool hands to arbitrage bots for keeping its prices honest. Your swap fees have to beat that gap before you have made anything, and for volatile pools they usually do not.

**Why it is hard.** The quoted rate is never the rate you keep. From it you subtract: the loss above, the chance the protocol gets hacked, the chance its price feed (an **oracle**) is fooled so that someone borrows against fake collateral, the chance a stablecoin or an LST trades below its promised value (a **depeg**), and the chance you cannot withdraw when everyone rushes for the exit at once. Solana's history has an example of each: hacks of tens to hundreds of millions, a venue losing $116 million to a manipulated price feed, USDC briefly worth 87 cents.

**Looping, the popular trick.** Deposit an LST, borrow SOL against it, buy more LST, repeat. If the LST earns 7% and borrowing costs 6%, doing it five times over turns 7% into 11%. If borrowing jumps to 8%, the same position earns 3%, and at the highest leverage it goes negative. Price moves do not kill these positions; a long stretch of expensive borrowing does, and it hits everyone at the same moment.

**Who wins, who pays.** Boring positions win: staking, lending stablecoins in old markets, providing liquidity for pairs that move together. Liquidity providers in volatile pools mostly lose to arbitrage bots, and that loss is exactly the bots' revenue. Farmers who arrive early collect the emissions; those who arrive late supply the exit.

**Terms you will meet on this page.** **APY** is the yearly rate including compounding. **TVL** is the total money deposited in a protocol. **Utilization** is the share of a lending pool that is lent out; near 100% you cannot withdraw. **LTV** is loan size divided by collateral value; above a threshold you are liquidated. **Concentrated liquidity** is an LP position that only works inside a chosen price range. **LVR** is the precise name for what LPs lose to arbitrageurs. **Restaking** lends your staked SOL's security to extra services (called **NCNs**) for a small extra reward. **Emissions** are tokens a protocol prints to pay depositors.

**Bottom line.** Real yield on Solana today is roughly 5% for staking, a little more for lending and for liquidity in pairs that move together, and everything above that is leverage, a temporary subsidy, or a risk you are not being shown. Ask who pays, subtract what can go wrong, and compare what is left to plain staking.

<!-- /only -->

## The core idea

Every yield is someone else's cost. Stakers are paid by SOL holders (through inflation) and by traders (through MEV tips). Lenders are paid by borrowers. LPs are paid by swappers. Incentive farmers are paid by a protocol's token holders, who are being diluted. If you can't name the payer, you're looking at a subsidy or a ponzi, and both end.

That gives you the first sorting rule: **real yield** is paid out of a flow that exists independent of you showing up (fees, interest, block rewards). **Emissions** are paid out of a token treasury that decided to rent your capital for a while. Real yield is smaller and boring; emissions are large and temporary, and the token you're paid in usually falls as everyone farming it sells it.

The second sorting rule is that yields are quoted *gross* of the risks you're taking. A 12% supply APY on a lending market is not 12%. It's 12% minus the probability-weighted cost of an oracle failure, an admin-key compromise, a stablecoin depeg and the chance you can't withdraw when you need to. Most of this document is about pricing those subtractions.

## Native staking and liquid staking: the risk-free rate of Solana

<!-- level: intermediate -->

**Native staking** delegates SOL to a validator. You earn a share of the network's inflationary issuance plus a share of the validator's block rewards. The inflation component is mechanical and falling: Solana issues new SOL at a rate that decays 15% per year toward a 1.5% terminal rate, and with roughly two-thirds of supply staked, the nominal staking yield was about 5.25% in late August 2026, of which roughly 3.8 points is inflation and the remainder is MEV tips and priority fees.

**Liquid staking tokens (LSTs)** wrap that position in a transferable token. Three families matter on Solana:

- **jitoSOL** — the stake pool routes to validators running the Jito client, which auctions block space to searchers. Roughly 92-95% of those **MEV tips** (after validator commission and Jito's 4% fee on rewards) flow back to jitoSOL holders. Through early 2026 jitoSOL's blended yield has ranged roughly 5.9% to 7.5% depending on how busy the chain is; MEV is the swing factor.
- **mSOL (Marinade)** — algorithmic delegation across 100+ validators, roughly the network rate minus a fee on rewards; about 6.1% in early 2026.
- **Sanctum** — infrastructure that lets anyone spin up a validator-specific LST, plus **INF**, a multi-LST pool that earns staking yield *and* swap fees when users trade between LSTs. INF has been the top-yielding major LST (6.4% in Jan 2026 measurements, higher in some snapshots) precisely because it has a second payer: LST arbitrageurs.

Sizes as of today (DefiLlama): Sanctum validator LSTs $1.83B plus INF $0.22B, jitoSOL $1.18B (~14M SOL), Marinade $0.26B. Liquid staking is about 17-18% of all staked SOL; the rest is native.

**Where the return actually comes from:** ~70% inflation, ~30% MEV and priority fees, in the current mix. That split is going to move. SIMD-0228 (market-driven inflation) failed its validator vote in March 2025 at 61% versus a 67% threshold. But SIMD-553 (a larger fee burn) merged in July 2026 and SIMD-550 (doubling the disinflation rate so terminal inflation arrives in 2029, not 2032) has been in a vote since late August. If both land, 21Shares' projection has nominal staking yield falling to ~4.3% in year one, ~3% in year two, ~2.25% in year three, unless MEV and tips rise 55-95% to compensate. **Plan for the staking rate to roughly halve over three years.**

The two LST-specific risks are **depeg** (the LST trades below its stake-pool redemption value on secondary markets, usually when someone large needs to exit faster than the epoch-long unstake queue allows) and stake pool smart-contract risk. Depegs on the majors have been small and short-lived; they matter mostly because LSTs are the dominant collateral in the next two sections.

## Lending supply: you are paid by leverage demand

<!-- level: intermediate -->

Deposit USDC or SOL into Kamino, Jupiter Lend, Save or marginfi and you earn what borrowers pay, minus the protocol's cut. The mechanism is a **utilization curve**:

- **Utilization** = borrowed / deposited.
- Below a **kink** (typically 80%), the borrow rate rises gently with utilization.
- Above the kink, it rises steeply, to punish borrowers into repaying and lure depositors in before the pool runs dry.

Kamino's documented USDC example: 3-5% borrow at 40% utilization, 12-18% at the 80% kink, 35-60% at 90%, 90-160% at 95%. Your supply rate is the borrow rate scaled down twice:

**Supply APY ≈ Borrow APY × Utilization × (1 − protocol take).**

Worked: 12% borrow, 80% utilization, 15% take → 12 × 0.80 × 0.85 = **8.16%** to the lender. The idle 20% of the pool earns nothing but is what lets you withdraw on demand. Kamino USDC supply has paid roughly 4-9% through 2026, with spikes when a leverage bid shows up.

And that's the point: **supply APY is a leverage-demand gauge.** Stablecoin borrow demand comes from people looping, going long SOL on margin, or basis trading. It spikes in rallies and collapses in drawdowns, exactly when you'd want the yield most. SOL borrow demand comes overwhelmingly from LST looping (next section), which is why SOL borrow rates cluster just under the LST yield.

Sizes today (DefiLlama): Kamino Lend $1.40B, Jupiter Lend $1.15B (built on Fluid's liquidity layer with Instadapp; passed $1B within eight days of its August 2025 launch), Save $92M, Loopscale $77M. marginfi shows far lower on DefiLlama than the $450-700M cited in 2026 writeups; treat its current size as (unverified). The Solana lending sector as a whole was ~$4.6B at end-2025 and Solana's total DeFi TVL is $6.35B today.

The risks you're actually paid for: **bad debt** from an oracle failure or a collateral asset gapping through its liquidation threshold (the pool socializes it across depositors), and **liquidity risk**: at 97% utilization you cannot withdraw, full stop, until borrowers repay or the punitive rate drags them there.

## LP fees on AMMs: the yield most people misprice

<!-- level: intermediate -->

Providing liquidity is market making with your hands tied (see `market-making.md`). Three venue designs on Solana:

- **Constant product** (Raydium AMM v4-style, `x·y = k`): liquidity spread across all prices. Low fee density, low maintenance, permanent adverse selection.
- **Concentrated liquidity (CL)** (Orca Whirlpools, Raydium CLMM): you pick a price range; your capital is only active inside it. More fees per dollar, more loss per dollar, zero fees when price leaves the range.
- **DLMM** (Meteora): CL discretized into **bins** with zero slippage inside a bin, plus a **dynamic fee** that adds a volatility surcharge on top of the base fee, derived from how many bins the price has crossed recently. LPs get paid more exactly when they're being picked off hardest, which partially compensates for the next two paragraphs.

Sizes today: Raydium AMM $1.29B, Orca $293M, Meteora DLMM $186M.

<!-- level: expert -->

**Impermanent loss (IL), worked.** You deposit 10 SOL + 1,000 USDC into a constant-product pool at $100 (value $2,000; k = 10,000). SOL rises 50% to $150. The pool rebalances you to √(k/p) = 8.165 SOL and √(k·p) = 1,224.7 USDC, worth **$2,449**. Just holding would be worth **$2,500**. You're down $51, about **2.0%** versus holding, and you'd have lost the same 2.0% had SOL *fallen* to $66.7. The general formula is 2√r / (1+r) − 1 for a price ratio r. A 2x move costs 5.7%, a 4x move 20%. Concentrating the range multiplies both the fee income and the IL by roughly the concentration factor, so a 10x-tighter range turns that 2% into something near 20% of the position for the same move, and if the move exits your range you're 100% in the losing asset earning nothing.

**LVR is the sharper tool.** IL compares endpoints; it says a round trip ($100 → $150 → $100) costs nothing. It doesn't. Every time the price moves, arbitrageurs trade against your stale quote and you sell low / buy high; the round trip just hides it. **Loss-versus-rebalancing** (Milionis, Moallemi, Roughgarden and Zhang, 2022) measures this properly as the gap between your LP position and a portfolio that rebalanced at true market prices. For a constant-product pool it's **σ²/8 per unit time**. With 5% daily volatility that's 3.1 bps a day, ~11% a year; double the volatility and LVR quadruples. To break even at a 30 bp fee with 5% daily vol, a pool needs daily volume of about 10% of its TVL, every day.

**The insight that matters:** concentration does not fix LVR. It scales fees and LVR by the same factor, so a passive CL LP is just a levered version of a passive v2 LP. Unless the pool's fee-to-volatility ratio already beats σ²/8, tightening the range only makes you lose faster. The empirical record agrees: Loesch et al. found Uniswap v3 LPs earned $199M in fees against $260M of IL over May-Sep 2021, leaving 49.5% of LPs behind HODL, with *no* evidence that LPs who repositioned more often did better. There's no equivalent peer-reviewed study for Orca/Meteora (unverified), but nothing about Solana's 250ms slots changes the math; if anything, faster arbitrage means less stale-quote slack for LPs.

<!-- /level -->

Who wins at LP-ing, then? Pools where the payer is real and inelastic: stablecoin/stablecoin and LST/SOL pairs (tiny σ, so σ²/8 is negligible and even 1 bp fees cover it), and memecoin pools during a launch where uninformed volume overwhelms informed flow for a few hours. The "80% APY" headlines are the second kind, and they're annualizing a day.

## Liquidity mining, incentive tokens and points

<!-- level: intermediate -->

A protocol that wants TVL rents it: it pays depositors in its own token (or in **points** convertible to a future token). The quoted APY is `(token emissions × token price) / TVL`, which means it collapses on two fronts at once: TVL grows (denominator up) and farmers sell the token (numerator down). A fixed weekly emissions pool becomes less attractive every time someone else joins; the easiest way to destroy a points program is exactly the growth it was meant to buy.

How to think about it: treat emissions as a *one-time payment* with an unknown date and size, not as a yield. Ask what fraction of the token you'd receive, what the fully diluted valuation would need to be for that to matter, and how long the underlying real yield would have to be earned to equal it. Farm early (the denominator is small), size it as a call option, and never let emissions be the reason you hold a position whose base yield is negative. By 2026, most Solana programs have moved to Sybil-resistant, months-long points tracking, which makes fresh capital worse off than early capital by design.

## Leveraged looping: manufacturing yield from a spread

<!-- level: intermediate -->

**Looping** (Kamino Multiply, Jupiter Lend and Loopscale leverage vaults, marginfi loops) deposits an LST, borrows SOL against it, buys more LST, redeposits, and repeats. Products do it atomically with a flash loan (Kamino charges 0.001% for the flash leg). The yield comes from a **spread**: LST yield minus SOL borrow rate.

<!-- level: expert -->

**The math.** With leverage L (collateral / equity):

**Net APY = LST yield + (LST yield − borrow rate) × (L − 1).**

- jitoSOL at 7%, SOL borrowed at 6%, 5x: 7 + 1 × 4 = **11%**.
- Same position, borrow rate rises to 8%: 7 + (−1) × 4 = **3%**.
- 10x (the Kamino eMode maximum at 90% LTV), borrow at 9%: 7 + (−2) × 9 = **−11%**.

Max leverage = 1 / (1 − Max LTV): 75% LTV → 4x, 87% → 7.7x, 90% → 10x. Kamino's SOL-LST eMode liquidates at 95% LTV. You start an 8x position at 87.5% LTV with 7.5 points of headroom.

<!-- /level -->

**Liquidation risk is not what people think.** Because collateral and debt are both SOL-denominated, a SOL price move does *nothing* to LTV; Kamino prices LSTs at the stake-pool exchange rate rather than spot, so a secondary-market depeg doesn't trigger liquidations either, and no SOL-LST Multiply position has been price-liquidated in its history. What kills a loop is **negative carry over time**: LTV drifts as e^((borrow − yield)·t). From 87.5% to 95% is ln(1.0857) ≈ 8.2%; at a −2% spread that takes four years, at a −33% spread (a sustained 100% utilization spike) about 90 days. Kamino's own estimate is 23+ days at 100% utilization for max-leverage positions. The real dangers are (a) a stake-pool exploit that lowers the exchange rate, which the oracle *will* pass through, and (b) a crowded unwind: when the spread flips negative, every looper tries to repay SOL at once, SOL borrow utilization spikes further, and the last ones out pay the punitive rate.

Looping other pairs (JLP/USDC, SOL/USDC) is a different product: there you *are* price-exposed, leverage is capped around 3-4x, and a 20% drawdown at 4x is a liquidation.

## Delta-neutral vaults and basis

<!-- level: intermediate -->

Buy spot (or an LST), short the perp, collect funding plus staking yield. This is a carry trade, not a yield product; the risks are funding flipping negative, exchange/venue risk, and hedging slippage. It's covered properly in `funding-rate.md`. The vault-ified versions on Solana wrap the same trade with a management fee and less transparency about how they handle a funding regime change.

## Structured products and automated LP managers

<!-- level: intermediate -->

**Kamino Liquidity vaults**, and similar managers, take a single deposit, open a two-sided CL position on Orca/Raydium/Meteora, auto-rebalance the range when price exits it, and compound fees. TVL is $75M today, down from a much larger 2023-24 peak. The pitch is "CL fees without babysitting." The catch: every rebalance *realizes* the IL (you sell the asset that fell to rebuy the one that rose) and the LVR argument above still applies. A rebalancing vault is a passive CL LP with the additional cost of rebalancing slippage. It earns when the pair is correlated (LST/SOL, stable/stable) and bleeds on volatile pairs. Judge them on **realized return versus holding the deposit**, never on quoted fee APR.

## Restaking

<!-- level: intermediate -->

**Jito Restaking** (vaults issuing **VRTs**), **Solayer** and **Fragmetric** (fragSOL, built on Jito's vault system) let an LST secure additional services (Jito calls them **NCNs**) for extra rewards. The economics are honest but small: the reward is whatever the NCN pays for security, minus fees (Jito: 4% of rewards, 10 bps on withdrawal). Jito Restaking and Solayer show ~$19M and ~$12M on DefiLlama today, Fragmetric ~$3M, well off the $500M+ Solayer peak, as incremental yields normalized. Realistic uplift is fractions of a percent to a low single-digit point over the base LST yield (unverified; varies by NCN and is often paid in NCN tokens). You add smart-contract and slashing-design risk for a small increment; it's an option on future NCN demand more than a yield.

## Risk taxonomy

Each yield source is a bundle of these. Price them separately.

| Risk | What it means | Solana history |
|---|---|---|
| **Smart contract** | Code bug lets funds be drained or minted | Cashio infinite mint, Mar 2022, $52.8M; Crema fake-tick flash loan, Jul 2022, $8.8M; Wormhole signature flaw, Feb 2022, $326M |
| **Oracle** | Protocol prices collateral wrong; attacker borrows against inflated value | Mango Markets, Oct 2022, $116M (MNGO's oracle price jumped over 13-fold in 30 minutes on thin venues); Solend isolated pools, Nov 2022, $1.26M bad debt; Loopscale RateX PT feed, Apr 2025, $5.8M (12% of TVL, returned within 72h) |
| **Depeg** | LST or stablecoin trades below redemption value | USDC to $0.87, Mar 2023 (Circle's $3.3B at SVB); recovered in 3 days but any USDC-collateralized loan repriced by oracles was liquidatable |
| **Governance / admin key** | Privileged key changes parameters or drains | Raydium pool-owner key compromise, Dec 2022, $4.4M; Pump.fun insider withdrawal, May 2024, $1.9M |
| **Liquidity / exit** | You can't withdraw when you want | Lending pool at 97% utilization; LST unstake queue of one epoch (~30 hours at 250 ms slots) during a depeg; CL position stranded out of range |
| **Stablecoin issuer** | Reserve, banking or regulatory failure at the issuer | The USDC/SVB event is the template; USDT and newer yield-bearing stables carry different but non-zero versions |

Note the pattern in the incident list: **oracle failures are the dominant loss vector for lenders**, and they concentrate in new protocols with exotic collateral (a two-week-old market accepting a novel principal token). Old, boring collateral on old, boring protocols is where lending yield is closest to its quoted number.

## Real yield versus emissions, risk-adjusted

A practical procedure for any quoted APY:

1. **Strip emissions.** Separate the base rate (fees, interest, staking) from token incentives. Value the incentives as a lump sum, not a rate.
2. **Subtract the hurdle.** Native staking (~5.25% and falling) is Solana's risk-free rate. A 7% lending yield is 1.75 points of excess return for taking oracle, contract and liquidity risk. Ask if that's enough.
3. **Subtract expected losses.** A rough annual tail-loss budget: 0.5-1% for a battle-tested lending market, 2-5% for a young one, more for anything with a novel oracle. Multiply the loss probability by the loss size (often 100% for contract exploits, 10-30% for oracle bad debt socialized across depositors).
4. **Subtract the LVR / IL you'll actually eat**, computed from realized volatility, not from the fee APR the UI shows.
5. **Subtract correlation.** A leveraged LST loop, a SOL lending deposit and a SOL/USDC LP all fail in the same drawdown. Yield diversification across protocols is not risk diversification if they share the collateral.

What survives that filter in 2026: LST yield (the only truly passive real yield), stablecoin lending on the two large markets, correlated-pair LP-ing, and LST looping sized so a rate spike is an inconvenience rather than a liquidation. Everything else is a trade with a yield-shaped UI.

## Realistic scorecard

| Source | Return (2026) | Where it comes from | Main risks | Effort | Lockup |
|---|---|---|---|---|---|
| Native staking | 5.2-6.5% | Inflation + MEV/fees | Validator, yield decay | None | 1 epoch to unstake |
| Liquid staking (jitoSOL, INF, mSOL) | 5.9-7.5%; INF higher | Inflation + MEV + LST swap fees | Stake-pool contract, depeg | None | Liquid; epoch to redeem at par |
| Lending supply (USDC/SOL) | 4-9%, spikes higher | Borrower interest | Oracle bad debt, contract, utilization lockout | Low | Instant while utilization < ~95% |
| LP: stable/stable, LST/SOL | 2-8% | Swap fees | Contract, mild depeg | Low-medium | Instant |
| LP: volatile CL/DLMM | Quoted 20-300%; realized often negative vs hold | Swap fees minus LVR | LVR, IL, out-of-range | High | Instant, but exit price is the loss |
| Incentives / points | 0 to large, one-off | Token dilution | Token price, program rule changes | Medium | Vesting / unknown |
| LST looping (5-10x) | 10-18% in a positive-spread regime; negative when it flips | Yield-minus-borrow spread × leverage | Rate spike, stake-pool exploit, crowded unwind | Medium (monitor spread) | Unwind cost rises with utilization |
| Delta-neutral / basis | 5-20% funding-dependent | Perp funding + staking | Funding flip, venue risk | High | Positions, not lockup |
| Automated LP vaults | Pair-dependent; low single digits on correlated pairs | Swap fees minus realized IL | Same as LP plus manager fee and rebalance slippage | Low | Instant |
| Restaking | Base LST + small increment (unverified) | NCN security payments | Extra contract layer, slashing design | Low | Vault withdrawal delay |

## How this connects to the rest of the stack

<!-- level: intermediate -->

Yield is the **capital-utilization layer** underneath every other strategy in this repo's playbook. A liquidation bot, an arb engine or a market maker holds inventory that sits idle most of the time; the question is whether it sits as SOL and USDC earning zero or as jitoSOL and lending deposits earning the hurdle rate, with the constraint that it must be convertible back within a slot when an opportunity fires. LSTs are the answer for SOL inventory (swappable instantly, small discount to par); lending deposits are the answer for stables only in markets where utilization stays far from the kink, since a lockout at 97% utilization at the moment you need capital is a strategy failure, not a yield event.

The same state you'd watch as a yield allocator is an input to the offensive strategies:

- **Lending state is the liquidation engine's universe.** Utilization, borrow rates and LTV distributions on Kamino, Jupiter Lend and Save tell you where the leverage is stacked. A SOL borrow-rate spike above the LST yield is a leading indicator that loops will unwind and that positions on the *non*-correlated pairs (JLP/USDC, SOL/USDC) are approaching thresholds.
- **LST exchange rate versus secondary price is a stat-arb signal.** The stake-pool rate is the true value; the pool price is the market's guess. A discount wider than the epoch's yield plus swap cost is a carry trade (buy the LST, unstake at par); a premium is a signal that leverage demand is bidding up collateral.
- **Funding, borrow rates and LST yield are one curve.** Basis traders borrow stables to buy spot; loopers borrow SOL against LSTs; both feed the utilization curves that set supply APY. Watching all three together tells you which leg is crowded.
- **LVR is the arbitrageur's revenue.** Every basis point a passive LP loses to LVR is a basis point an arb engine collected. Understanding the LP's loss function is understanding your own P&L from the other side.

## Sources

- Sanctum, "Solana Liquid Staking Yields Ranked: Which LST Pays the Most in 2026" — https://sanctum.so/blog/solana-liquid-staking-yields-ranked-highest-paying-lsts-2026
- Datawallet, "Top 10 Solana Staking Statistics and Trends (2026)" — https://www.datawallet.com/crypto/solana-staking-statistics-and-trends
- 21Shares, "Solana's new inflation proposals cut staking yield" (SIMD-550/553, Aug 2026) — https://www.21shares.com/en-us/insights/solana-simd-550-simd-553-staking-yield
- CoinDesk, "Inside Solana's Debate on a Major Reduction in SOL Inflation" (SIMD-0228 vote) — https://www.coindesk.com/business/2025/03/06/s
- Kamino Docs, Multiply concepts (leverage formula, eMode LTVs, net APY, oracle behavior) — https://kamino.com/docs/products/multiply/concepts
- Kamino Docs, Borrow concepts (utilization curve, supply APY formula, liquidation mechanics) — https://kamino.com/docs/products/borrow/concepts
- Kairos Research, "Jupiter Lend: An Emerging Pillar in Solana's DeFi Superapp" — https://www.kairosresear.ch/p/jupiter-lend-an-emerging-pillar-in
- The Defiant, "Jupiter Lend Attracts $500 Million in TVL" — https://thedefiant.io/news/defi/solana-based-jupiter-lend-attracts-usd500-million-in-tvl
- DefiLlama API, protocol and chain TVL pulled 2026-09-24 — https://api.llama.fi/protocol/kamino-lend (and sibling slugs), https://api.llama.fi/v2/chains
- Milionis, Moallemi, Roughgarden, Zhang, "Automated Market Making and Loss-Versus-Rebalancing" — https://arxiv.org/abs/2208.06046
- a16z crypto, "LVR: Quantifying the Cost of Providing Liquidity to AMMs" — https://a16zcrypto.com/posts/article/lvr-quantifying-the-cost-of-providing-liquidity-to-automated-market-makers/
- Loesch, Hindman, Richardson, Welch, "Impermanent Loss in Uniswap v3" — https://arxiv.org/abs/2111.09192
- Solana Compass, "Solana activates 250ms slot time at epoch 1037" (18 Sep 2026) — https://solanacompass.com/news/solana-activates-250ms-slot-time-at-epoch-1037-fourth-step-of-simd-0525
- Meteora Docs, DLMM dynamic fees — https://docs.meteora.ag/product-overview/dlmm-overview/dynamic-fees
- Pine Analytics, "Meteora's DLMM" — https://pineanalytics.substack.com/p/meteoras-dlmm
- Helius, "Solana Hacks, Bugs, and Exploits: A Complete History" — https://www.helius.dev/blog/solana-hacks
- Halborn, "Explained: The Loopscale Hack (April 2025)" — https://www.halborn.com/blog/post/explained-the-loopscale-hack-april-2025
- CFTC press release on the Mango Markets manipulation — https://www.cftc.gov/PressRoom/PressReleases/8647-23
- CNBC, "Stablecoin USDC breaks dollar peg after firm reveals $3.3 billion in SVB exposure" — https://www.cnbc.com/2023/03/11/stablecoin-usdc-breaks-dollar-peg-after-firm-reveals-it-has-3point3-billion-in-svb-exposure.html
- Jito Restaking documentation — https://docs.restaking.jito.network/
- Jito Foundation, JitoSOL General FAQs (4% fee on rewards, share to stakers) — https://www.jito.network/docs/jitosol/faqs/general-faqs/
- Kiln, "Discover Jito restaking" (fees) — https://www.kiln.fi/post/discover-jito-restaking-unlocking-additional-rewards-on-solana
- Allez Labs, "Kamino V2: one month in" (liquidity vault mechanics) — https://allezlabs.substack.com/p/kamino-v2-one-month-in
- Airdrops.io, "The 2026 Airdrop Tier List" (points dilution) — https://x.com/airdrops_io/article/2090032492401095159
