// src/App.jsx
import { useState, useEffect } from "react";
import StatsPanel from "./components/StatsPanel";
import EnemyDisplay from "./components/EnemyDisplay";
import ItemPanel from "./components/ItemPanel";
import { rollItem } from "./data/items";

export default function App() {
  /* ======================================
      ■ プレイヤーステータス
  ====================================== */
  const [stats, setStats] = useState({ str: 0, crt: 0, hp: 0 });
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [points, setPoints] = useState(0);

  const [resetCount, setResetCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [loadCount, setLoadCount] = useState(0);

  /* ======================================
      ■ アイテム
  ====================================== */
  const MAX_ITEMS = 20;
  const [items, setItems] = useState([]);
  const [atkBuff, setAtkBuff] = useState(0);
  const [groundItem, setGroundItem] = useState(null);

  const expToNext = level * 10;

  /* ======================================
      ■ 天気の状態
  ====================================== */
  const [weather, setWeather] = useState("Clear");

  /* ======================================
      ■ ★追加：全体背景用（ボス戦中フラグ）
  ====================================== */
  const [isBossBg, setIsBossBg] = useState(false);

  /* ======================================
      ■ 天気取得
  ====================================== */
  const fetchWeather = async () => {
    try {
      const res = await fetch("/.netlify/functions/weather");
      if (!res.ok) {
        console.error("天気APIエラー: status", res.status);
        return;
      }
      const data = await res.json();
      if (data?.weather?.length > 0) setWeather(data.weather[0].main);
    } catch (err) {
      console.error("天気APIエラー:", err);
    }
  };

  /* ======================================
      ■ セーブ読み込み（自動用）
  ====================================== */
  const loadGameSilent = () => {
    const raw = localStorage.getItem("weatherRPGsave");
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);

      setStats(data.stats ?? { str: 0, crt: 0, hp: 0 });
      setLevel(data.level ?? 1);
      setExp(data.exp ?? 0);
      setPoints(data.points ?? 0);

      setItems(data.items ?? []);
      setAtkBuff(data.atkBuff ?? 0);
      setGroundItem(data.groundItem ?? null);

      return true;
    } catch (e) {
      console.error("save load error:", e);
      return false;
    }
  };

  /* ======================================
      ■ マウント時：自動ロード + 天気取得
  ====================================== */
  useEffect(() => {
    const loadedPlayer = loadGameSilent();
    const hasEnemySave = !!localStorage.getItem("weatherRPG_enemySave");

    if (loadedPlayer || hasEnemySave) {
      setLoadCount((c) => c + 1);
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ======================================
      ■ 経験値追加
  ====================================== */
  const gainExp = (amount = 20) => {
    setExp((prevExp) => {
      let newExp = prevExp + amount;

      setLevel((prevLevel) => {
        let lv = prevLevel;

        setPoints((prevPoints) => {
          let pt = prevPoints;

          while (newExp >= lv * 10) {
            newExp -= lv * 10;
            lv += 1;
            pt += 1;
          }
          return pt;
        });

        return lv;
      });

      return newExp;
    });
  };

  /* ======================================
      ■ ステータス振り
  ====================================== */
  const upgradeStat = (key) => {
    if (points <= 0) return;
    setStats((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    setPoints((prev) => prev - 1);
  };

  /* ======================================
      ■ アイテム：使用
  ====================================== */
  const useItem = (idx) => {
    setItems((prev) => {
      const copy = [...prev];
      const it = copy[idx];
      if (!it) return prev;

      const ef = it.effect;
      if (ef.type === "exp") gainExp(ef.value);
      if (ef.type === "point") setPoints((p) => p + ef.value);
      if (ef.type === "atk_buff") setAtkBuff((b) => b + ef.value);

      copy.splice(idx, 1);
      return copy;
    });
  };

  /* ======================================
      ■ アイテム：ドロップ
  ====================================== */
  const onEnemyDefeated = ({ isBoss } = {}) => {
    if (groundItem) return;

    const rate = isBoss ? 0.8 : 0.3;
    if (Math.random() > rate) return;

    setGroundItem(rollItem());
  };

  /* ======================================
      ■ 攻撃処理
  ====================================== */
  const attackEnemy = (mult = 1) => {
    const buff = atkBuff;
    if (buff > 0) setAtkBuff(0);

    const baseDamage = 1 + stats.str + buff;
    const isCritical = Math.random() < (stats.crt + 1) / 100;

    const raw = isCritical ? baseDamage * 2 : baseDamage;
    const damage = Math.floor(raw * mult);

    return { damage, isCritical };
  };

  /* ======================================
      ■ セーブ/ロード/リセット
  ====================================== */
  const saveGame = () => {
    const data = { stats, level, exp, points, items, atkBuff, groundItem };
    localStorage.setItem("weatherRPGsave", JSON.stringify(data));
    setSaveCount((c) => c + 1);
    alert("セーブしました！");
  };

  const loadGame = () => {
    const ok = loadGameSilent();
    if (!ok) {
      alert("セーブデータがありません！");
      return;
    }
    setLoadCount((c) => c + 1);
    alert("ロードしました！");
  };

  const resetGame = () => {
    if (!confirm("本当にリセットしますか？")) return;

    localStorage.removeItem("weatherRPGsave");

    setStats({ str: 0, crt: 0, hp: 0 });
    setLevel(1);
    setExp(0);
    setPoints(0);

    setItems([]);
    setAtkBuff(0);
    setGroundItem(null);

    setIsBossBg(false); // ★追加：背景も戻す

    setResetCount((c) => c + 1);
    alert("リセットしました！");
  };

  /* ======================================
      ■ レイアウト
  ====================================== */
  const LEFT_W = 220;
  const RIGHT_W = 280;
  const GAP = 24;

  const effectText = (it) => {
    const ef = it?.effect;
    if (!ef) return "";
    if (ef.type === "exp") return `経験値 +${ef.value}`;
    if (ef.type === "point") return `未振りポイント +${ef.value}`;
    if (ef.type === "atk_buff") return `次の攻撃 +${ef.value}`;
    return "";
  };

  /* ======================================
      ■ ★追加：全体背景（天気＋ボス戦）
  ====================================== */
  const getBackgroundStyle = () => {
    if (isBossBg) {
      return {
        background:
          "radial-gradient(circle at 20% 0%, rgba(168,85,247,0.45), rgba(2,6,23,0.98) 55%), radial-gradient(circle at 80% 30%, rgba(239,68,68,0.25), rgba(2,6,23,0.0) 60%), linear-gradient(180deg, #020617, #0b1020)",
      };
    }

    switch (weather) {
      case "Rain":
        return { background: "linear-gradient(180deg, #0b1220, #1f2937)" };
      case "Clouds":
        return { background: "linear-gradient(180deg, #e5e7eb, #9ca3af)" };
      case "Snow":
        return { background: "linear-gradient(180deg, #f8fafc, #c7d2fe)" };
      case "Thunderstorm":
        return { background: "linear-gradient(180deg, #020617, #312e81)" };
      default:
        return { background: "linear-gradient(180deg, #ecfeff, #bae6fd)" };
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "sans-serif",
        transition: "background 0.6s",
        ...getBackgroundStyle(),
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${LEFT_W}px 1fr ${RIGHT_W}px`,
          gap: GAP,
          minHeight: "100vh",
          padding: 0,
          boxSizing: "border-box",
          alignItems: "start",
        }}
      >
        {/* 左：ステータス */}
        <div style={{ justifySelf: "start", alignSelf: "stretch" }}>
          <StatsPanel stats={stats} points={points} onUpgrade={upgradeStat} />
        </div>

        {/* 中央：敵 */}
        <div style={{ justifySelf: "center", paddingTop: 24 }}>
          <h1 style={{ textAlign: "center", marginTop: 0, marginBottom: 18 }}>Weather RPG</h1>

          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <strong>現在の天気：</strong> {weather}
          </div>

          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <strong>Level:</strong> {level} | <strong>EXP:</strong> {exp} / {expToNext}
          </div>

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <strong>攻撃力:</strong> {1 + stats.str}
            {atkBuff > 0 && (
              <span style={{ marginLeft: 8, color: "#b45309" }}>（次の攻撃 +{atkBuff}）</span>
            )}
          </div>

          <EnemyDisplay
            addHp={stats.hp}
            attackPower={1 + stats.str}
            onAttack={attackEnemy}
            onGainExp={gainExp}
            weather={weather}
            resetCount={resetCount}
            saveCount={saveCount}
            loadCount={loadCount}
            onEnemyDefeated={onEnemyDefeated}
            onBossBattleChange={setIsBossBg} // ★追加：ボス戦中フラグを受け取る
          />

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button onClick={saveGame} style={{ marginRight: 10 }}>
              セーブ
            </button>
            <button onClick={loadGame} style={{ marginRight: 10 }}>
              ロード
            </button>
            <button onClick={resetGame}>リセット</button>
          </div>
        </div>

        {/* 右：落ち物 + 所持品 */}
        <div style={{ justifySelf: "end", paddingTop: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                width: 260,
                minHeight: 120,
                padding: 12,
                borderRadius: 10,
                border: "1px dashed #aaa",
                background: "rgba(255,255,255,0.75)",
                textAlign: "center",
                margin: 0,
                boxSizing: "border-box",
                backdropFilter: "blur(2px)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>落ちてるアイテム</div>

              {!groundItem ? (
                <div style={{ color: "#777", fontSize: 14 }}>（何も落ちてない）</div>
              ) : (
                <button
                  onClick={() => {
                    setItems((prev) => [groundItem, ...prev].slice(0, MAX_ITEMS));
                    setGroundItem(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #999",
                    cursor: "pointer",
                    background: "white",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ fontSize: 28, lineHeight: 1 }}>{groundItem.icon ?? "🎁"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{groundItem.name ?? "Item"}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{effectText(groundItem)}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>クリックで拾う</div>
                    </div>
                  </div>
                </button>
              )}
            </div>

            <ItemPanel items={items} onUse={useItem} max={MAX_ITEMS} />
          </div>
        </div>
      </div>
    </div>
  );
}