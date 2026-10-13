/* ===== Script 1: engine (spec values in CA.defaults, game rules) ===== */
/* Card Album engine: rules from KAN-170 (10.14.26 tuning revision) plus labeled assumptions. */
const CA = (() => {
  const SET_NAMES = [
    "Activities", "Cat Essentials", "Outdoor Activities", "Cat Care", "Special Moments", "Cat Memes", "Viral Moments", "Cat Fans", "Work", "Weekend Picnic", "Menu", "Travels", "Fashion", "Superstar", "Dream life"
  ];
  const PACK_NAMES = ['Starter', 'Common', 'Uncommon', 'Rare', 'Epic'];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function defaults() {
    return {
      durationDays: 40,
      // cards per set by rarity [1★,2★,3★,4★,5★] (GH observed distribution)
      sets: [
        [8,1,0,0,0],[7,2,0,0,0],[6,3,0,0,0],[5,3,1,0,0],[4,4,1,0,0],
        [3,3,3,0,0],[2,3,4,0,0],[1,3,4,1,0],[1,3,4,1,0],[0,1,3,4,1],
        [0,1,3,3,2],[0,1,2,3,3],[0,1,1,4,3],[0,0,1,4,4],[0,0,1,3,5]
      ],
      setRewardEnergy: [100,100,150,150,150,200,200,200,250,250,300,300,350,400,500],
      dazzlingCount: [0,0,5,6,8],
      dazzlingReward: [0,0,25,35,50],
      finalEnergy: 800,
      prestigeEnergy: 1000,
      packs: [
        { cards: 2, odds: [92,8,0,0,0] },
        { cards: 3, odds: [80,20,0,0,0] },
        { cards: 3, odds: [82,18,0,0,0] },
        { cards: 4, odds: [40,38,15,7,0] },
        { cards: 4, odds: [37,12,17,29,5] }
      ],
      largeExtraCards: 2,          // ASSUMPTION: Large packs not sized in spec
      pityOn: true,
      pity: [8,24,3,2,1],
      starCosts: [100,200,400],
      starBoxPack: [3,4,5],
      starBoxEnergy: [0,50,100],
      overshoot: 'lost',           // ASSUMPTION: 'lost' | 'credit'
      consumeOrder: 'low',         // ASSUMPTION: 'low' | 'high'
      dazzlingLowTier: 'upgrade',  // ASSUMPTION: 1★/2★ Dazzling packs: 'upgrade' to 3★ | 'off'
      prestigeOn: true,
      prestigeWipe: true,          // ASSUMPTION: Prestige clears stored duplicates + Star balance
      jokersPerAlbum: 2,           // ASSUMPTION: F2P Jokers from live events
      jokerMaxRarity: 5,           // ASSUMPTION: Joker eligibility
      jokerDays: 1,                // 24-hour timer
      profiles: [
        { name: 'Low', energy: 200 },
        { name: 'Medium', energy: 700 },
        { name: 'High', energy: 1500 }
      ],
      orderModel: 'formula',       // 'formula' = KAN-170 Order → Card Pack Award Formula | 'flat' = GH log rates
      // KAN-170 Order → Card Pack Award Formula, keyed to total Order Energy.
      // share = ASSUMPTION: how often Orders of each size come up (avg ≈ 87 Energy, near the GH log's 85.3).
      orderBands: [
        { lo: 1,   hi: 31,   share: 30,  chance: 0,   mix: [0,0,0,0,0] },
        { lo: 32,  hi: 63,   share: 28,  chance: 20,  mix: [70,25,5,0,0] },
        { lo: 64,  hi: 127,  share: 25,  chance: 35,  mix: [55,30,15,0,0] },
        { lo: 128, hi: 255,  share: 12,  chance: 90,  mix: [70,20,10,0,0] },
        { lo: 256, hi: 511,  share: 4,   chance: 100, mix: [0,45,35,20,0] },
        { lo: 512, hi: 767,  share: 0.8, chance: 100, mix: [0,0,55,35,10] },
        { lo: 768, hi: 1000, share: 0.2, chance: 100, mix: [0,0,0,70,30] }
      ],
      avgOrderEnergy: 85.3,                    // flat model only
      orderPackRate: [15.3, 5.1, 6.0, 0, 0],  // flat model only: % of Orders awarding each tier (GH log, L8–32)
      liveOpsPacks: [16,18,18,17,11],         // PROPOSED: 80 Event Packs / 40 days
      reinvestEnergy: true,
      paidPacksPerWeek: 0,
      paidPackTier: 5,
      starStrategy: 'save',        // 'save' for Box 3 | 'asap' biggest affordable
      topUpTier: 5,
      topUpCap: 400,
      players: 10000,
      seed: 170,
      // Catfluencer Life Album is built directly into the default configuration.
      albumDef: {"name":"Card Album","sets":[{"name":"Activities","reward":100,"cards":[{"name":"Sleeping","r":1,"dazz":false},{"name":"Watching by the Window","r":1,"dazz":false},{"name":"Sitting in a Cardboard Box","r":1,"dazz":false},{"name":"Playing with a Ball of Yarn","r":1,"dazz":false},{"name":"Climbing the Cat Tower","r":1,"dazz":false},{"name":"Walking Around Someone’s Legs","r":1,"dazz":false},{"name":"Playing with a Cat Wand","r":1,"dazz":false},{"name":"Scratching","r":1,"dazz":false},{"name":"Chasing a Laser Pointer","r":2,"dazz":false}]},{"name":"Cat Essentials","reward":100,"cards":[{"name":"Cardboard Box","r":1,"dazz":false},{"name":"Food Pouches and Treat Soup","r":1,"dazz":false},{"name":"Cat Wand","r":1,"dazz":false},{"name":"Scratching Board","r":1,"dazz":false},{"name":"Cat Cushion","r":1,"dazz":false},{"name":"Yarn Ball Toy","r":1,"dazz":false},{"name":"Collar","r":1,"dazz":false},{"name":"Cat Tree","r":2,"dazz":false},{"name":"Grooming Brush","r":2,"dazz":false}]},{"name":"Outdoor Activities","reward":150,"cards":[{"name":"Cat and Flowers","r":1,"dazz":false},{"name":"Chasing Insects","r":1,"dazz":false},{"name":"Garden Corner","r":1,"dazz":false},{"name":"Cat Watching a Bird in a Tree","r":1,"dazz":false},{"name":"Squirrel Watching the Cat from Above","r":1,"dazz":false},{"name":"Garden Gnome","r":1,"dazz":false},{"name":"Gardening Tools","r":2,"dazz":false},{"name":"Garden Hose","r":2,"dazz":false},{"name":"Cat Lying on the Grass","r":2,"dazz":false}]},{"name":"Cat Care","reward":150,"cards":[{"name":"Petting","r":1,"dazz":false},{"name":"Spa Day","r":1,"dazz":false},{"name":"Hiding in the Carrier at the Vet","r":1,"dazz":false},{"name":"Brushing","r":1,"dazz":false},{"name":"Nail Trimming","r":1,"dazz":false},{"name":"Blow-Drying","r":2,"dazz":false},{"name":"Vet Visit","r":2,"dazz":false},{"name":"Tooth Brushing","r":2,"dazz":false},{"name":"Bath Time","r":3,"dazz":false}]},{"name":"Special Moments","reward":150,"cards":[{"name":"Early Morning","r":1,"dazz":false},{"name":"Midday Sun Through the Window","r":1,"dazz":false},{"name":"Nighttime","r":1,"dazz":false},{"name":"Quiet Time Before Bed","r":1,"dazz":false},{"name":"Lunar New Year","r":2,"dazz":false},{"name":"Thanksgiving","r":2,"dazz":false},{"name":"Easter","r":2,"dazz":false},{"name":"Family Time","r":2,"dazz":false},{"name":"Christmas","r":3,"dazz":false}]},{"name":"Cat Memes","reward":200,"cards":[{"name":"Tasty Milk (https://i.pinimg.com/1200x/3f/51/e1/3f51e1ad6ec7d713e382fdd78fca13cf.jpg)","r":1,"dazz":false},{"name":"Banana Cat","r":1,"dazz":false},{"name":"Side Eye(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUXcUGQBx0YDNwEv_A1FhZAmeUeddPBgYEZGDqBO2IqtMTjb1E2JaRI3DY&s=10)","r":1,"dazz":false},{"name":"Something’s Not Right(https://content.imageresizer.com/images/memes/War-Cat-meme-88f6yf.jpg)","r":2,"dazz":false},{"name":"Behind the Cuteness (https://i.pinimg.com/736x/65/13/0f/65130ff0e3e7d3890d89398c84f5e475.jpg)","r":2,"dazz":false},{"name":"Oh No! (https://i.pinimg.com/1200x/bb/43/06/bb43063fbba89253faa513facae9ed0c.jpg)","r":2,"dazz":false},{"name":"ZIP ZIP ZIP(https://i.pinimg.com/736x/59/5d/df/595ddfa295e0239b9a6e76d7133ee56f.jpg)","r":3,"dazz":true},{"name":"Bread Cat (https://www.pinterest.com/pin/624100460875856554/)","r":3,"dazz":false},{"name":"Paw Cookie (https://www.pinterest.com/pin/118782508917691776/)","r":3,"dazz":false}]},{"name":"Viral Moments","reward":200,"cards":[{"name":"Cute Outfit","r":1,"dazz":false},{"name":"Riding in a Bicycle Basket","r":1,"dazz":false},{"name":"Sitting on a Shoulder","r":2,"dazz":false},{"name":"Going for a Ride (https://www.instagram.com/spongecake_thescottishfold/reel/Dc1Ehv8Ovqk/)","r":2,"dazz":false},{"name":"On the Train","r":2,"dazz":false},{"name":"Going for a Walk","r":3,"dazz":false},{"name":"Wearing a Funny Hat","r":3,"dazz":false},{"name":"Sitting on the Desk","r":3,"dazz":false},{"name":"Riding in a Stroller","r":3,"dazz":true}]},{"name":"Cat Fans","reward":200,"cards":[{"name":"First Like","r":1,"dazz":false},{"name":"First Follower","r":2,"dazz":false},{"name":"Fan Group","r":2,"dazz":false},{"name":"100K Followers","r":2,"dazz":false},{"name":"First Fan Art","r":3,"dazz":false},{"name":"Fan Gift","r":3,"dazz":false},{"name":"One Million Followers","r":3,"dazz":false},{"name":"Fan Holding a Cat Sign","r":3,"dazz":false},{"name":"Recognized in Public","r":4,"dazz":false}]},{"name":"Work","reward":250,"cards":[{"name":"Front Side Restaurant","r":1,"dazz":false},{"name":"Menu","r":2,"dazz":false},{"name":"Customer Visits","r":2,"dazz":false},{"name":"Receipt Printer","r":2,"dazz":false},{"name":"Whisking Eggs","r":3,"dazz":false},{"name":"Coffee Machine","r":3,"dazz":true},{"name":"Cleaning Up","r":3,"dazz":false},{"name":"Rush Hour","r":3,"dazz":false},{"name":"Dough","r":4,"dazz":true}]},{"name":"Weekend Picnic","reward":250,"cards":[{"name":"Park","r":2,"dazz":false},{"name":"Shady Tree","r":3,"dazz":false},{"name":"Sun Hat","r":3,"dazz":false},{"name":"People Walking By","r":3,"dazz":true},{"name":"Picnic Basket","r":4,"dazz":false},{"name":"Blue Sky","r":4,"dazz":false},{"name":"Cat Lying on the Blanket","r":4,"dazz":false},{"name":"Cake on the Blanket","r":4,"dazz":true},{"name":"Picnic Blanket","r":5,"dazz":false}]},{"name":"Menu","reward":300,"cards":[{"name":"Cake","r":2,"dazz":false},{"name":"Coffee","r":3,"dazz":false},{"name":"Cat Toy","r":3,"dazz":false},{"name":"Ice Cream","r":3,"dazz":false},{"name":"Donut","r":4,"dazz":false},{"name":"Biscotti","r":4,"dazz":false},{"name":"Tea Time Final Output","r":4,"dazz":false},{"name":"Sponsor Gifts","r":5,"dazz":true},{"name":"Tea Time Intermediate","r":5,"dazz":false}]},{"name":"Travels","reward":300,"cards":[{"name":"World Map","r":2,"dazz":false},{"name":"Plane Ticket","r":3,"dazz":false},{"name":"Airport","r":3,"dazz":false},{"name":"On the Plane","r":4,"dazz":true},{"name":"Dining at a Restaurant","r":4,"dazz":false},{"name":"Exploring England","r":4,"dazz":false},{"name":"Exploring Italy","r":5,"dazz":true},{"name":"Exploring the USA","r":5,"dazz":false},{"name":"Exploring France","r":5,"dazz":true}]},{"name":"Fashion","reward":350,"cards":[{"name":"Wardrobe","r":2,"dazz":false},{"name":"Fashion Collar","r":3,"dazz":true},{"name":"Paw Covers","r":4,"dazz":false},{"name":"Scarf","r":4,"dazz":false},{"name":"Sunglasses","r":4,"dazz":false},{"name":"Bow Tie","r":4,"dazz":true},{"name":"Hat","r":5,"dazz":false},{"name":"Coat","r":5,"dazz":false},{"name":"Outfit","r":5,"dazz":true}]},{"name":"Superstar","reward":400,"cards":[{"name":"Magazine Cover","r":3,"dazz":false},{"name":"Brand Collaboration","r":4,"dazz":false},{"name":"Rounded Photo Card","r":4,"dazz":false},{"name":"Most-Liked Social Post","r":4,"dazz":false},{"name":"Creator Award","r":4,"dazz":true},{"name":"Giant Billboard","r":5,"dazz":true},{"name":"Major Fan Meeting","r":5,"dazz":false},{"name":"Celebrity Collaboration","r":5,"dazz":true},{"name":"Over One Million Followers","r":5,"dazz":false}]},{"name":"Dream life","reward":500,"cards":[{"name":"Dream Home","r":3,"dazz":false},{"name":"Luxury Furniture","r":4,"dazz":false},{"name":"Private Garden","r":4,"dazz":false},{"name":"Personal Snack Cabinet","r":4,"dazz":true},{"name":"Breakfast in Style","r":5,"dazz":false},{"name":"Rooftop Pool","r":5,"dazz":false},{"name":"Private Studio","r":5,"dazz":false},{"name":"Room Full of Toys","r":5,"dazz":true},{"name":"Giant Bed","r":5,"dazz":true}]}]}
    };
  }

  // Explicit album definition (set names, card names, rarity, Dazzling) generated from the rarity counts.
  function albumDefFrom(cfg) {
    const a = buildAlbum(Object.assign({}, cfg, { albumDef: null }));
    return { name: 'Card Album', sets: a.sets.map(s => ({ name: s.name, reward: s.reward,
      cards: s.cards.map(i => ({ name: a.cards[i].name, r: a.cards[i].r, dazz: a.cards[i].dazz })) })) };
  }

  function buildAlbumFromDef(cfg) {
    const cards = [], sets = [];
    cfg.albumDef.sets.forEach((sd, si) => {
      const ids = [];
      (sd.cards || []).forEach((cd, n) => {
        const r = Math.max(1, Math.min(5, Math.round(+cd.r) || 1));
        const c = { i: cards.length, set: si, r, n: n + 1, dazz: !!cd.dazz, name: String(cd.name || (sd.name + ' #' + (n + 1))) };
        cards.push(c); ids.push(c.i);
      });
      sets.push({ i: si, name: String(sd.name || 'Set ' + (si + 1)), cards: ids, size: ids.length, reward: +sd.reward || 0 });
    });
    const byR = [[], [], [], [], [], []], dazzByR = [[], [], [], [], [], []];
    cards.forEach(c => { byR[c.r].push(c.i); if (c.dazz) dazzByR[c.r].push(c.i); });
    const consumeLow = cards.slice().sort((a, b) => a.r - b.r || a.i - b.i).map(c => c.i);
    return { cards, sets, byR, dazzByR, N: cards.length, S: sets.length, consumeLow, consumeHigh: consumeLow.slice().reverse(),
      name: cfg.albumDef.name || 'Card Album' };
  }

  function buildAlbum(cfg) {
    if (cfg.albumDef && Array.isArray(cfg.albumDef.sets) && cfg.albumDef.sets.length) return buildAlbumFromDef(cfg);
    const cards = [], sets = [];
    cfg.sets.forEach((row, si) => {
      const ids = []; let n = 0;
      row.forEach((cnt, ri) => {
        for (let k = 0; k < cnt; k++) {
          n++;
          const c = { i: cards.length, set: si, r: ri + 1, n, dazz: false,
            name: (SET_NAMES[si] || 'Set ' + (si + 1)) + ' #' + n };
          cards.push(c); ids.push(c.i);
        }
      });
      sets.push({ i: si, name: SET_NAMES[si] || 'Set ' + (si + 1), cards: ids, size: ids.length,
        reward: cfg.setRewardEnergy[si] || 0 });
    });
    const byR = [[], [], [], [], [], []], dazzByR = [[], [], [], [], [], []];
    for (let r = 1; r <= 5; r++) {
      const pool = cards.filter(c => c.r === r);
      const cnt = Math.min(cfg.dazzlingCount[r - 1] || 0, pool.length);
      for (let k = 0; k < cnt; k++) pool[Math.floor((k + 0.5) * pool.length / cnt)].dazz = true;
      byR[r] = pool.map(c => c.i);
      dazzByR[r] = pool.filter(c => c.dazz).map(c => c.i);
    }
    const consumeLow = cards.slice().sort((a, b) => a.r - b.r || a.i - b.i).map(c => c.i);
    return { cards, sets, byR, dazzByR, N: cards.length, S: sets.length, consumeLow,
      consumeHigh: consumeLow.slice().reverse() };
  }

  function newState(album) {
    return {
      owned: new Uint8Array(album.N), dup: new Uint16Array(album.N),
      setProg: new Uint16Array(album.S), setDone: new Uint8Array(album.S),
      setsDone: 0, unique: 0, pity: [0, 0, 0, 0, 0, 0], credit: 0, cycle: 0,
      albumComplete: false, finalPending: false, energyGain: 0
    };
  }

  function newStats() {
    return { src: { orders: 0, live: 0, star: 0, paid: 0 }, packs: 0, cards: 0, dups: 0,
      pity: [0, 0, 0, 0, 0, 0], starsEarned: 0, starsLost: 0, boxes: [0, 0, 0],
      jokersUsed: 0, jokersWasted: 0, dazzFound: 0, energy: 0, prestiges: 0, orders: 0 };
  }

  function rollRarity(odds, min, rng) {
    let sum = 0;
    for (let i = min - 1; i < 5; i++) sum += Math.max(0, odds[i] || 0);
    if (sum <= 0) return min;
    let u = rng() * sum;
    for (let i = min - 1; i < 5; i++) { u -= Math.max(0, odds[i] || 0); if (u < 0) return i + 1; }
    return 5;
  }

  function nearestPool(pools, r) {
    if (pools[r].length) return r;
    for (let d = 1; d < 5; d++) {
      if (r - d >= 1 && pools[r - d].length) return r - d;
      if (r + d <= 5 && pools[r + d].length) return r + d;
    }
    return -1;
  }

  // Roll a card identity of rarity r, applying per-rarity duplicate-streak pity (PK07–PK12).
  function rollCard(album, st, cfg, r, dazzOnly, rng, stats) {
    let pools = dazzOnly ? album.dazzByR : album.byR;
    let rr = nearestPool(pools, r);
    if (rr < 0) { pools = album.byR; rr = nearestPool(pools, r); }
    const pool = pools[rr];
    const thr = cfg.pity[rr - 1] || 0;
    let idx = -1, pityHit = false;
    if (cfg.pityOn && thr > 0 && st.pity[rr] >= thr) {
      const miss = pool.filter(i => !st.owned[i]);
      if (miss.length) { idx = miss[Math.floor(rng() * miss.length)]; pityHit = true; stats.pity[rr]++; }
    }
    if (idx < 0) idx = pool[Math.floor(rng() * pool.length)];
    if (st.owned[idx]) st.pity[rr]++; else st.pity[rr] = 0;
    return { idx, pityHit };
  }

  // Add a card to the collection (CP01–CP07). Emits events into ev when provided.
  function acquire(album, st, cfg, idx, ev, stats) {
    const c = album.cards[idx];
    if (st.owned[idx]) {
      st.dup[idx]++; stats.dups++; stats.starsEarned += c.r;
      return false;
    }
    st.owned[idx] = 1; st.unique++;
    if (c.dazz) {
      const e = cfg.dazzlingReward[c.r - 1] || 0;
      st.energyGain += e; stats.energy += e; stats.dazzFound++;
      ev && ev.push({ type: 'dazzling', idx, energy: e });
    }
    st.setProg[c.set]++;
    const set = album.sets[c.set];
    if (!st.setDone[c.set] && st.setProg[c.set] >= set.size) {
      st.setDone[c.set] = 1; st.setsDone++;
      st.energyGain += set.reward; stats.energy += set.reward;
      ev && ev.push({ type: 'set', set: c.set, energy: set.reward });
      if (st.setsDone >= album.S) {
        st.albumComplete = true; st.finalPending = true;
        ev && ev.push({ type: 'album', cycle: st.cycle });
      }
    }
    return true;
  }

  function packLabel(p) {
    const base = PACK_NAMES[p.tier - 1];
    if (p.kind === 'large') return 'Large ' + base;
    if (p.kind === 'dazzling') return base + ' Dazzling';
    return base;
  }

  function packCardCount(cfg, p) {
    return cfg.packs[p.tier - 1].cards + (p.kind === 'large' ? cfg.largeExtraCards : 0);
  }

  // Open a pack (PK02–PK06, PK13). Slot 1 carries the minimum-rarity guarantee
  // (or the Dazzling guarantee for Dazzling packs); other slots roll the tier's odds.
  function openPack(album, st, cfg, p, rng, ev, stats) {
    const P = cfg.packs[p.tier - 1];
    const n = packCardCount(cfg, p);
    const out = [];
    for (let s = 0; s < n; s++) {
      let r, dazzOnly = false;
      if (s === 0 && p.kind === 'dazzling') {
        r = p.tier;
        if (!album.dazzByR[r].length) {
          let up = r; while (up <= 5 && !album.dazzByR[up].length) up++;
          r = up <= 5 ? up : p.tier;
        }
        dazzOnly = true;
      } else {
        r = rollRarity(P.odds, s === 0 ? p.tier : 1, rng);
      }
      const { idx, pityHit } = rollCard(album, st, cfg, r, dazzOnly, rng, stats);
      const isNew = acquire(album, st, cfg, idx, ev, stats);
      out.push({ idx, isNew, pity: pityHit });
    }
    stats.packs++; stats.cards += n;
    return out;
  }

  function starBalance(album, st) {
    let s = st.credit;
    for (let i = 0; i < album.N; i++) if (st.dup[i]) s += st.dup[i] * album.cards[i].r;
    return s;
  }

  // DS06/DS07: which stored duplicates a redemption would consume.
  function planRedeem(album, st, cfg, box) {
    const cost = cfg.starCosts[box];
    const creditUsed = Math.min(st.credit, cost);
    let need = cost - creditUsed;
    const take = [];
    const order = cfg.consumeOrder === 'high' ? album.consumeHigh : album.consumeLow;
    for (let k = 0; k < order.length && need > 0; k++) {
      const i = order[k], have = st.dup[i];
      if (!have) continue;
      const r = album.cards[i].r;
      const cnt = Math.min(have, Math.ceil(need / r));
      take.push({ idx: i, count: cnt });
      need -= cnt * r;
    }
    const ok = need <= 0;
    return { ok, cost, take, creditUsed, over: ok ? -need : 0,
      cardsUsed: take.reduce((a, t) => a + t.count, 0) };
  }

  function applyRedeem(album, st, cfg, box, plan, stats) {
    for (const t of plan.take) st.dup[t.idx] -= t.count;
    st.credit -= plan.creditUsed;
    if (cfg.overshoot === 'credit') st.credit += plan.over; else stats.starsLost += plan.over;
    const e = cfg.starBoxEnergy[box] || 0;
    st.energyGain += e; stats.energy += e; stats.boxes[box]++;
    return { tier: cfg.starBoxPack[box], kind: 'standard' };
  }

  function jokerTargets(album, st, cfg) {
    const out = [];
    for (let i = 0; i < album.N; i++)
      if (!st.owned[i] && album.cards[i].r <= cfg.jokerMaxRarity) out.push(i);
    return out;
  }

  function bestJokerTarget(album, st, cfg) {
    let best = -1, bestKey = -1;
    for (let i = 0; i < album.N; i++) {
      const c = album.cards[i];
      if (st.owned[i] || c.r > cfg.jokerMaxRarity) continue;
      const key = c.r * 1000 + st.setProg[c.set];
      if (key > bestKey) { bestKey = key; best = i; }
    }
    return best;
  }

  function claimFinal(st, cfg, stats) {
    if (!st.finalPending) return 0;
    const e = st.cycle === 0 ? cfg.finalEnergy : cfg.prestigeEnergy;
    st.finalPending = false; st.energyGain += e; stats.energy += e;
    return e;
  }

  // PR01–PR05
  function startPrestige(album, st, cfg, stats) {
    if (!st.albumComplete) return false;
    if (st.finalPending) claimFinal(st, cfg, stats);
    st.cycle++;
    st.owned.fill(0); st.setProg.fill(0); st.setDone.fill(0);
    st.setsDone = 0; st.unique = 0; st.albumComplete = false;
    st.pity = [0, 0, 0, 0, 0, 0];
    if (cfg.prestigeWipe) { st.dup.fill(0); st.credit = 0; }
    return true;
  }

  function spreadDays(count, days, offset) {
    const out = [];
    for (let k = 0; k < count; k++) out.push(Math.min(days - 1, Math.floor((k + offset) * days / count)));
    return out;
  }

  function pickWeighted(weights, rng) {
    let sum = 0; for (const w of weights) sum += Math.max(0, w || 0);
    if (sum <= 0) return -1;
    let u = rng() * sum;
    for (let i = 0; i < weights.length; i++) { u -= Math.max(0, weights[i] || 0); if (u < 0) return i; }
    return weights.length - 1;
  }

  // Roll the next Order the player will complete (formula model).
  function drawOrder(cfg, rng) {
    const b = Math.max(0, pickWeighted(cfg.orderBands.map(x => x.share), rng));
    const band = cfg.orderBands[b];
    const lo = Math.max(1, band.lo), hi = Math.max(lo, band.hi);
    return { energy: lo + Math.floor(rng() * (hi - lo + 1)), band: b };
  }

  function bandFor(cfg, energy) {
    for (let i = cfg.orderBands.length - 1; i >= 0; i--) if (energy >= cfg.orderBands[i].lo) return i;
    return 0;
  }

  // KAN-170 Order → Card Pack Award Formula: pack chance by Order Energy, then tier mix.
  function orderReward(cfg, order, rng) {
    const band = cfg.orderBands[bandFor(cfg, order.energy)];
    if (rng() * 100 >= band.chance) return { chance: band.chance, tier: 0 };
    const t = pickWeighted(band.mix, rng);
    return { chance: band.chance, tier: t < 0 ? 0 : t + 1 };
  }

  function avgOrderEnergy(cfg) {
    if (cfg.orderModel !== 'formula') return cfg.avgOrderEnergy;
    let s = 0, w = 0;
    cfg.orderBands.forEach(b => { s += b.share * (Math.max(1, b.lo) + Math.max(b.lo, b.hi)) / 2; w += b.share; });
    return w ? s / w : 0;
  }

  function newOrderState() { return { left: 0, next: null, done: 0, packs: 0 }; }

  // Complete Orders until the next one costs more Energy than is left (it waits for tomorrow).
  function completeOrdersWithEnergy(cfg, ost, rng, max) {
    const out = [];
    while (out.length < (max || 1e9)) {
      if (!ost.next) ost.next = drawOrder(cfg, rng);
      if (ost.next.energy > ost.left) break;
      out.push(completeNextOrder(cfg, ost, rng));
    }
    return out;
  }
  function completeNextOrder(cfg, ost, rng) {
    if (!ost.next) ost.next = drawOrder(cfg, rng);
    const o = ost.next; ost.next = null;
    ost.left -= o.energy; ost.done++;
    const r = orderReward(cfg, o, rng);
    if (r.tier) ost.packs++;
    return { n: ost.done, energy: o.energy, chance: r.chance, tier: r.tier };
  }

  // Generate one day's pack income for a player at a given energy level.
  function dailyIncome(cfg, energy, day, liveSchedule, rng, ost) {
    const packs = [];
    let nOrd = 0;
    if (cfg.orderModel === 'formula' && ost) {
      ost.left += energy;
      const done = completeOrdersWithEnergy(cfg, ost, rng);
      nOrd = done.length;
      for (const o of done) if (o.tier) packs.push({ tier: o.tier, kind: 'standard', src: 'orders' });
    } else {
      const orders = energy / Math.max(1, cfg.avgOrderEnergy);
      nOrd = Math.floor(orders) + (rng() < orders - Math.floor(orders) ? 1 : 0);
      for (let o = 0; o < nOrd; o++) {
        let u = rng() * 100;
        for (let t = 0; t < 5; t++) {
          u -= cfg.orderPackRate[t] || 0;
          if (u < 0) { packs.push({ tier: t + 1, kind: 'standard', src: 'orders' }); break; }
        }
      }
    }
    for (const it of liveSchedule) if (it.day === day) packs.push({ tier: it.tier, kind: 'standard', src: 'live' });
    if (cfg.paidPacksPerWeek > 0 && (day + 1) % 7 === 0)
      for (let k = 0; k < cfg.paidPacksPerWeek; k++) packs.push({ tier: cfg.paidPackTier, kind: 'standard', src: 'paid' });
    return { packs, orders: nOrd };
  }

  function liveScheduleFor(cfg, rng) {
    const tiers = [];
    cfg.liveOpsPacks.forEach((n, t) => { for (let k = 0; k < n; k++) tiers.push(t + 1); });
    for (let i = tiers.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [tiers[i], tiers[j]] = [tiers[j], tiers[i]]; }
    const days = spreadDays(tiers.length, cfg.durationDays, 0);
    return tiers.map((tier, k) => ({ tier, day: days[k] }));
  }

  function spendStars(album, st, cfg, rng, stats, strategy, finalDump) {
    let guard = 0;
    while (guard++ < 500) {
      const bal = starBalance(album, st);
      let box = -1;
      if (strategy === 'save' && !finalDump) { if (bal >= cfg.starCosts[2]) box = 2; }
      else { for (let b = 2; b >= 0; b--) if (bal >= cfg.starCosts[b]) { box = b; break; } }
      if (box < 0) return;
      const plan = planRedeem(album, st, cfg, box);
      if (!plan.ok) return;
      const pack = applyRedeem(album, st, cfg, box, plan, stats);
      stats.src.star++;
      openPack(album, st, cfg, pack, rng, null, stats);
    }
  }

  function simPlayer(album, cfg, energyPerDay, rng) {
    const D = cfg.durationDays;
    const st = newState(album), stats = newStats();
    const live = liveScheduleFor(cfg, rng);
    const jokerDays = spreadDays(cfg.jokersPerAlbum, D, 0.5);
    const curve = new Uint16Array(D);
    let bank = 0, completeDay = 0, startedPrestige = false;
    const ost = newOrderState();
    for (let d = 0; d < D; d++) {
      const energy = energyPerDay + (cfg.reinvestEnergy ? bank : 0);
      bank = 0;
      const inc = dailyIncome(cfg, energy, d, live, rng, ost);
      stats.orders += inc.orders;
      for (const p of inc.packs) {
        stats.src[p.src]++;
        openPack(album, st, cfg, p, rng, null, stats);
        if (st.albumComplete) handleComplete();
      }
      for (const jd of jokerDays) if (jd === d) {
        const t = bestJokerTarget(album, st, cfg);
        if (t >= 0) { acquire(album, st, cfg, t, null, stats); stats.jokersUsed++; if (st.albumComplete) handleComplete(); }
        else stats.jokersWasted++;
      }
      spendStars(album, st, cfg, rng, stats, cfg.starStrategy, d === D - 1);
      if (st.albumComplete) handleComplete();
      bank += st.energyGain; st.energyGain = 0;
      curve[d] = st.cycle > 0 ? album.N : st.unique;
    }
    function handleComplete() {
      claimFinal(st, cfg, stats);
      if (st.cycle > 0) stats.prestiges++;
      if (cfg.prestigeOn) { startPrestige(album, st, cfg, stats); startedPrestige = true; }
      else { st.albumComplete = false; st.finalPending = false; st.completeLocked = true; }
    }
    // completion day = first day the curve reaches N
    for (let d = 0; d < D; d++) if (curve[d] >= album.N) { completeDay = d + 1; break; }
    const completed = completeDay > 0;
    const setsDone = completed ? Array.from({ length: album.S }, () => 1) : Array.from(st.setDone);
    let fiveStars = 0;
    if (completed) fiveStars = album.byR[5].length;
    else for (const i of album.byR[5]) if (st.owned[i]) fiveStars++;
    // Top-up: counterfactual paid packs needed to finish the first album.
    let topUp = 0, capped = false;
    if (!completed) {
      const throwaway = newStats();
      while (!st.albumComplete && !st.completeLocked && topUp < cfg.topUpCap) {
        openPack(album, st, cfg, { tier: cfg.topUpTier, kind: 'standard' }, rng, null, throwaway);
        topUp++;
        if (!st.albumComplete) spendStars(album, st, cfg, rng, throwaway, cfg.starStrategy, false);
      }
      capped = !st.albumComplete && !st.completeLocked;
    }
    return { stats, curve, completeDay, completed, setsDone, sets: setsDone.reduce((a, b) => a + b, 0),
      unique: completed ? album.N : curve[D - 1], fiveStars, topUp, capped, startedPrestige };
  }

  function quantile(sorted, q) {
    if (!sorted.length) return NaN;
    const pos = (sorted.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  }

  function aggregate(album, cfg, results) {
    const n = results.length, D = cfg.durationDays;
    const mean = f => results.reduce((a, r) => a + f(r), 0) / n;
    const curveMed = [], curveP10 = [], curveP90 = [];
    for (let d = 0; d < D; d++) {
      const col = results.map(r => r.curve[d]).sort((a, b) => a - b);
      curveMed.push(quantile(col, 0.5)); curveP10.push(quantile(col, 0.1)); curveP90.push(quantile(col, 0.9));
    }
    const perSet = album.sets.map((_, si) => results.reduce((a, r) => a + r.setsDone[si], 0) / n * 100);
    const days = results.filter(r => r.completed).map(r => r.completeDay).sort((a, b) => a - b);
    const tops = results.filter(r => !r.completed).map(r => r.topUp).sort((a, b) => a - b);
    const setsSorted = results.map(r => r.sets).sort((a, b) => a - b);
    const setsHist = new Array(album.S + 1).fill(0);
    results.forEach(r => setsHist[r.sets]++);
    return {
      n, completion: days.length / n * 100, medianDay: quantile(days, 0.5),
      setsMean: mean(r => r.sets), setsMedian: quantile(setsSorted, 0.5), setsHist,
      unique: mean(r => r.unique), fiveStars: mean(r => r.fiveStars), fiveTotal: album.byR[5].length,
      packs: mean(r => r.stats.packs),
      src: { orders: mean(r => r.stats.src.orders), live: mean(r => r.stats.src.live),
        star: mean(r => r.stats.src.star), paid: mean(r => r.stats.src.paid) },
      cards: mean(r => r.stats.cards), dupShare: mean(r => r.stats.cards ? r.stats.dups / r.stats.cards : 0) * 100,
      starsEarned: mean(r => r.stats.starsEarned), starsLost: mean(r => r.stats.starsLost),
      boxes: [0, 1, 2].map(b => mean(r => r.stats.boxes[b])),
      pity: [1, 2, 3, 4, 5].map(rr => mean(r => r.stats.pity[rr])),
      jokersUsed: mean(r => r.stats.jokersUsed), jokersWasted: mean(r => r.stats.jokersWasted),
      dazz: mean(r => r.stats.dazzFound), dazzTotal: album.cards.filter(c => c.dazz).length,
      energy: mean(r => r.stats.energy), prestiges: mean(r => r.stats.prestiges),
      orders: mean(r => r.stats.orders),
      orderPackRate: mean(r => r.stats.orders ? r.stats.src.orders / r.stats.orders : 0) * 100,
      prestigeStart: results.filter(r => r.startedPrestige).length / n * 100,
      topUpN: tops.length, topMed: quantile(tops, 0.5), topP75: quantile(tops, 0.75), topP90: quantile(tops, 0.9),
      capped: results.filter(r => r.capped).length,
      curveMed, curveP10, curveP90, perSet
    };
  }

  // Async Monte Carlo runner with progress callback.
  function runSimulation(cfg, onProgress) {
    const album = buildAlbum(cfg);
    const profiles = cfg.profiles;
    const total = profiles.length * cfg.players;
    const out = profiles.map(() => []);
    let done = 0;
    return new Promise(resolve => {
      let pi = 0, k = 0;
      function step() {
        const t0 = performance.now();
        while (pi < profiles.length && performance.now() - t0 < 30) {
          const rng = mulberry32((cfg.seed * 1000003 + pi * 7919 + k * 104729) >>> 0);
          out[pi].push(simPlayer(album, cfg, profiles[pi].energy, rng));
          k++; done++;
          if (k >= cfg.players) { pi++; k = 0; }
        }
        onProgress && onProgress(done / total);
        if (pi < profiles.length) setTimeout(step, 0);
        else resolve({ album, profiles: profiles.map((p, i) => ({ name: p.name, energy: p.energy, agg: aggregate(album, cfg, out[i]) })) });
      }
      step();
    });
  }

  return { SET_NAMES, PACK_NAMES, mulberry32, defaults, buildAlbum, albumDefFrom, newState, newStats, openPack, acquire,
    starBalance, planRedeem, applyRedeem, jokerTargets, claimFinal, startPrestige, dailyIncome,
    liveScheduleFor, spreadDays, packLabel, packCardCount, runSimulation, simPlayer, aggregate,
    drawOrder, orderReward, bandFor, avgOrderEnergy, newOrderState, completeNextOrder, completeOrdersWithEnergy };
})();
if (typeof module !== 'undefined') module.exports = CA;


/* ===== Script 2: spec (Spec tab editor; saves in this browser) ===== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (v, d = 0) => (v === null || v === undefined || !isFinite(v)) ? '–' : Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const clone = o => JSON.parse(JSON.stringify(o));
  const LS = 'caLab.spec.catfluencerLife.v2';
  const DOC = 'spec/current';
  const GH_RARITY = [37, 29, 28, 23, 18];

  function base() {
    const c = CA.defaults();
    if (!c.albumDef) c.albumDef = CA.albumDefFrom(c);
    c.notes = c.notes || '';
    return c;
  }
  // Merge a saved spec onto the current defaults so older saves keep working.
  function normalize(saved) {
    const b = base();
    if (!saved || typeof saved !== 'object') return b;
    for (const k in b) {
      if (saved[k] === undefined) continue;
      if (Array.isArray(b[k]) !== Array.isArray(saved[k])) continue;
      if (typeof b[k] !== typeof saved[k] && b[k] !== null) continue;
      b[k] = saved[k];
    }
    if (saved.albumDef && Array.isArray(saved.albumDef.sets)) b.albumDef = saved.albumDef;
    return b;
  }
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(LS)); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  const local = store.get();
  const S = {
    active: normalize(local && local.spec), stamp: local ? 'local-' + local.savedAt : 'default',
    savedAt: local ? local.savedAt : null, savedBy: null, mode: 'local', db: null, user: null, uid: null,
    canWrite: null, readOnly: false, draft: null, dirty: false, remoteNewer: null, msg: '', open: new Set([0])
  };
  S.draft = clone(S.active);

  window.SpecStore = {
    activeCopy: () => clone(S.active),
    stamp: () => S.stamp,
    info: () => ({ mode: S.mode, savedAt: S.savedAt })
  };

  function notifyApp() { if (window.AlbumApp) window.AlbumApp.specChanged(); }

  /* ---------------- shared saving (artifact db) ---------------- */
  (async () => {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') return;
    let db = null, user = null;
    try { db = await cl.use('db'); } catch (e) { db = null; }
    if (!db) return;
    try { user = await cl.use('user'); } catch (e) { user = null; }
    S.db = db; S.user = user; S.mode = 'shared';
    if (user) {
      try { S.uid = await user.id(); } catch (e) { S.uid = null; }
      try { S.canWrite = await user.can('data.write'); } catch (e) { S.canWrite = null; }
    }
    if (S.canWrite === false) S.readOnly = true;
    render();
    db.doc(DOC).onSnapshot(snap => {
      if (!snap.exists) { render(); return; }
      const d = snap.data() || {};
      if (d.savedAt === S.savedAt && S.stamp.startsWith('db-')) return;
      let spec = null;
      try { spec = normalize(JSON.parse(d.json)); } catch (e) { return; }
      S.active = spec; S.savedAt = d.savedAt; S.savedBy = d.savedBy || null; S.stamp = 'db-' + d.savedAt;
      if (S.dirty) S.remoteNewer = { spec, savedBy: d.savedBy || null };
      else S.draft = clone(spec);
      render(); notifyApp();
    }, () => { /* keep working from the last known spec */ });
  })();

  async function nameFor(id) {
    if (!id || !S.user || !S.user.profiles) return '';
    try { const ps = await S.user.profiles([id]); return (ps && ps[id] && ps[id].name) || ''; } catch (e) { return ''; }
  }

  async function save() {
    const savedAt = Date.now();
    const spec = clone(S.draft);
    if (S.db && !S.readOnly) {
      try {
        await S.db.doc(DOC).set({ json: JSON.stringify(spec), savedAt, savedBy: S.uid || null });
        S.active = spec; S.savedAt = savedAt; S.savedBy = S.uid; S.stamp = 'db-' + savedAt;
        S.dirty = false; S.remoteNewer = null; S.msg = 'Saved for everyone.';
      } catch (e) {
        if (e && (e.code === 'invalid_argument' || e.code === 'not_granted')) {
          S.readOnly = true; S.msg = 'You can view this spec but not save it. The owner needs to invite you as an Editor.';
        } else if (e && e.code === 'unavailable') {
          S.msg = 'Saving failed for a moment. Try Save again.';
        } else S.msg = 'Saving failed: ' + ((e && e.message) || 'unknown error') + '.';
        render(); return;
      }
    } else {
      store.set({ spec, savedAt });
      S.active = spec; S.savedAt = savedAt; S.stamp = 'local-' + savedAt; S.dirty = false;
      S.msg = 'Saved in this browser. Use Copy spec to send it to someone else.';
    }
    render(); notifyApp();
  }

  /* ---------------- editor ---------------- */
  const num = (path, v, attrs = '') => `<input type="number" data-sp="${path}" value="${v}" ${attrs} aria-label="${path}">`;
  const txt = (path, v, attrs = '') => `<input type="text" data-sp="${path}" value="${esc(v)}" ${attrs} aria-label="${path}">`;
  const chk = (path, v) => `<input type="checkbox" data-sp="${path}" ${v ? 'checked' : ''} aria-label="${path}">`;
  const sel = (path, v, opts) => `<select data-sp="${path}" data-num="1" aria-label="${path}">${opts.map(([a, l]) => `<option value="${a}" ${String(a) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const R5 = [1, 2, 3, 4, 5].map(r => [r, r + '★']);
  const TIERS = CA.PACK_NAMES.map((n, i) => [i + 1, `${i + 1}★ ${n}`]);

  function setSummary(sd) {
    const cnt = [0, 0, 0, 0, 0]; let dz = 0;
    sd.cards.forEach(c => { cnt[(c.r || 1) - 1]++; if (c.dazz) dz++; });
    return `${sd.cards.length} cards · ${cnt.map((n, i) => n ? `${n}×${i + 1}★` : '').filter(Boolean).join(' ')}${dz ? ` · ${dz} Dazzling` : ''} · ${fmt(sd.reward)} Energy`;
  }

  function render() {
    const host = $('#tab-spec'); if (!host || host.hidden) return;
    const d = S.draft, ad = d.albumDef;
    const when = S.savedAt ? new Date(S.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;
    const status = S.mode === 'shared'
      ? (when ? `Shared spec · last saved ${when}<span id="sp-by"></span>` : 'Shared spec · nothing saved yet, so everyone is playing the KAN-170 defaults')
      : (when ? `Saved in this browser ${when}` : 'Using the KAN-170 defaults');
    const setsHTML = ad.sets.map((sd, si) => `
      <details class="spset" data-si="${si}" ${S.open.has(si) ? 'open' : ''}>
        <summary><b>${si + 1}. <span data-sum="sname${si}">${esc(sd.name)}</span></b><span class="muted" data-sum="set${si}">${setSummary(sd)}</span></summary>
        <div class="spsetbody">
          <div class="row"><label class="inline" style="flex:1;min-width:200px">Set name ${txt(`albumDef.sets.${si}.name`, sd.name, 'style="flex:1"')}</label>
            <label class="inline">Set reward (Energy) ${num(`albumDef.sets.${si}.reward`, sd.reward, 'min="0" step="10"')}</label></div>
          <div class="tablewrap"><table class="mini sptable"><thead><tr><th>#</th><th style="text-align:left">Card name</th><th>Rarity</th><th>Dazzling</th></tr></thead><tbody>
            ${sd.cards.map((c, ci) => `<tr><td>${ci + 1}</td><td>${txt(`albumDef.sets.${si}.cards.${ci}.name`, c.name, 'class="cname-in"')}</td><td>${sel(`albumDef.sets.${si}.cards.${ci}.r`, c.r, R5)}</td><td>${chk(`albumDef.sets.${si}.cards.${ci}.dazz`, c.dazz)}</td></tr>`).join('')}
          </tbody></table></div>
        </div>
      </details>`).join('');

    host.innerHTML = `
      <div class="panel stack specbar" style="gap:10px">
        <div class="row" style="justify-content:space-between;align-items:flex-start">
          <div class="stack" style="gap:4px;min-width:0">
            <h2>Album spec</h2>
            <p class="ink2" style="font-size:14px">${status}</p>
          </div>
          <div class="row">
            <span class="tag ${S.dirty ? 'pity' : ''}" id="sp-dirty">${S.dirty ? 'Unsaved changes' : 'No unsaved changes'}</span>
            <button class="btn" data-sa="discard" ${S.dirty ? '' : 'disabled'}>Discard changes</button>
            <button class="btn primary" data-sa="save" ${S.dirty && !S.readOnly ? '' : 'disabled'}>${S.mode === 'shared' ? 'Save for everyone' : 'Save'}</button>
          </div>
        </div>
        ${S.readOnly ? `<div class="banner warn"><p>You can view this spec but not save it. The owner needs to invite you as an <b>Editor</b> from the Share menu. You can still use Copy spec below.</p></div>` : ''}
        ${S.remoteNewer ? `<div class="banner accent"><p><b>Someone saved a newer version</b> while you were editing.</p><div class="row"><button class="btn small" data-sa="loadremote">Load it (drops your edits)</button><button class="btn small" data-sa="keepmine">Keep editing mine</button></div></div>` : ''}
        ${S.msg ? `<p class="muted" role="status" style="font-size:13.5px">${esc(S.msg)}</p>` : ''}
        <p class="muted" style="font-size:13px">Edit anything below, then save. The Orders and Album tabs play the saved spec: reset the album there to start playing a newly saved version.</p>
      </div>

      <div class="panel stack" style="gap:8px">
        <h3>Change notes</h3>
        <textarea data-sp="notes" rows="3" placeholder="What changed in this version and why" style="font-family:var(--f-body);font-size:14px">${esc(d.notes || '')}</textarea>
      </div>

      <div class="sgrid">
        <fieldset><legend>Album</legend><div class="fields">
          <label class="field"><span>Album name</span>${txt('albumDef.name', ad.name || 'Card Album', 'style="width:200px"')}</label>
          <label class="field"><span>Album length (days)</span>${num('durationDays', d.durationDays, 'min="1" max="120"')}</label>
          <label class="field"><span>Energy per day (prototype)</span>${num('profiles.2.energy', d.profiles[2].energy, 'min="0" step="25"')}</label>
          <label class="field"><span>Final Album Reward (Energy)</span>${num('finalEnergy', d.finalEnergy, 'min="0" step="50"')}</label>
          <label class="field"><span>Prestige on</span>${chk('prestigeOn', d.prestigeOn)}</label>
          <label class="field"><span>Prestige Album Reward (Energy)</span>${num('prestigeEnergy', d.prestigeEnergy, 'min="0" step="50"')}</label>
          <label class="field"><span>Free Jokers per album</span>${num('jokersPerAlbum', d.jokersPerAlbum, 'min="0" max="40"')}</label>
          <label class="field"><span>Joker can pick up to</span>${sel('jokerMaxRarity', d.jokerMaxRarity, R5)}</label>
          <div class="tablewrap"><table class="mini"><thead><tr><th>Totals</th><th>1★</th><th>2★</th><th>3★</th><th>4★</th><th>5★</th><th>All</th></tr></thead><tbody>
            <tr><td>Cards in this spec</td>${[0, 1, 2, 3, 4].map(i => `<td class="sum" data-sum="r${i}"></td>`).join('')}<td class="sum" data-sum="rall"></td></tr>
            <tr><td>Gossip Harbor</td>${GH_RARITY.map(n => `<td>${n}</td>`).join('')}<td>135</td></tr>
            <tr><td>Dazzling cards</td>${[0, 1, 2, 3, 4].map(i => `<td class="sum" data-sum="dz${i}"></td>`).join('')}<td class="sum" data-sum="dzall"></td></tr>
            <tr><td>Dazzling reward (Energy)</td>${d.dazzlingReward.map((v, i) => `<td>${num(`dazzlingReward.${i}`, v, 'min="0" step="5"')}</td>`).join('')}<td></td></tr>
          </tbody></table></div>
        </div></fieldset>

        <div class="stack">
          <fieldset><legend>Card packs</legend><div class="fields">
            <div class="tablewrap"><table class="mini"><thead><tr><th>Pack</th><th>Cards</th><th>1★%</th><th>2★%</th><th>3★%</th><th>4★%</th><th>5★%</th><th>Sum</th></tr></thead><tbody>
              ${d.packs.map((p, t) => `<tr><td>${t + 1}★ ${CA.PACK_NAMES[t]}</td><td>${num(`packs.${t}.cards`, p.cards, 'min="1" max="12"')}</td>${p.odds.map((v, k) => `<td>${num(`packs.${t}.odds.${k}`, v, 'min="0" max="100" step="0.5"')}</td>`).join('')}<td class="sum" data-sum="odds${t}"></td></tr>`).join('')}
            </tbody></table></div>
            <p class="muted" style="font-size:12.5px">Card counts start at the Gossip Harbor observations (2 / 3 / 3 / 4 / 4). The first card in each pack is guaranteed to be at least the pack's star rating.</p>
          </div></fieldset>
          <fieldset><legend>Pity and Star Store</legend><div class="fields">
            <label class="field"><span>Pity on</span>${chk('pityOn', d.pityOn)}</label>
            <div class="tablewrap"><table class="mini"><thead><tr><th>Duplicates in a row</th><th>1★</th><th>2★</th><th>3★</th><th>4★</th><th>5★</th></tr></thead><tbody><tr><td>Pity threshold</td>${d.pity.map((v, i) => `<td>${num(`pity.${i}`, v, 'min="0" max="99"')}</td>`).join('')}</tr></tbody></table></div>
            <div class="tablewrap"><table class="mini"><thead><tr><th>Star Box</th><th>Cost ★</th><th>Pack</th><th>Energy</th></tr></thead><tbody>
              ${[0, 1, 2].map(b => `<tr><td>Box ${b + 1}</td><td>${num(`starCosts.${b}`, d.starCosts[b], 'min="1" step="10"')}</td><td>${sel(`starBoxPack.${b}`, d.starBoxPack[b], TIERS)}</td><td>${num(`starBoxEnergy.${b}`, d.starBoxEnergy[b], 'min="0" step="10"')}</td></tr>`).join('')}
            </tbody></table></div>
          </div></fieldset>
        </div>
      </div>

      <fieldset><legend>Which Orders give a card pack</legend><div class="fields">
        <div class="tablewrap"><table class="mini"><thead><tr><th>Order Energy</th><th>Share of Orders</th><th>Gives a pack</th><th>Starter</th><th>Common</th><th>Uncommon</th><th>Rare</th><th>Epic</th></tr></thead><tbody>
          ${d.orderBands.map((b, i) => `<tr><td>${i === d.orderBands.length - 1 ? b.lo + '+' : b.lo + '–' + b.hi}</td><td>${num(`orderBands.${i}.share`, b.share, 'min="0" max="100" step="0.1"')}%</td><td>${num(`orderBands.${i}.chance`, b.chance, 'min="0" max="100"')}%</td>${b.mix.map((v, t) => `<td>${num(`orderBands.${i}.mix.${t}`, v, 'min="0" max="100"')}%</td>`).join('')}</tr>`).join('')}
        </tbody></table></div>
        <p class="muted" style="font-size:12.5px">"Gives a pack" and the pack mix are KAN-170's Order → Card Pack table. "Share of Orders" is how often each Order size comes up in the prototype; KAN-170 doesn't set it yet.</p>
      </div></fieldset>

      <fieldset><legend>Event Packs / 40 Days</legend><div class="fields">
        <div class="tablewrap"><table class="mini"><thead><tr><th>Starter</th><th>Common</th><th>Uncommon</th><th>Rare</th><th>Epic</th><th>Total</th></tr></thead><tbody>
          <tr>${d.liveOpsPacks.map((v, t) => `<td>${num(`liveOpsPacks.${t}`, v, 'min="0" max="999"')}</td>`).join('')}<td class="sum" data-sum="eventtotal"></td></tr>
        </tbody></table></div>
        <p class="muted" style="font-size:12.5px">Proposed supplemental progression. Current baseline: 80 Event Packs over the 40-day Album.</p>
      </div></fieldset>

      <div class="panel stack" style="gap:10px">
        <div class="sidehead" style="margin:0"><h2>Sets and cards</h2><div class="row"><button class="btn small" data-sa="openall">Open all</button><button class="btn small" data-sa="closeall">Close all</button></div></div>
        <p class="muted" style="font-size:13px">Name each Set and card, and set each card's rarity and whether it's Dazzling. Set order matters: later Sets usually hold the rarer cards.</p>
        <div class="stack" style="gap:8px">${setsHTML}</div>
      </div>

      <div class="panel stack" style="gap:10px">
        <h3>Copy, paste and reset</h3>
        <p class="muted" style="font-size:13px">Copy spec gives you the whole spec as text, to send in a message or keep as a backup. Paste text from someone else and load it to edit it here.</p>
        <div class="row"><button class="btn" data-sa="copy">Copy spec</button><button class="btn" data-sa="defaults">Reset editor to KAN-170 values</button></div>
        <textarea id="sp-paste" spellcheck="false" placeholder="Paste spec text here"></textarea>
        <div class="row"><button class="btn" data-sa="load">Load pasted spec into the editor</button><span class="muted" id="sp-msg2" role="status"></span></div>
      </div>`;
    updateSums();
    if (S.savedBy) nameFor(S.savedBy).then(n => { const el = $('#sp-by'); if (el && n) el.textContent = ' by ' + n; });
  }

  function updateSums() {
    const d = S.draft;
    const set = (k, v, bad) => { const el = document.querySelector(`[data-sum="${k}"]`); if (el) { el.textContent = v; el.classList.toggle('bad', !!bad); } };
    const cnt = [0, 0, 0, 0, 0], dz = [0, 0, 0, 0, 0];
    d.albumDef.sets.forEach((sd, si) => {
      sd.cards.forEach(c => { cnt[(c.r || 1) - 1]++; if (c.dazz) dz[(c.r || 1) - 1]++; });
      set('set' + si, setSummary(sd)); set('sname' + si, sd.name);
    });
    cnt.forEach((n, i) => set('r' + i, n)); set('rall', cnt.reduce((a, b) => a + b, 0));
    dz.forEach((n, i) => set('dz' + i, n)); set('dzall', dz.reduce((a, b) => a + b, 0));
    d.packs.forEach((p, t) => { const s = p.odds.reduce((a, b) => a + b, 0); set('odds' + t, fmt(s, 1) + '%', Math.abs(s - 100) > 0.01); });
    set('eventtotal', d.liveOpsPacks.reduce((a, b) => a + (+b || 0), 0));
    const tag = $('#sp-dirty'); if (tag) { tag.textContent = S.dirty ? 'Unsaved changes' : 'No unsaved changes'; tag.classList.toggle('pity', S.dirty); }
    const sv = document.querySelector('[data-sa="save"]'); if (sv) sv.disabled = !S.dirty || S.readOnly;
    const ds = document.querySelector('[data-sa="discard"]'); if (ds) ds.disabled = !S.dirty;
  }

  function setPath(obj, path, val) {
    const ks = path.split('.'); let o = obj;
    for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = val;
  }

  const host = $('#tab-spec');
  host.addEventListener('change', e => {
    const t = e.target, path = t.dataset.sp; if (!path) return;
    let v;
    if (t.type === 'checkbox') v = t.checked;
    else if (t.type === 'number' || t.dataset.num) { v = parseFloat(t.value); if (!isFinite(v)) v = 0; if (t.min !== '' && v < +t.min) v = +t.min; if (t.max !== '' && v > +t.max) v = +t.max; t.value = v; }
    else v = t.value;
    setPath(S.draft, path, v);
    S.dirty = true; S.msg = '';
    updateSums();
  });
  host.addEventListener('toggle', e => {
    const dt = e.target.closest && e.target.closest('details.spset'); if (!dt) return;
    const si = +dt.dataset.si; if (dt.open) S.open.add(si); else S.open.delete(si);
  }, true);
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-sa]'); if (!b || b.disabled) return;
    const a = b.dataset.sa;
    if (a === 'save') return void save();
    if (a === 'discard') { S.draft = clone(S.active); S.dirty = false; S.msg = 'Changes discarded.'; }
    if (a === 'loadremote') { S.draft = clone(S.remoteNewer.spec); S.dirty = false; S.remoteNewer = null; }
    if (a === 'keepmine') { S.remoteNewer = null; }
    if (a === 'openall') S.draft.albumDef.sets.forEach((_, i) => S.open.add(i));
    if (a === 'closeall') S.open.clear();
    if (a === 'defaults') { S.draft = base(); S.dirty = true; S.msg = 'Editor reset to the KAN-170 values. Save to apply.'; }
    if (a === 'copy') {
      const text = JSON.stringify(S.draft);
      const ta = $('#sp-paste');
      const fallback = () => { ta.value = text; ta.focus(); ta.select(); $('#sp-msg2').textContent = 'Copying is blocked here. The spec text is selected in the box, so copy it from there.'; };
      try { navigator.clipboard.writeText(text).then(() => { $('#sp-msg2').textContent = 'Spec copied.'; }, fallback); } catch (err) { fallback(); }
      return;
    }
    if (a === 'load') {
      try {
        const obj = JSON.parse($('#sp-paste').value);
        if (!obj || typeof obj !== 'object' || !obj.albumDef) throw new Error('no album');
        S.draft = normalize(obj); S.dirty = true; S.msg = 'Pasted spec loaded into the editor. Save to apply it.';
      } catch (err) { $('#sp-msg2').textContent = "That text isn't a complete spec. Paste the full text from Copy spec."; return; }
    }
    render();
  });

  window.SpecTab = { render };
})();


/* ===== Script 3: app (Orders and Album tabs) ===== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (v, d = 0) => (v === null || v === undefined || !isFinite(v)) ? '–' : Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const STARS = r => '★'.repeat(r);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  const CHAINS = [
    { n: 'Cakes', c: '#e8915a', a: 'Ca' }, { n: 'Coffee', c: '#7a4b2a', a: 'Co' }, { n: 'Tea Time', c: '#5e9e4a', a: 'Te' },
    { n: 'Sponsor Swag', c: '#4a86c5', a: 'Sw' }, { n: 'Cat Toys', c: '#2fa59a', a: 'To' }, { n: 'Ice Cream', c: '#e0607f', a: 'Ic' },
    { n: 'Cat Tree', c: '#a07850', a: 'Tr' }
  ];
  const CAST = [['Buttercream', '#e6a23c'], ['Donut', '#c46aa0'], ['Graham', '#8a6a4f'], ['Maple', '#d07a3a'],
    ['Nana', '#9a8fb5'], ['Eclair', '#5b8bd0'], ['Comet', '#4fa38a'], ['Muffin', '#d98aa6']];
  const ACTIVE = 6;
  const I = {
    bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f5b400" d="M13.5 2 4 14h7l-1.5 8L19 10h-7z"/></svg>',
    coin: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#e9b50f"/><circle cx="12" cy="12" r="6" fill="none" stroke="#fff3c4" stroke-width="2"/></svg>',
    cards: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="11" height="15" rx="2.5" fill="currentColor" opacity=".45" transform="rotate(-10 8 12)"/><rect x="9" y="3.5" width="11" height="15" rx="2.5" fill="currentColor"/></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
    cat: '<svg viewBox="0 0 64 56" aria-hidden="true"><use href="#cat"/></svg>'
  };

function cardHTML(c, owned, dup) {
  const setNo = String(c.set + 1).padStart(2, '0');
  const cardNo = String(c.n).padStart(2, '0');

  const imagePath = `./img/cards/s${setNo}_c${cardNo}.png`;

  return `<div
    class="card ${owned ? '' : 'missing'} ${c.dazz ? 'dazz' : ''}"
    data-r="${c.r}"
    data-card-detail="1"
    data-image="${imagePath}"
    data-name="${esc(c.name)}"
    title="${esc(c.name)} · ${c.r}-Star${c.dazz ? ' · Dazzling' : ''}${dup ? ' · ' + dup + ' duplicate' + (dup > 1 ? 's' : '') : ''}"
  >
    ${c.dazz ? '<span class="dz">Dazzling</span>' : ''}
    ${dup ? `<span class="dupb">+${dup}</span>` : ''}

    <div class="card-image">
      <img
        src="${imagePath}"
        alt="${esc(c.name)}"
        loading="lazy"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
      >

      <svg
        class="cat card-fallback"
        style="display:none"
        viewBox="0 0 64 56"
        aria-hidden="true"
      >
        <use href="#cat"/>
      </svg>
    </div>

    <div>
      <div class="stars" aria-label="${c.r} star">${STARS(c.r)}</div>
      <div class="cname">${esc(c.name)}</div>
    </div>
  </div>`;
}

  /* ---------------- state ---------------- */
  let G = null;
  const savedPrefs = store.get('caLab.debug') || {};
  function newGame() {
    const c = window.SpecStore ? window.SpecStore.activeCopy() : CA.defaults();
    const album = CA.buildAlbum(c);
    const rng = CA.mulberry32((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
    const prev = G;
    G = { c, album, rng, st: CA.newState(album), stats: CA.newStats(), day: 0, energy: 0, coins: 0, orders: [], orderSeq: 0,
      ordersDone: 0, orderPacks: 0, eventPacks: 0, jokers: [], jokerSeq: 0,
      live: CA.liveScheduleFor(c, rng), jokerDays: CA.spreadDays(c.jokersPerAlbum, c.durationDays, 0.5),
      ended: false, ov: null, queue: [], albumNo: prev ? prev.albumNo + 1 : 1, log: [],
      board: makeBoard(rng), seen: new Uint8Array(album.N), fresh: new Uint8Array(album.N), pop: new Set(),
      inf: prev ? prev.inf : !!savedPrefs.inf, skip: prev ? prev.skip : !!savedPrefs.skip,
      specStamp: window.SpecStore ? window.SpecStore.stamp() : 'default' };
    log(`Album ${G.albumNo} started: ${album.N} cards in ${album.S} Sets, ${c.durationDays} days${c.notes ? '. Spec notes: ' + c.notes : ''}.`);
    startDay(true);
    while (G.orders.length < ACTIVE) G.orders.push(makeOrder());
  }
  function log(m) { G.log.unshift({ d: G.day, m }); if (G.log.length > 60) G.log.pop(); }
  function makeBoard(rng) {
    const out = [];
    for (let i = 0; i < 63; i++) out.push(rng() < 0.62 ? { ch: Math.floor(rng() * CHAINS.length), t: 1 + Math.floor(rng() * rng() * 6) } : null);
    return out;
  }
  // An Order's Energy is drawn from the size mix, then shown as up to 3 merge items (tier n costs 2^(n-1) Energy).
  function makeOrder() {
    const o = CA.drawOrder(G.c, G.rng);
    let e = o.energy; const tiers = [];
    for (let t = 11; t >= 1 && tiers.length < 3; t--) { const v = 2 ** (t - 1); if (e >= v) { tiers.push(t); e -= v; } }
    const energy = tiers.reduce((a, t) => a + 2 ** (t - 1), 0);
    // The KAN-170 Order → Card Pack roll happens when the Order appears, so the card can show its reward up front.
    const r = CA.orderReward(G.c, { energy }, G.rng);
    return { id: ++G.orderSeq, energy, items: tiers.map(t => ({ ch: Math.floor(G.rng() * CHAINS.length), t })),
      cust: CAST[Math.floor(G.rng() * CAST.length)], coins: Math.round(energy * 0.4) + 5, chance: r.chance, tier: r.tier, fresh: true };
  }

  function startDay(first) {
    if (G.ended) return false;
    const c = G.c, D = c.durationDays, d = G.day;
    if (d >= D) { endAlbum(); return false; }
    const exp = G.jokers.filter(j => j.exp <= d);
    if (exp.length) { G.jokers = G.jokers.filter(j => j.exp > d); log('An unused Joker expired.'); }
    const daily = c.profiles[2].energy;
    G.energy += daily; G.day = d + 1;
    if (!first) toast(`Day ${G.day} · +${fmt(daily)} Energy`);
    log(`Day ${G.day} began.`);
    const todayEvents = G.live.filter(x => x.day === d);
    for (const it of todayEvents) {
      G.eventPacks++;
      G.stats.src.live++;
      givePack({ tier: it.tier, kind: 'standard' }, 'Event reward');
      log(`Event reward → ${CA.PACK_NAMES[it.tier - 1]} pack.`);
    }
    G.jokerDays.forEach(x => { if (x === d) { G.jokers.push({ id: ++G.jokerSeq, exp: d + c.jokerDays }); toast('You got a Joker! Use it on the Album tab'); log('Joker received (use it on the Album tab before the day ends).'); } });
    return true;
  }
  function endAlbum() {
    const st = G.st;
    if (st.finalPending) { CA.claimFinal(st, G.c, G.stats); takeEnergy(); }
    const dups = st.dup.reduce((a, b) => a + b, 0);
    G.summary = { cards: st.cycle ? G.album.N : st.unique, sets: st.cycle ? G.album.S : st.setsDone, orders: G.ordersDone, orderPacks: G.orderPacks, eventPacks: G.eventPacks, totalPacks: G.orderPacks + G.eventPacks, dups };
    st.dup.fill(0); st.credit = 0; G.jokers = [];
    G.ended = true; G.queue = []; G.ov = { type: 'end' };
    log(`Album ended. ${dups} stored duplicates removed.`);
  }
  function takeEnergy() {
    const g = G.st.energyGain;
    if (g) { if (G.c.reinvestEnergy) G.energy += g; G.st.energyGain = 0; }
  }

  /* ---------------- packs ---------------- */
  function givePack(p, why) {
    if (G.skip) {
      const { res, ev } = openNow(p);
      const nw = res.filter(r => r.isNew).length;
      toast(`${why}: ${CA.packLabel(p)} pack · ${res.length} cards, ${nw} new`, p.tier);
      handleEvents(ev);
    } else {
      const ov = { type: 'pack', p, why };
      if (G.ov) G.queue.push(ov); else G.ov = ov;
    }
  }
  function openNow(p) {
    const ev = [];
    const res = CA.openPack(G.album, G.st, G.c, p, G.rng, ev, G.stats);
    res.forEach(r => { if (r.isNew) { G.fresh[r.idx] = 1; G.pop.add(r.idx); } });
    takeEnergy();
    log(`${CA.packLabel(p)} pack: ${res.length} cards, ${res.filter(r => r.isNew).length} new.`);
    return { res, ev };
  }
  function handleEvents(ev) {
    for (const e of ev) {
      if (e.type === 'dazzling') { const cd = G.album.cards[e.idx]; toast(`Dazzling card! +${e.energy} Energy`, 5); log(`Dazzling card ${cd.name}: +${e.energy} Energy.`); }
      if (e.type === 'set') { log(`Set complete: ${G.album.sets[e.set].name} (+${e.energy} Energy).`); G.queue.push({ type: 'celebrate', set: e.set, energy: e.energy }); }
      if (e.type === 'album') { log('Album complete!'); G.queue.push({ type: 'albumdone' }); }
    }
    if (!G.ov && G.queue.length) G.ov = G.queue.shift();
  }

  /* ---------------- actions ---------------- */
  function completeOrder(id, quick) {
    if (G.ended) return false;
    const i = G.orders.findIndex(o => o.id === id);
    if (i < 0) return false;
    const o = G.orders[i];
    if (!G.inf && o.energy > G.energy) return false;
    if (!G.inf) G.energy -= o.energy;
    G.coins += o.coins; G.ordersDone++;
    G.orders[i] = makeOrder();
    log(`Order #${G.ordersDone} (${o.energy} Energy) → ${o.tier ? CA.PACK_NAMES[o.tier - 1] + ' pack' : 'no card pack'}.`);
    if (o.tier) { G.orderPacks++; G.stats.src.orders++; givePack({ tier: o.tier, kind: 'standard' }, 'Order reward'); }
    if (!quick) {
      const el = document.querySelector(`.ocard[data-id="${id}"]`);
      if (el) { el.classList.add('done'); setTimeout(render, 240); return true; }
    }
    render();
    return true;
  }
  function closeOv() { G.ov = G.queue.length ? G.queue.shift() : null; render(); }

  /* ---------------- render: Orders tab ---------------- */
  function toast(msg, tier) {
    const box = $('#g-toasts'); if (!box) return;
    if (box.lastChild && box.lastChild.textContent === msg) return;
    while (box.children.length > 2) box.firstChild.remove();
    const t = document.createElement('div'); t.className = 'toast';
    if (tier) { const p = document.createElement('span'); p.className = 'minipack'; p.style.background = `var(--r${tier})`; t.appendChild(p); }
    const s = document.createElement('span'); s.textContent = msg; t.appendChild(s);
    box.appendChild(t); setTimeout(() => t.remove(), 2600);
  }
  const itemHTML = it => `<div class="item" style="background:${CHAINS[it.ch].c}" title="${esc(CHAINS[it.ch].n)} tier ${it.t}"><b>${CHAINS[it.ch].a}</b><i>T${it.t}</i></div>`;

  function renderPhone() {
    const st = G.st, D = G.c.durationDays;
    const uniq = st.cycle ? G.album.N : st.unique;
    $('#g-hud').innerHTML = `
      <div class="daychip"><span>Day ${G.day}</span><small>${Math.max(0, D - G.day)} days left</small></div>
      <span class="pill" title="Energy">${I.bolt}${G.inf ? '∞' : fmt(G.energy)}</span>
      <button class="hudbtn buy" data-g="buy" ${G.ended ? 'disabled' : ''} title="Buy 100 Energy">+100</button>
      <button class="hudbtn inf ${G.inf ? 'on' : ''}" data-g="toggleinf" aria-pressed="${G.inf}" title="Infinite Energy (debug)">∞</button>
      <span class="grow"></span>
      <span class="pill" title="Cards collected" style="color:var(--accent)">${I.cards}<span style="color:var(--g-ink)">${uniq}<small>/${G.album.N}</small></span></span>`;
    $('#g-rail').innerHTML = G.orders.map(o => {
      const odds = o.tier ? `<div class="opack" title="${esc(CA.PACK_NAMES[o.tier - 1])} pack: ${CA.packCardCount(G.c, { tier: o.tier, kind: 'standard' })} cards"><span class="minipack" style="background:var(--r${o.tier})"></span><span>Card pack</span><span class="ostars" style="color:var(--r${o.tier})">${'★'.repeat(o.tier)}</span></div>` : '';
      const can = !G.ended && (G.inf || o.energy <= G.energy);
      return `<div class="ocard ${o.fresh ? 'fresh' : ''}" data-id="${o.id}">
        <div class="ocust"><span class="avatar" style="background:${o.cust[1]}">${I.cat}</span><span>${esc(o.cust[0])}</span></div>
        <div class="oitems">${o.items.map(itemHTML).join('')}</div>
        <div class="oreward"><span class="coins">${I.coin}${fmt(o.coins)}</span></div>${odds}
        <button class="ocomplete" data-g="complete" data-id="${o.id}" ${can ? '' : 'disabled'}>${can ? 'Complete' : 'Need Energy'}</button>
        <div class="ocost">${fmt(o.energy)} Energy to make</div></div>`;
    }).join('');
    G.orders.forEach(o => { o.fresh = false; });
    // Live mini album in place of a merge board: every Set's 9 slots light up as cards arrive.
    $('#g-board').innerHTML = `<div class="mhead"><b>${esc(G.album.name || 'Card Album')}</b><span>${uniq}/${G.album.N} cards · ${st.setsDone}/${G.album.S} Sets</span></div>` +
      G.album.sets.map(s => `<button class="mset ${st.setDone[s.i] ? 'done' : ''}" data-g="openset" data-s="${s.i}" aria-label="${esc(s.name)}: ${st.setProg[s.i]} of ${s.size} cards">
        <span class="mn">${s.i + 1}. ${esc(s.name)}</span>
        <span class="mgrid">${s.cards.map(i => { const cd = G.album.cards[i]; const on = st.cycle ? true : !!st.owned[i]; return `<i class="${on ? 'on' : ''}${cd.dazz ? ' dz' : ''}${G.pop.has(i) ? ' pop' : ''}" data-r="${cd.r}" title="${esc(cd.name)} · ${cd.r}★"></i>`; }).join('')}</span>
        <span class="mc">${st.setProg[s.i]}/${s.size}${st.setDone[s.i] ? ' · Done' : ''}</span></button>`).join('');
    G.pop.clear();
    updateArrows();
    const newN = countNew();
    $('#g-nav').innerHTML = `
      <button class="navbtn" data-g="toalbum">${I.cards}<span class="lbl">Album<small>${uniq}/${G.album.N} · ${st.setsDone}/${G.album.S} Sets</small></span>${newN ? `<span class="badge">${newN > 99 ? '99+' : newN}</span>` : ''}</button>
      <button class="navbtn" data-g="sleep" ${G.ended ? 'disabled' : ''}>${I.moon}<span class="lbl">Next day<small>${G.day >= D ? 'ends the album' : '+' + fmt(G.c.profiles[2].energy) + ' Energy'}</small></span></button>`;
    renderOv();
  }
  function updateArrows() {
    const r = $('#g-rail'), a = $('#rail-prev'), b = $('#rail-next'); if (!r || !a) return;
    a.disabled = r.scrollLeft <= 2; b.disabled = r.scrollLeft + r.clientWidth >= r.scrollWidth - 2;
  }
  function countNew() { let n = 0; for (let i = 0; i < G.album.N; i++) if (G.fresh[i]) n++; return n; }

  function renderOv() {
    const ov = G.ov, box = $('#g-ov'), album = G.album, st = G.st;
    if (!ov) { box.innerHTML = ''; return; }
    let h = '';
    if (ov.type === 'pack' && !ov.res) {
      h = `<div class="ov dim"><p class="eyebrow" style="color:#fff;opacity:.8">${esc(ov.why)}</p>
        <button class="bigpack" data-t="${ov.p.tier}" data-g="rip" aria-label="Open ${esc(CA.packLabel(ov.p))} pack">${I.cat}<b>${esc(CA.packLabel(ov.p))}</b><span>${STARS(ov.p.tier)}</span></button>
        <p style="opacity:.8;font-size:13.5px">Tap the pack to open it · ${CA.packCardCount(G.c, ov.p)} cards</p></div>`;
    } else if (ov.type === 'pack') {
      const nw = ov.res.filter(r => r.isNew).length;
      h = `<div class="ov dim"><p style="font-weight:800">${esc(CA.packLabel(ov.p))} pack · ${nw} new</p>
        <div class="revealgrid">${ov.res.map((r, k) => { const c = album.cards[r.idx]; return `<div class="cardwrap">${cardHTML(c, true, 0).replace('class="card', `style="animation-delay:${k * 120}ms" class="card`)}<div class="row" style="gap:4px;justify-content:center">${r.isNew ? '<span class="tag new">New</span>' : `<span class="tag">Duplicate +${c.r}★</span>`}${r.pity ? '<span class="tag pity">Pity</span>' : ''}</div></div>`; }).join('')}</div>
        <button class="gbtn" data-g="collect">Collect</button></div>`;
    } else if (ov.type === 'celebrate') {
      const s = album.sets[ov.set];
      h = `<div class="ov dim celebrate"><p class="eyebrow" style="color:#fff;opacity:.8">Set complete</p><div class="big">${esc(s.name)}</div>
        <div class="minicards">${s.cards.map(i => cardHTML(album.cards[i], true, 0)).join('')}</div>
        <p style="font-size:18px;font-weight:800">+${fmt(ov.energy)} Energy</p><button class="gbtn" data-g="close">Collect</button></div>`;
    } else if (ov.type === 'albumdone') {
      h = `<div class="ov dim celebrate"><div class="big">Album complete!</div>
        <p>${st.cycle ? '300 Gems + 1,000 Energy + 2 Rainbow Gems + 2 Fancy Choice Boxes' : '250 Gems + 800 Energy + Rainbow Gem + Avatar'}</p>
        <p style="opacity:.75;font-size:13px">Claim it on the Album tab (manual claim).</p><button class="gbtn" data-g="close">Continue</button></div>`;
    } else if (ov.type === 'end') {
      const s = G.summary;
      h = `<div class="ov dim celebrate"><p class="eyebrow" style="color:#fff;opacity:.8">Day ${G.c.durationDays} is over</p><div class="big">Album ended</div>
        <div class="summary"><div><b>${s.sets}/${G.album.S}</b><span>Sets finished</span></div><div><b>${s.cards}/${G.album.N}</b><span>Cards collected</span></div>
        <div><b>${fmt(s.orders)}</b><span>Orders completed</span></div><div><b>${fmt(s.orderPacks)}</b><span>Packs from Orders</span></div>
        <div><b>${fmt(s.eventPacks)}</b><span>Packs from Events</span></div><div><b>${fmt(s.totalPacks)}</b><span>Total Packs</span></div></div>
        <button class="gbtn" data-g="reset">Start a new album</button></div>`;
    }
    box.innerHTML = h;
  }

  const outdated = () => window.SpecStore && window.SpecStore.stamp() !== G.specStamp;
  const outdatedBanner = () => outdated() ? `<div class="banner accent"><p><b>A newer spec was saved.</b> This album still uses the earlier one. Reset to play the new version.</p><button class="btn small primary" data-g="reset">Reset album</button></div>` : '';
  function renderDebug() {
    const rate = G.ordersDone ? G.orderPacks / G.ordersDone * 100 : 0;
    $('#g-side').innerHTML = `${outdatedBanner()}
      <div class="panel debug">
        <h2>Debug</h2>
        <label class="switch" for="dbg-inf"><span>Infinite Energy<small>Every Order can be completed. Days only change when you tap Next day.</small></span><input type="checkbox" id="dbg-inf" data-dbg="inf" ${G.inf ? 'checked' : ''}></label>
        <label class="switch" for="dbg-skip"><span>Skip pack opening<small>Packs open instantly with a short message instead of the tap-to-open screen.</small></span><input type="checkbox" id="dbg-skip" data-dbg="skip" ${G.skip ? 'checked' : ''}></label>
        <div class="row">
          <button class="btn" data-g="ten" ${G.ended ? 'disabled' : ''}>Complete 10 Orders</button>
          <button class="btn" data-g="sleep" ${G.ended ? 'disabled' : ''}>Next day</button>
          <button class="btn danger" data-g="reset" id="dbg-reset">Reset album</button>
        </div>
      </div>
      <div class="panel stack" style="gap:8px">
        <p class="muted" style="font-size:13px">Energy bought this album (the +100 button): <b class="num">${fmt(G.bought || 0)}</b></p>
        <div class="sidehead" style="margin:0"><h3>Orders so far</h3><span class="muted num">${fmt(G.ordersDone)} Orders · ${fmt(G.orderPacks)} gave a pack${G.ordersDone ? ` (${fmt(rate)}%)` : ''}</span></div>
        <p class="muted" style="font-size:12.5px">Card packs come from Orders plus the configured Event reward schedule. Order packs use KAN-170's Order → Card Pack table, while Event Packs are distributed across the 40-day Album.</p>
        <p class="eyebrow" style="margin-top:4px">Event Packs</p>
        <p class="muted" style="font-size:12.5px">${fmt(G.eventPacks)} received so far · ${fmt(G.c.liveOpsPacks.reduce((a,b)=>a+b,0))} configured total (${G.c.liveOpsPacks.join(' / ')} by tier)</p>
        <p class="eyebrow" style="margin-top:4px">Order Pack Chance</p>
        <table class="oddsmini"><tbody>
          ${G.c.orderBands.map((b, i) => `<tr><td>${i === G.c.orderBands.length - 1 ? b.lo + '+' : b.lo + '–' + b.hi} Energy</td><td>${b.chance ? b.chance + '% of these Orders' : 'never'}</td></tr>`).join('')}
        </tbody></table>
        <p class="eyebrow" style="margin-top:4px">Cards per pack (GH observed)</p>
        <table class="oddsmini"><tbody>
          ${CA.PACK_NAMES.map((n, t) => `<tr><td><span class="minipack" style="display:inline-block;vertical-align:-2px;margin-right:6px;background:var(--r${t + 1})"></span>${n} pack ${'★'.repeat(t + 1)}</td><td>${G.c.packs[t].cards} cards · at least one ${t + 1}★</td></tr>`).join('')}
        </tbody></table>
      </div>
      <div class="panel"><div class="sidehead"><h3>What just happened</h3></div><div class="log">${G.log.slice(0, 14).map(l => `<div><span>D${l.d}</span><span>${esc(l.m)}</span></div>`).join('')}</div></div>`;
  }

  /* ---------------- render: Album tab ---------------- */
  function renderAlbum() {
    const st = G.st, album = G.album, c = G.c;
    const uniq = st.cycle ? album.N : st.unique;
    const stars = CA.starBalance(album, st), dupN = st.dup.reduce((a, b) => a + b, 0);
    const jk = G.jokers.length > 0 && !G.ended;
    let banners = outdatedBanner();
    if (G.ended) banners += `<div class="banner accent"><p><b>This album has ended.</b> Progress is locked and duplicates were cleared.</p><button class="btn small primary" data-g="reset">Start a new album</button></div>`;
    if (st.albumComplete) banners += `<div class="banner good"><p><b>${st.cycle ? 'Prestige Album complete.' : 'Album complete.'}</b> ${st.finalPending ? 'The reward is waiting for a manual claim.' : 'Reward claimed.'}</p><div class="row">${st.finalPending ? '<button class="btn small primary" data-g="claim">Claim reward</button>' : ''}${!st.finalPending && c.prestigeOn ? '<button class="btn small" data-g="prestige">Start Prestige</button>' : ''}</div></div>`;
    if (jk) banners += `<div class="banner warn"><p><b>You have ${G.jokers.length > 1 ? G.jokers.length + ' Jokers' : 'a Joker'}.</b> Tap any missing card below (outlined) to collect it. Jokers expire at the end of the day.</p></div>`;

    const boxes = [0, 1, 2].map(b => {
      const plan = CA.planRedeem(album, st, c, b);
      const reward = (c.starBoxEnergy[b] ? c.starBoxEnergy[b] + ' Energy' : 'Order Case') + ' + ' + CA.packLabel({ tier: c.starBoxPack[b], kind: 'standard' }) + ' pack';
      return `<div class="box"><div><b>Star Box ${b + 1}</b><div class="muted" style="font-size:13px">${esc(reward)}</div></div><div class="row" style="gap:6px"><span class="cost">${fmt(c.starCosts[b])}★</span><button class="btn small" data-g="redeem" data-b="${b}" ${plan.ok && !G.ended ? '' : 'disabled'}>Redeem</button></div><div class="prev">${plan.ok ? `Uses ${plan.cardsUsed} duplicate${plan.cardsUsed > 1 ? 's' : ''}${plan.over ? ` · ${plan.over}★ over is lost` : ''}` : `Needs ${fmt(c.starCosts[b] - stars)} more Stars`}</div></div>`;
    }).join('');

    const sets = album.sets.map(s => {
      const p = st.setProg[s.i], done = !!st.setDone[s.i];
      const cards = s.cards.map(i => {
        const cd = album.cards[i], owned = !!st.owned[i];
        const tag = G.fresh[i] && owned ? '<span class="tag new">New</span>' : '';
        if (!owned && jk && cd.r <= c.jokerMaxRarity) return `<button class="cslot" data-g="usejoker" data-i="${i}" aria-label="Use Joker on ${esc(cd.name)}">${cardHTML(cd, false, 0)}</button>`;
        return `<div class="cslot">${cardHTML(cd, owned, st.dup[i])}${tag}</div>`;
      }).join('');
      return `<section class="setpanel ${done ? 'done' : ''}" id="set-${s.i}"><div class="sethead"><h3>${s.i + 1}. ${esc(s.name)}</h3>
        <span class="num" style="font-weight:800">${p}/${s.size}</span><span class="bar"><i style="width:${p / s.size * 100}%;${done ? 'background:var(--good)' : ''}"></i></span>
        <span class="muted">${done ? 'Complete · ' : 'Reward: '}${fmt(s.reward)} Energy</span></div><div class="cards9">${cards}</div></section>`;
    }).join('');

    $('#tab-album').innerHTML = `
      ${banners}
      <h2>${esc(album.name || 'Card Album')}</h2>
      <div class="asum">
        <div><b>${uniq}<span class="muted" style="font-size:15px"> / ${album.N}</span></b><span>Cards collected</span></div>
        <div><b>${st.setsDone}<span class="muted" style="font-size:15px"> / ${album.S}</span></b><span>Sets finished</span></div>
        <div><b>${Math.max(0, c.durationDays - G.day)}</b><span>Days left (day ${G.day} of ${c.durationDays})</span></div>
        <div><b>${fmt(stars)}★</b><span>Stars from ${dupN} duplicate${dupN === 1 ? '' : 's'}</span></div>
        <div><b style="font-size:18px">${st.cycle ? 'Prestige ' + st.cycle : 'Regular'}</b><span>Album ${G.albumNo}</span></div>
      </div>
      <div class="panel stack" style="gap:10px"><div class="sidehead" style="margin:0"><h2>Star Store</h2><span class="muted">Duplicates are worth their card's stars</span></div><div class="astore">${boxes}</div></div>
      ${sets}`;
    // Mark everything shown as seen once the Album has been viewed.
    G.fresh.fill(0);
  }

  /* ---------------- top-level ---------------- */
  function render() {
    renderPhone(); renderDebug();
    const n = countNew(); $('#newcount').textContent = n ? (n > 99 ? '99+' : n) : '';
    if (!$('#tab-album').hidden) renderAlbum();
  }
  const TABS = ['orders', 'album', 'spec'];
  function showTab(name) {
    if (!TABS.includes(name)) name = 'orders';
    TABS.forEach(t => { $('#tab-' + t).hidden = t !== name; $('#t-' + t).setAttribute('aria-selected', t === name); });
    store.set('caLab.tab2', name);
    if (name === 'album') { renderAlbum(); $('#newcount').textContent = ''; window.scrollTo(0, 0); }
    else if (name === 'spec') { if (window.SpecTab) window.SpecTab.render(); }
    else render();
  }
  document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });

  document.addEventListener('scroll', e => { if (e.target && e.target.id === 'g-rail') updateArrows(); }, true);
  $('#tab-orders').innerHTML = `<div class="gamewrap"><div><div class="phone" id="phone">
      <div class="hud" id="g-hud"></div>
      <div class="railwrap"><button class="railarrow" data-g="railprev" id="rail-prev" aria-label="Previous Orders">‹</button><div class="rail" id="g-rail" aria-label="Orders"></div><button class="railarrow" data-g="railnext" id="rail-next" aria-label="Next Orders">›</button></div>
      <div class="malbum" id="g-board" aria-label="Card album progress"></div>
      <div class="nav" id="g-nav"></div>
      <div class="toasts" id="g-toasts" aria-live="polite"></div>
      <div id="g-ov"></div>
    </div></div><div class="gside" id="g-side"></div></div>`;

  let resetArmed = null;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b || b.disabled) return;
    const a = b.dataset.g;
    if (a === 'complete') return void completeOrder(+b.dataset.id);
    if (a === 'ten') {
      for (let k = 0; k < 10 && !G.ended; k++) {
        let can = G.orders.find(o => G.inf || o.energy <= G.energy);
        if (!can) { if (!startDay(false)) break; continue; }
        completeOrder(can.id, true);
      }
      return render();
    }
    if (a === 'sleep') { if (G.day >= G.c.durationDays) endAlbum(); else startDay(false); return render(); }
    if (a === 'toalbum') return showTab('album');
    if (a === 'railprev' || a === 'railnext') {
      const r = $('#g-rail'), card = r.querySelector('.ocard');
      const step = card ? card.getBoundingClientRect().width + 8 : 160;
      r.scrollBy({ left: a === 'railnext' ? step : -step, behavior: 'smooth' });
      return;
    }
    if (a === 'openset') { const si = +b.dataset.s; showTab('album'); const el = document.getElementById('set-' + si); if (el) el.scrollIntoView({ block: 'start' }); return; }
    if (a === 'buy') { G.energy += 100; G.bought = (G.bought || 0) + 100; toast('Bought 100 Energy'); log(`Bought 100 Energy (${G.bought} bought this album).`); return render(); }
    if (a === 'toggleinf') { G.inf = !G.inf; store.set('caLab.debug', { inf: G.inf, skip: G.skip }); toast(G.inf ? 'Infinite Energy on' : 'Infinite Energy off'); return render(); }
    if (a === 'close') return closeOv();
    if (a === 'rip') { const r = openNow(G.ov.p); G.ov.res = r.res; G.ov.ev = r.ev; return render(); }
    if (a === 'collect') { const ev = G.ov.ev || []; G.ov = G.queue.length ? G.queue.shift() : null; handleEvents(ev); return render(); }
    if (a === 'reset') {
      if (b.id === 'dbg-reset' && !b.classList.contains('armed')) {
        b.classList.add('armed'); b.textContent = 'Tap again to reset';
        clearTimeout(resetArmed); resetArmed = setTimeout(() => { b.classList.remove('armed'); b.textContent = 'Reset album'; }, 3000);
        return;
      }
      newGame(); render(); if (!$('#tab-album').hidden) renderAlbum(); toast('Album reset'); return;
    }
    if (a === 'usejoker') {
      const i = +b.dataset.i, ev = [];
      if (!G.jokers.length || G.st.owned[i]) return;
      CA.acquire(G.album, G.st, G.c, i, ev, G.stats); takeEnergy(); G.fresh[i] = 1;
      G.jokers.shift(); log(`Joker used on ${G.album.cards[i].name}.`);
      handleEvents(ev); renderAlbum(); G.fresh[i] = 0; return render();
    }
    if (a === 'redeem') {
      const bx = +b.dataset.b, plan = CA.planRedeem(G.album, G.st, G.c, bx);
      if (!plan.ok) return;
      const pack = CA.applyRedeem(G.album, G.st, G.c, bx, plan, G.stats); takeEnergy();
      log(`Star Box ${bx + 1} redeemed with ${plan.cardsUsed} duplicates.`);
      givePack(pack, `Star Box ${bx + 1}`);
      showTab('orders'); return;
    }
    if (a === 'claim') { const e2 = CA.claimFinal(G.st, G.c, G.stats); takeEnergy(); log(`Album reward claimed (+${e2} Energy).`); return void renderAlbum(); }
    if (a === 'prestige') { CA.startPrestige(G.album, G.st, G.c, G.stats); G.fresh.fill(0); log(`Prestige ${G.st.cycle} started: collect all ${G.album.N} again.`); return void renderAlbum(); }
  });
  document.addEventListener('change', e => {
    const k = e.target.dataset.dbg; if (!k) return;
    G[k] = e.target.checked;
    store.set('caLab.debug', { inf: G.inf, skip: G.skip });
    render();
  });

  window.AlbumApp = {
  specChanged() {
    // A fresh album (nothing played yet) picks up the new spec straight away.
    if (G && G.ordersDone === 0 && !G.ended && G.specStamp !== window.SpecStore.stamp()) newGame();
    if (!$('#tab-orders').hidden) render();
    else if (!$('#tab-album').hidden) renderAlbum();
  }
};

function openCardDetail(cardElement) {
  const popup = document.getElementById('card-detail-popup');
  const image = document.getElementById('card-detail-image');
  const name = document.getElementById('card-detail-name');

  if (!popup || !image || !name) return;

  const imagePath = cardElement.dataset.image;
  const cardName = cardElement.dataset.name || '';

  if (!imagePath) return;

  image.src = imagePath;
  image.alt = cardName;
  name.textContent = cardName;

  popup.hidden = false;
}

function closeCardDetail() {
  const popup = document.getElementById('card-detail-popup');
  const image = document.getElementById('card-detail-image');

  if (!popup) return;

  popup.hidden = true;

  if (image) {
    image.src = '';
  }
}

document.addEventListener('click', e => {
  const popup = document.getElementById('card-detail-popup');

  if (!popup) return;

  if (!popup.hidden) {
    closeCardDetail();
    return;
  }

  const albumTab = document.getElementById('tab-album');

  if (!albumTab || albumTab.hidden) return;

  const card = e.target.closest('[data-card-detail]');

  if (!card) return;

  openCardDetail(card);
});

newGame();
showTab(store.get('caLab.tab2') || 'orders');
})();
