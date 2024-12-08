Almost no one is using concentrated liquidity correctly for memecoins (some of these pools are generating 100k% APY). Some long-form alpha on how to structure/think about pools, starting with a few premises:

1. You think a coin is good, and want to particpate in upside
2. You want to DCA responsibly out of a coin as it goes up, not just hold spot
3. You want to minimize opportunity cost of capital
4. You want to profit on volatility as you do so

The majority of memecoin liquidity, especially in the early days of a new launch lives in v2 style pools. These are less capital efficient, but allow for better price discovery. So, by supplying v3 liquidity, the better execution can lead to your pools seeing more flow.

Let's take a real example with the $COST - $SOL pair. Current price is 5288 COST/SOL. Let's say you think COST goes to $1, at a SOL price of $200 - that means the top end of your range should be at 200 COST/SOL. Let's say you also want to have a buffer on the low end, in case price volatility goes to the downside - you can set the low end of your range at ~8/10k COST/SOL, which is 40-50% downside.

Put simply, these parameters will gradually DCA you out of COST into SOL as price goes up, and ensure that you stay in range as long as price doesn't drop meaningfully.

Oh, Jack, but what about Impermanent Loss? Yes, of course v3 pools have impermanent loss, but remember that IL comes relative to the baseline of holding. If you were already planning on taking profit as the number goes up, then effective impermanent loss is actually quite minimal. This is probably best practice, as these are memecoins, and what matters is consistency in execution, not going 0->100 immediately.

Ok, then what about my opportunity cost of capital? Well, because we start the low end of the range close to spot price, you actually have very low opportunity cost of capital relative to holding, as you have to supply barely any of the base asset to the pool. Additionally, you were already planning on holding the coin in spot, so there's little/no difference relative to an LP (smart contract risk). As an example, my original $COST - $SOL LP had 2.75m COST in it, with only 8 SOL supplied against it.

Well, fine, but are the fees even meaningful? Yeah, you could say that. Right now, my COST-SOL LP position is earning between 25,000 - 100,000% APR in fees generated, as the amount of volatility and volume is extremely high relative to TVL in LP. Additionally, remember that most seed/burnt LP and early depositors supply in Univ2. This means that dollar for dollar, your liquidity will be deeper with the same amount of TVL in the pool.

If you want to get really creative, you can harvest LP fees, hold memecoin token rewards to maintain spot upside, and then deposit SOL rewards into a protocol like
@KaminoFinance
that earns you an incremental 0.25% / day in rewards via their points camapaign.

So, TLDR, why LP via asymmetric concentrated liquidity?

1/ Low opportunity cost of capital, as you supply only a small amount of your base asset $SOL relative to your coin

2/ Get DCA'd out responsibly as the price of your memecoin goes up

3/ Really high fees (25k+% APY right now for $COST) through volumes on the way up

4/ Boost effective yield by harvesting / supplying into Kamino

Memecoin LP II: How I Learned to Stop Worrying and Love IL

_This will be longer form. For the basics on LPing Memcoins (why, how, risks) check the quoted post below_

Eight months ago I wrote about my experience LPing COST. It went fairly unnoticed at the time, but tripled in traction yesterday, so figured it was time for a follow-up with a more recent example.

Setup: For this to work ideally, you want to enter a memecoin fairly early, think it has legs over the medium-to-long term, and have a ton of trading volume. For this example, I used $BUCK.

As mentioned in the last post, you want to setup a v3 range with the low end of the range at a small discount to the current price of the token (I usually go ~25% below) and then the top-end of the range a good deal higher (for this one I chose ~100 BUCK/SOL or ~$2.5/BUCK). This minimizes the amount of SOL you have to deposit into the LP, and will gradually DCA you out of the memecoin and into SOL as price rises.

Let's Talk About Impermanent Loss: I'll paraphrase
@AbishekFi
's quote on the original post:

"IL is a tool not a loss... Measuring LP returns is a hot topic, but it really depends on your preference as an LP. Do you want asset A or asset B? Or are you happy having your position be just being worth more USD?

The only way that happens is by one/both of the assets in your pair going up in value, which results in IL. BUT if you're LPing two assets you dont mind holding, you've simply created an onchain DCA that simultaneously generates fees."

As
@shawmakesmagic
mentioned yesterday, this can be an incredibly valuable tool for coin developers - particularly for things like AI agents that have ongoing costs. Providing liquidity into a v3 range for a pair allows the developer to use fees to profit/cover expenses, while simultaneously participating in token upside without painting a chart red and ruining morale. It aligns value directly over the long term (depending on how you set your range).

How effective can this be? Let's take a quick look at a case study from yesterday.

$BUCK Case Study:
To show that this is effective, let's take a look at a quick example from yesterday with $BUCK, where I'll break down initial provision, Impermanent Loss sustained, Fees, generated, and ROI.

Yesterday, I created a BUCK/SOL LP with 17 SOL & 892,000 BUCK supplied. I decided to do this, as the Gamestop movement had broad appeal, the coin was moving quickly, and volatility and volumes were extremely high.

I set my range from 100 BUCK/SOL (~$2.5) at the high end, to 8,500 BUCK/SOL ($0.029) at the low end, which was about a ~20% discount to the market price of ~6900 BUCK/SOL, to ensure that my pair didn't go out of range if BUCK traded down in the short term.

This represented a total value of $~4k in SOL and $~30k in BUCK (relevant for figuring out IL later).

After 10 hours, I withdrew my LP, which had generated:

- 29.3 SOL and 156,000 BUCK in fees
- 25.1 SOL and 841,456 BUCK in LP

That $12.5k in fees over 10 hours on a $34k deposit was the approximate equivalent of ~88% in fees generated DAILY. An absolutely mind boggling number that even without compounding would be 32,120% APY.

The impermanent loss in this case cost me ~50,000 BUCK tokens, which were replaced an additional 8 SOL, which was incredibly minor from an impermanent loss perspective.

To make it even clearer:
Deposited (Total) = 17 SOL & 892,000 BUCK
Withdrew (Total) = 54.4 SOL & 997,000 BUCK
Total Profit from LP = 37.4 SOL & 105,000 BUCK

As is quite obvious, any Impermanent Loss generated by the pool was massively outweighed by fees generated through trading volumes- this is optimized in asset pairs that hold price roughly consistent with extremely high volumes, which this pair did.

Optimizing Further: The craziest part is that this could have been optimized even further, which I didn't do as this in the middle of a 16 hour flight.

Had I been at home, I would've:

- Moved the LP from the 1% fee tier to the 2% fee tier, as that was seeing more volume due to deeper liquidity
- Tightened the top end of the initial range to concentrate my liquidity further, and rebalanced the range over time if the price went up
- If you want to protect from downside after the coin goes up (no roundtripping), you can pull your LP and rebalance the bottom end of the range to be 20% from the current floor price again, pocketing any SOL that you've been DCA'd into.

In a meme market, where demand for trading volatility is extremely high and sensitivity to price is very low, positioning yourself as a passive LP is an extremely good strategy for maximizing returns. Particularly on pairs that you have long duration on, are trading high volumes, and given you're fairly agnostic between holding SOL & the meme.
