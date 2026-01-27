// src/data/items.js

export const ITEM_POOL = [
  { icon: "🍎", name: "りんご", rarity: "N", effect: { type: "exp", value: 10 } },
  { icon: "🍖", name: "にく", rarity: "N", effect: { type: "exp", value: 20 } },
  { icon: "💎", name: "宝石", rarity: "R", effect: { type: "exp", value: 100 } },
  { icon: "🎁", name: "ギフト", rarity: "R", effect: { type: "point", value: 1 } }, // 未振りポイント+1
  { icon: "⚔️", name: "刃", rarity: "SR", effect: { type: "atk_buff", value: 10 } }, // 次の攻撃+2（1回で消費）
];

const WEIGHT = { N: 70, R: 25, SR: 5 };

export function rollItem() {
  const r = Math.random() * 100;

  let rarity = "N";
  if (r >= WEIGHT.N && r < WEIGHT.N + WEIGHT.R) rarity = "R";
  if (r >= WEIGHT.N + WEIGHT.R) rarity = "SR";

  const list = ITEM_POOL.filter((x) => x.rarity === rarity);
  const picked = list[Math.floor(Math.random() * list.length)];

  // 念のためコピーして返す（参照共有バグ防止）
  return { ...picked };
}