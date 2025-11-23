Below is a **machine-oriented spec** for standard 3-player 斗地主 (Dou Dizhu), based mainly on:

* The official 3-player rules summarized by the Chinese General Administration of Sport via zh-Wikipedia. ([维基百科][1])
* English rules from Pagat and other English docs, used to disambiguate some bidding and play details. ([pagat.com][2])

It’s written so a code agent can directly implement a TypeScript rules engine.
Human readability is secondary; precision and explicit edge cases are primary.

---

## 0. Scope

* Variant: **3-player, 1 deck (54 cards)** 斗地主.
* Rules: Based on **Chinese competition rules** (“竞技二打一扑克”) plus mainstream online implementations (QQ/欢乐斗地主). ([维基百科][1])
* Out of scope: 4-player, wildcards, special house rules. Treat them as future extensions.

---

## 1. Core Entities (suggested conceptual model)

You don’t have to literally use these types, but keeping them in mind helps structure logic.

```ts
enum Seat { P0 = 0, P1 = 1, P2 = 2 }

enum Role { LANDLORD, FARMER }

enum Rank {
  THREE = 3, FOUR, FIVE, SIX, SEVEN, EIGHT,
  NINE, TEN, JACK, QUEEN, KING, ACE, TWO,
  SMALL_JOKER, BIG_JOKER
}

// Suits are ignored in gameplay; only rank matters.
interface Card {
  rank: Rank;
  // suit?: '♠'|'♥'|'♦'|'♣'|undefined; // Optional, but never affects comparison.
}
```

Game containers:

```ts
interface PlayerState {
  seat: Seat;
  role: Role; // assigned after bidding
  hand: Card[];
}

interface Combo {
  type: ComboType;
  mainRank?: Rank;   // Rank that determines ordering (e.g. trip rank)
  length?: number;   // e.g. sequence length, number of triples in plane
  cards: Card[];     // original cards used
}

enum ComboType {
  PASS,
  SINGLE,
  PAIR,
  TRIPLE,
  TRIPLE_WITH_SINGLE,        // 三带一
  TRIPLE_WITH_PAIR,          // 三带二
  SEQUENCE,                  // 顺子
  SEQUENCE_OF_PAIRS,         // 连对
  PLANE,                     // 飞机 (pure triples)
  PLANE_WITH_SINGLES,        // 飞机带单
  PLANE_WITH_PAIRS,          // 飞机带对
  FOUR_WITH_TWO_SINGLES,     // 四带二（单）
  FOUR_WITH_TWO_PAIRS,       // 四带二（双）
  BOMB,                      // 炸弹
  ROCKET                     // 王炸
}
```

---

## 2. Deck & Card Ordering

### 2.1 Deck

* 1× standard 52-card French deck + 2 Jokers = **54 cards**. ([维基百科][1])

* Ranks used (low → high) for normal cards:

  `3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < small Joker < big Joker` ([维基百科][1])

* **Suits are irrelevant** for validity and comparison (they matter only for card identity in the deck). ([pagat.com][2])

### 2.2 Implementation notes

* Use integer ranks as above for easy comparisons. For example:

  ```ts
  Rank.THREE = 3;
  ...
  Rank.TWO = 15;
  Rank.SMALL_JOKER = 16;
  Rank.BIG_JOKER = 17;
  ```

* A complete deck is all rank–suit pairs plus two jokers; shuffle with any RNG.

---

## 3. Game Flow & State Machine

Each **round (hand)** goes through:

1. **Setup & Deal**
2. **Bidding (叫分)**
3. **Doubling phase (加倍)**
4. **Play phase (出牌循环)**
5. **Settlement (scoring)**

You will typically have an overall **match/session** that repeats rounds and accumulates scores.

### 3.1 Setup & Deal

* 3 players, each identified by `Seat` {0,1,2}.
* Shuffle 54 cards.
* Deal **17 cards to each player**, leaving **3 cards as face-down “底牌” (kitty/bottom cards)**. ([维基百科][1])
* The kitty belongs to whoever wins the landlord bid; they will end up with **20 cards**. ([pagat.com][2])

Implementation detail:
Store:

```ts
interface RoundState {
  deck: Card[];
  bottomCards: Card[];
  players: PlayerState[];
  landlordSeat?: Seat;
  bidding: BiddingState;
  doubling: DoublingState;
  play: PlayState;
  scoring: ScoringState;
}
```

---

## 4. Bidding (叫分) – Standard “1/2/3 or pass” Variant

This follows the mainstream call-score rules (1–3) seen in offline/online Dou Dizhu and the competition rules (where score in [0,3] is called and the maximum determines landlord). ([维基百科][1])

### 4.1 Bidding values

* Allowed bids per action:
  `0` → “pass / 不叫 / 0分”
  `1`, `2`, `3` → increasing confidence; `3` is maximum.
* `0` does *not* become base score; it means no bid from that player.

### 4.2 Turn order and bidding algorithm

* Choose a **starting seat** (e.g. rotate dealer each round, or pick random).

* Maintain:

  ```ts
  let currentSeat: Seat;
  let highestBid: 0 | 1 | 2 | 3 = 0;
  let highestBidder: Seat | null = null;
  let consecutivePasses = 0;
  let bidsTaken = 0; // up to 3
  ```

* On a bidding turn (`currentSeat`):

  Allowed actions:

  * **Pass (0)** – always allowed.
  * **Bid k ∈ {1,2,3}**, subject to `k > highestBid`.

* After a bid:

  * Update `highestBid = k; highestBidder = currentSeat;`
  * Reset `consecutivePasses = 0;`

* After a pass:

  * Increment `consecutivePasses++`.

* Increment `bidsTaken++` each time any action is taken.

* Advance `currentSeat = (currentSeat + 1) % 3`.

**Stop conditions** (typical pagat + common implementations): ([pagat.com][2])

1. **If someone bids 3**, bidding ends immediately; that player becomes landlord.
2. Otherwise, once **all 3 players have had at least one bidding action** (i.e. `bidsTaken >= 3`) **and** you see **two consecutive passes after the last bid**, stop. `highestBidder` (if not null) becomes landlord.
3. **If every player only ever bids 0 (no `highestBidder`)**, abort the hand and redeal from step 3.1.

### 4.3 Assign landlord & attach bottom cards

* `landlordSeat = highestBidder`.

* Assign `role = LANDLORD` to that seat; others become `Role.FARMER`. ([维基百科][1])

* Move `bottomCards` into landlord’s hand:

  ```ts
  landlord.hand.push(...bottomCards);
  bottomCards = [];
  ```

* **Base call score** `callScore` is `highestBid ∈ {1,2,3}`. If you want a separate table base (“底注”, e.g., 1/2 coins), treat that as a separate multiplier outside rules.

---

## 5. Doubling Phase (加倍逻辑)

Based on competition rules: defenders may double, landlord may redouble; each such decision increases exponent in the final multiplier. ([维基百科][1])

Track:

```ts
interface DoublingState {
  defenderDoubles: { [seat in Seat]?: boolean }; // only FARMER seats
  landlordRedoubles: boolean; // landlord’s optional re-double
}
```

Sequence:

1. After landlord is determined and gets bottom cards, enter doubling phase.
2. **Each farmer seat in turn** chooses:

   * `DOUBLE` (加倍) – boolean true.
   * `NO_DOUBLE` (不加倍) – boolean false.
3. After both farmers decided, **landlord** chooses:

   * `REDOUBLE` (再加倍) – boolean true.
   * `NO_REDOBULE` – false.

Scoring consequences:

* Each **defender double** contributes +1 to `defenderDoubleCount`.
* Each **landlord re-double** contributes +1 to `landlordRedoubleCount`.
* These counts are included in the exponent of the final score multiplier (see §10).

Note: Per competition rules, doubling effects may apply **per defender** individually if only some doubled; more in §10.3. ([维基百科][1])

---

## 6. Legal Combination Types (牌型)

This section describes **validation rules** to classify a set of cards into exactly one `ComboType` or mark it invalid.

All definitions assume:

* Cards are from a single player’s hand.
* Cards must not repeat. (You should check hand inclusion before combo validation.)

Card rank comparisons follow §2.2.

### 6.1 Summary of allowed types (3-player official rules)

From the competition rules table (as summarized in zh-Wikipedia): ([维基百科][1])

1. 单牌 – Single
2. 对子 – Pair
3. 连对 – Sequence of pairs (≥3 consecutive pairs)
4. 顺子 – Straights (≥5 consecutive ranks)
5. 三张 – Triplet (three of same rank)
6. 三带一 – Triplet with one single
7. 三带二 – Triplet with one pair
8. 飞机 – Sequence of triplets (plane)
9. 飞机带翅膀 – Plane with equal number of singles or pairs
10. 四带二（单）– Four of a kind + 2 singles
11. 四带二（双）– Four of a kind + 2 pairs
12. 炸弹 – Pure four of a kind
13. 王炸 – Double joker rocket (small + big joker)

### 6.2 Detailed validation rules

Let `cards` be sorted ascending by rank for convenience.

#### 6.2.1 SINGLE

* `cards.length === 1`
* `ComboType.SINGLE`, `mainRank = cards[0].rank`.

#### 6.2.2 PAIR

* `cards.length === 2`.
* Both cards same rank.
* `mainRank = that rank`.
* Jokers **can** form a pair (but note rocket uses *both* jokers specifically; in official rules rocket is exactly small+big). For competition rules, the **rocket is a special 2-card combination with both jokers**; other joker pairs are not used (there’s only 2 jokers total), so effectively the only joker pair is the rocket. ([维基百科][1])

Implementation: if both jokers present, treat as `ROCKET` instead (see 6.2.13).

#### 6.2.3 TRIPLE (三张)

* `cards.length === 3`.
* All three same rank (`count(rank) === 3`).
* `mainRank = that rank`.
* Triplets of **2** are allowed (but not in sequences).

#### 6.2.4 TRIPLE_WITH_SINGLE (三带一)

* `cards.length === 4`.
* Multiset: `{ rankA: 3, rankB: 1 }` (two distinct ranks).
* `rankA` is main triplet.
* `mainRank = rankA`.
* No further restrictions on the single (can be 2 or joker). ([维基百科][1])

#### 6.2.5 TRIPLE_WITH_PAIR (三带二)

* `cards.length === 5`.
* Multiset: `{ rankA: 3, rankB: 2 }`, `rankA ≠ rankB`.
* `mainRank = rankA`.
* Pair cannot be rocket/bomb (impossible with 2 cards except both jokers; there are exactly 2 jokers, so pair of jokers is normally rocket; treat as invalid for 三带二).

  * Simplest: disallow the case where `rankB` is joker and there are exactly 2 jokers used; that would be rocket, not 三带二.

#### 6.2.6 SEQUENCE (顺子)

* `cards.length >= 5`.
* All ranks are distinct.
* No card has rank `TWO`, `SMALL_JOKER`, or `BIG_JOKER`. ([维基百科][1])
* When sorted by rank, each adjacent pair differs by 1.
* `mainRank = highest rank in sequence`.
* Max length is up to 12 cards (3..A). ([维基百科][1])

#### 6.2.7 SEQUENCE_OF_PAIRS (连对)

* `cards.length` is even and `cards.length >= 6`.
* If `cards.length = 2 * k`, require `k >= 3`.
* Frequency of each rank is either 0 or 2.
* Let `pairRanks = ranks with count === 2` sorted ascending.

  * All `pairRanks` must be distinct.
  * No `pairRank` may be `TWO`, `SMALL_JOKER`, or `BIG_JOKER`. ([维基百科][1])
  * `pairRanks` must form a consecutive sequence (difference of 1).
* `length = k` (number of pairs), `mainRank = max(pairRanks)`.

#### 6.2.8 PLANE (飞机 – pure triplet sequence)

* `cards.length` must be divisible by 3 and ≥ 6.
* Let `k = cards.length / 3`, require `k >= 2`.
* Frequency per rank is 0 or 3.
* Let `tripRanks = ranks with count === 3`, sorted ascending.

  * All `tripRanks` distinct.
  * No tripRank may be `TWO`, `SMALL_JOKER`, or `BIG_JOKER`. ([维基百科][1])
  * `tripRanks` must be consecutive.
* No extra cards besides `3*k` cards of these tripRanks.
* `length = k`, `mainRank = max(tripRanks)`.

#### 6.2.9 PLANE_WITH_SINGLES (飞机带单)

* Let `n = cards.length`.
* Must be of the form `n = 4 * k` with `k >= 2`.
* There are `k` triplets and `k` extra **single** cards. ([维基百科][1])

Validation:

1. Group by rank.
2. Find all ranks `r` with `count[r] >= 3`; for each candidate sequence of such ranks forming consecutive sequence with size `k >= 2`, check:

   * From these ranks, we use *exactly* 3 copies each, forming `3*k` cards.
   * Remaining `n - 3k = k` cards are all singletons (count == 1 each).
   * No remaining card’s rank overlaps with the chosen tripRanks.
   * Attachments cannot include:

     * Rocket (impossible with singles; they’d be split)
     * Any additional bombs (also impossible with singles).
   * Official rule further restricts: attachments **must not contain cards that would extend the plane** (i.e., no trip of rank adjacent to the sequence). ([维基百科][1])

In practice, mainstream implementations simplify by:

* **Selecting a unique plane decomposition** (if possible) and then checking singles.

Edge-case choice for code agent:

* If multiple ways to pick the plane (rare with duplicates), you can either:

  * Declare **invalid** to avoid ambiguous classification, or
  * Adopt a deterministic selection (e.g. maximal contiguous block with smallest or largest starting rank).

* `length = k`, `mainRank = max(tripRanks)`.

#### 6.2.10 PLANE_WITH_PAIRS (飞机带对)

* Total length `n = 5 * k` with `k >= 2`.
* There are `k` triplets + `k` pairs.

Validation similar to singles version:

1. Choose candidate `tripRanks` as in PLANE above (consecutive, size `k>=2`, exclude 2/jokers).
2. Use exactly 3 cards of each tripRank (total 3*k).
3. Remaining `n - 3k = 2k` cards:

   * Must partition into `k` pairs of **distinct ranks**.
   * Pair ranks must **not** be any of `tripRanks`.
   * Pairs cannot be bombs or rocket (explicitly disallow pair being double joker rocket; they are 2 cards only but rocket is special). ([维基百科][1])
4. Also attachments cannot include bombs/rocket or extend the plane by adding more triple ranks (same rationale as singles).

* `length = k`, `mainRank = max(tripRanks)`.

#### 6.2.11 FOUR_WITH_TWO_SINGLES (四带二 – 单)

* `cards.length === 6`.
* There exists a rank `r` with `count[r] === 4` (the “quad”).
* Remaining 2 cards are singletons (each count 1).
* The two singles:

  * May be same rank or different.
  * Must **not** combine with the quad to form rocket or higher bombs (impossible structurally; just ensure you’re not reusing more than 4 of same rank).
* `mainRank = r`.
* Note: this combo is **not** a bomb for beating or scoring; it’s its own type. ([维基百科][1])

#### 6.2.12 FOUR_WITH_TWO_PAIRS (四带二 – 双)

* `cards.length === 8`.
* There exists a quad rank `r` with `count[r] === 4`.
* Remaining 4 cards form **two distinct pairs**: {rankA: 2, rankB: 2}, `rankA ≠ rankB`, and `rankA, rankB` do not equal `r`. ([维基百科][1])
* The pairs must **not** be bombs or rocket:

  * So neither pair can be double jokers (rocket).
  * Quad already uses 4 of a rank; attachments shouldn’t make additional bombs.
* `mainRank = r`.
* Also **not** a bomb for beating/scoring.

#### 6.2.13 BOMB (炸弹)

* `cards.length === 4`.
* All four same rank, `count[r] === 4`.
* `mainRank = r`.
* Only **pure** four-of-a-kind with no attachments counts as bomb.
* Ranking: bombs outrank all non-bomb combos; among bombs, higher rank wins. ([维基百科][1])

#### 6.2.14 ROCKET (王炸)

* `cards.length === 2`.
* Exactly two jokers: one small + one big.
* `ComboType.ROCKET`.
* Rocket outranks **everything**, including bombs. ([维基百科][1])

#### 6.2.15 PASS

* Represented as `ComboType.PASS` with `cards.length === 0`.
* Valid action **only** when responding to someone else’s play (not when leading a new trick).

---

## 7. Comparing Combinations (牌型比较规则)

When a player is **not leading**, they may either:

* `PASS`, or
* Play a combo that **beats** the last non-pass combo.

Let `prev` be the last non-PASS combo played this trick; let `curr` be candidate.

### 7.1 Leading

* If `prev` is `null` (new trick), player **must NOT** pass and may play **any legal non-PASS combo**.

### 7.2 Generic matching rules (non-bomb/rocket)

For `prev.type` in:

* `SINGLE`
* `PAIR`
* `TRIPLE`
* `TRIPLE_WITH_SINGLE`
* `TRIPLE_WITH_PAIR`
* `SEQUENCE`
* `SEQUENCE_OF_PAIRS`
* `PLANE`
* `PLANE_WITH_SINGLES`
* `PLANE_WITH_PAIRS`
* `FOUR_WITH_TWO_SINGLES`
* `FOUR_WITH_TWO_PAIRS`

`curr` beats `prev` if:

1. `curr.type === prev.type`, and
2. `curr.length === prev.length` (for sequences/planes), and
3. `curr.mainRank > prev.mainRank`.

No other combination type can beat `prev` except bombs and rocket (see 7.3/7.4).

### 7.3 Bombs

* **Bomb vs non-bomb:**

  * Any `curr.type === BOMB` (or `ROCKET`) **can beat** any previous non-bomb combo, regardless of type or length. ([pagat.com][2])
* **Bomb vs bomb:**

  * `curr.type === BOMB` and `prev.type === BOMB`:

    * `curr.mainRank > prev.mainRank` required.
* **Bomb vs rocket:**

  * A bomb **cannot** beat rocket; only rocket can beat other bombs, not vice versa.

### 7.4 Rocket

* If `curr.type === ROCKET`, it always beats `prev` (unless `prev` is also rocket, in which case it’s impossible to beat; you can only pass after a rocket in that trick).

### 7.5 Pass

* A `PASS` never beats anything; it just skips the player’s chance in this trick. Passing does not affect your ability to play later in the same trick (you can pass then play again if it comes back and the trick is still alive). ([pagat.com][2])

### 7.6 End of trick

* Track:

  ```ts
  lastNonPassCombo: Combo | null;
  lastNonPassSeat: Seat | null;
  passCountSinceLastPlay: number;
  ```

* After each turn:

  * If player plays non-PASS:

    * `lastNonPassCombo = curr; lastNonPassSeat = currentSeat; passCountSinceLastPlay = 0;`
  * If player passes:

    * `passCountSinceLastPlay++`.

* When `passCountSinceLastPlay == 2` in a 3-player game, trick ends:

  * Next `currentSeat = lastNonPassSeat;`
  * Reset `lastNonPassCombo = null; passCountSinceLastPlay = 0;`

---

## 8. Turn Order & Play Phase

### 8.1 Initial leader

* **Landlord (庄家)** always starts the first trick after doubling phase. ([维基百科][1])
* Start with:

  ```ts
  currentSeat = landlordSeat;
  lastNonPassCombo = null;
  lastNonPassSeat = null;
  passCountSinceLastPlay = 0;
  ```

### 8.2 Legal actions per turn

For seat `s` with hand `H`:

1. Compute all **legal combos** `C ⊆ PowerSet(H)` that match rules in §6.
2. Filter them by **beating** logic vs `lastNonPassCombo`, unless leading a new trick:

   * If `lastNonPassCombo == null`:

     * Allowed: any non-PASS `combo ∈ C`. (You may not pass.)
   * Else:

     * Allowed: `PASS`, plus any `combo ∈ C` that beats `lastNonPassCombo` using §7.

### 8.3 Updating hand & bombs/rockets counters

* When a non-PASS combo `combo` is played:

  * Remove its cards from player hand.
  * If `combo.type === BOMB`, increment `bombCount`.
  * If `combo.type === ROCKET`, increment `rocketCount`.

These counts are used for scoring multipliers. ([维基百科][1])

---

## 9. Round End & Spring Conditions

### 9.1 Winning condition

* Immediately after a combo is successfully played and cards removed:

  * If `player.hand.length === 0`, the round ends and that player’s **team** wins.
* Teams:

  * Landlord team: just `landlordSeat`.
  * Farmer team: all non-landlords (2). If **any** farmer empties hand first, **farmers win collectively**. ([维基百科][3])

You do **not** continue playing after someone empties hand.

### 9.2 Spring (春天) conditions

Based on competition rules: ([维基百科][1])

Track:

```ts
playedCombosBySeat: { [seat in Seat]: number };   // count of non-PASS plays per seat
```

Definitions:

1. **Landlord Spring (庄家春天)**:

   * Landlord wins.
   * Both farmers have `playedCombosBySeat[f0] == 0` and `playedCombosBySeat[f1] == 0`
     (i.e. they never successfully played any cards at all; passes don’t count).
   * Equivalent: landlord played out while defenders only ever passed.
   * If true, add +1 to exponent (`springFlag = 1`).

2. **Farmer Spring /反春**:

   * A farmer wins.
   * Landlord must have played **exactly one combo** in the entire round:

     * `playedCombosBySeat[landlordSeat] == 1`.
   * After landlord’s first combo, the two farmers **continuously play combos** until one empties hand; landlord never gets another opportunity to play (only passes).
   * Implementation: it’s enough to check `playedCombosBySeat[landlordSeat] == 1` and that landlord’s only combo’s position in the entire play history was the very first non-PASS combo.
   * If true, also add +1 to exponent (`springFlag = 1`).

If neither spring condition holds, `springFlag = 0`.

---

## 10. Scoring

There are many scoring variants. Here we follow the **Chinese competition rules formula** given in zh-Wikipedia. ([维基百科][1])

### 10.1 Base score

* `callScore ∈ {1,2,3}` from bidding.
* Some apps multiply this by a room “底注” or stake; this spec treats `callScore` as base.

### 10.2 Multiplier exponent

Let:

* `b = callScore`
* `B = bombCount` (number of bombs played in this round)
* `R = rocketCount` (number of rockets)
* `S = springFlag` (0 or 1)
* `D_defender_i` = 1 if defender i doubled, else 0
* `D_landlord` = 1 if landlord re-doubled, else 0

Competition rules define **doubling coefficient** as:

> “加倍系数为 2^(火箭数 + 炸弹数 + 是否春天 + 防守人加倍次数 + 庄家再加倍次数)” ([维基百科][1])

However, there is also note about **per-defender doubling**: only the defender who doubled gets the extra doubling if landlord re-doubles only applies to those defenders, etc. ([维基百科][1])

For implementation, treat scoring **per pair (landlord vs each individual defender)**:

For **each defender `i`**:

* Let `d_i = 1` if defender i doubled, else 0.
* Let `d_L_i` = 1 if landlord redoubled **and** either:

  * All defenders doubled, or
  * You want to mirror the official nuance: landlord’s re-double only applies to defenders who doubled.

Most official descriptions:

* If a defender chooses to double, only they get doubled winnings/losings vs landlord; other defender unaffected unless they also doubled.
* If both defenders double and landlord redoubles, the re-double applies against both defenders; if only one defender doubled, re-double only applies for that defender. ([维基百科][1])

You can implement:

```ts
exponentCommon = B + R + S;
exponentVsDefender[i] = exponentCommon + d_i + d_L_i;
multiplierVsDefender[i] = 2 ** exponentVsDefender[i];
```

### 10.3 Outcome sign (胜负系数)

Let `winFactor`:

* If **farmers win**: `winFactor = +1`
* If **landlord wins**: `winFactor = -1`

(From the competition formula: “胜负系数为1或-1，当防守方获胜时为1，当防守方失败时为-1。” ([维基百科][1]) )

Then each defender i’s score is:

```ts
defenderScore[i] = b * winFactor * multiplierVsDefender[i]
```

Landlord’s total score is the **negative sum** of defenders’ scores:

```ts
landlordScore = -(defenderScore[farmer0] + defenderScore[farmer1]);
```

This ensures zero-sum property per round.

### 10.4 Alternative simple scoring (optional)

Many casual/English descriptions (Pagat, Wikipedia) use a simpler scheme: initial stake equal to bid; each bomb/rocket doubles the whole stake; spring doubles again. ([pagat.com][2])

If you want simpler logic (e.g. local testing), use:

```ts
exponent = B + R + S;
multiplier = 2 ** exponent;
stake = callScore * multiplier; // base per landlord vs each farmer pair

if (landlordWin) {
  landlordScore = +2 * stake;   // gets stake from both farmers
  farmerScoreEach = -stake;
} else {
  landlordScore = -2 * stake;
  farmerScoreEach = +stake;
}
```

---

## 11. Configurable Variants (for extensibility)

To help agents code a **flexible rules engine**, expose these as config flags:

```ts
interface DdzConfig {
  deckType: 'STANDARD_3P';           // only variant in this spec
  biddingMode: 'CALL_SCORE';        // or future 'GRAB'
  allowQuadplexAsBomb: boolean;     // false in official rules
  scoringMode: 'COMPETITION' | 'SIMPLE';
  usePerDefenderDoubling: boolean;  // true to match competition nuance
  revealBottomCardsBeforeMerge: boolean; // some apps show bottom cards first
}
```

Defaults for **standard competitive 3-player**:

```ts
deckType = 'STANDARD_3P';
biddingMode = 'CALL_SCORE';
allowQuadplexAsBomb = false;
scoringMode = 'COMPETITION';
usePerDefenderDoubling = true;
revealBottomCardsBeforeMerge = false; // optional UI behavior only
```

---

## 12. Implementation Checklist for Code Agent

Concrete tasks a code agent should implement with this spec:

1. **Card & deck primitives**

   * Card struct with rank.
   * Full 54-card deck generator and shuffle.

2. **Hand & combo analysis utilities**

   * Function `classifyCombo(cards: Card[]): Combo | null`.
   * Function `beats(curr: Combo, prev: Combo | null): boolean`.
   * Track bombs & rockets by monitoring combo type.

3. **Bidding engine**

   * State machine for 3-player call-score scheme.
   * Enforce `nextBid > highestBid` and 3/0 stop rules.
   * Redeal if `highestBid == 0`.

4. **Role assignment & kitty merge**

5. **Doubling state**

   * For each farmer, store `doubled: boolean`.
   * Landlord `redoubled: boolean`.

6. **Play loop**

   * Current player pointer.
   * Enforce legal action set per player (combo validation + beating rules + PASS).
   * Track lastNonPassCombo, lastNonPassSeat, passCountSinceLastPlay.
   * On `passCountSinceLastPlay == 2`, close trick and give lead to lastNonPassSeat.

7. **Round termination**

   * After every non-PASS: check hand size == 0.
   * Track `playedCombosBySeat` for spring detection.

8. **Spring and scoring**

   * At end, compute:

     * Winner side.
     * `bombCount`, `rocketCount`.
     * Springs per §9.2.
   * Apply scoring per §10 with chosen `DdzConfig`.

9. **Validation & testing**

   * Unit tests for each combo type with positive/negative examples.
   * Tests for tricky edge cases:

     * Sequences with 2/jokers.
     * Planes with overlapping candidate decompositions.
     * Four-with-two vs bomb.
     * Rocket precedence.

---

[1]: https://zh.wikipedia.org/zh-cn/%E9%AC%A5%E5%9C%B0%E4%B8%BB "斗地主 - 维基百科，自由的百科全书"
[2]: https://www.pagat.com/climbing/doudizhu.html "Dou Dizhu - card game rules"
[3]: https://en.wikipedia.org/wiki/Dou_dizhu?utm_source=chatgpt.com "Dou dizhu"
