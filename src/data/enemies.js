// src/data/enemies.js
export const DEFAULT_ENEMY_SETS = {
  Clear: [
    { name: "ファイヤースライム", baseHp: 10, exp: 5, kill: 0, unlockKill: 10, unlock: 0 },
    { name: "ヒートバット", baseHp: 50, exp: 20, kill: 0, unlockKill: 5, unlock: 0 },
    { name: "フレアタイタン", baseHp: 100, exp: 100, kill: 0, unlockKill: 10, unlock: 0 },
    // ★最後はボス（unlock は常に1扱いにしておくと安全）
    { name: "インフェルノ", baseHp: 1500, exp: 1000, kill: 0, unlock: 1 },
  ],

  Rain: [
    { name: "ウォータースライム", baseHp: 15, exp: 7, kill: 0, unlockKill: 10, unlock: 0 },
    { name: "アクアウルフ", baseHp: 60, exp: 30, kill: 0, unlockKill: 5, unlock: 0 },
    { name: "ウォーターゴーレム", baseHp: 220, exp: 180, kill: 0, unlockKill: 10, unlock: 0 },
    { name: "ポセイドン", baseHp: 1700, exp: 1000, kill: 0, unlock: 1 },
  ],

  Clouds: [
    { name: "クラウドバット", baseHp: 10, exp: 5, kill: 0, unlockKill: 10, unlock: 0 },
    { name: "フォッグウルフ", baseHp: 80, exp: 30, kill: 0, unlockKill: 5, unlock: 0 },
    { name: "ミストゴーレム", baseHp: 150, exp: 150, kill: 0, unlockKill: 10, unlock: 0 },
    { name: "ファントム", baseHp: 2000, exp: 2000, kill: 0, unlock: 1 },
  ],

  Thunderstorm: [
    { name: "サンダーインプ", baseHp: 15, exp: 5, kill: 0, unlockKill: 10, unlock: 0 },
    { name: "ライトニングウルフ", baseHp: 75, exp: 25, kill: 0, unlockKill: 10, unlock: 0 },
    { name: "トールゴーレム", baseHp: 200, exp: 200, kill: 0, unlockKill: 10, unlock: 0 },
    { name: "ゼウス", baseHp: 3000, exp: 2000, kill: 0, unlock: 1 },
  ],
};