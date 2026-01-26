import { useState, useEffect } from "react";
import StatsPanel from "./components/StatsPanel";
import EnemyDisplay from "./components/EnemyDisplay";

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

  const expToNext = level * 10;

  /* ======================================
      ■ 天気の状態（Clear / Rain / Clouds…）
  ====================================== */
  const [weather, setWeather] = useState("Clear");

  /* ======================================
      ■ 天気取得
  ====================================== */
  const fetchWeather = async () => {
    try {
      const res = await fetch("/.netlify/functions/weather");
      const data = await res.json();

      if (data.weather && data.weather.length > 0) {
        setWeather(data.weather[0].main);
      }
    } catch (err) {
      console.error("天気APIエラー:", err);
    }
  };

  /* ======================================
      ■ セーブデータ読み込み（自動用：alertなし）
  ====================================== */
  const loadGameSilent = () => {
    const raw = localStorage.getItem("weatherRPGsave");
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);

      // ★欠けてても落ちないようにデフォルトを用意
      setStats(data.stats ?? { str: 0, crt: 0, hp: 0 });
      setLevel(data.level ?? 1);
      setExp(data.exp ?? 0);
      setPoints(data.points ?? 0);

      return true;
    } catch (e) {
      console.error("save load error:", e);
      return false;
    }
  };

  /* ======================================
      ■ マウント時：自動ロード（プレイヤー＋敵） + 天気取得
      ★敵だけ保存されているケースも拾う
  ====================================== */
  useEffect(() => {
    const loadedPlayer = loadGameSilent();
    const hasEnemySave = !!localStorage.getItem("weatherRPG_enemySave");

    // ★プレイヤー or 敵のどちらかにセーブがあれば EnemyDisplay にロード命令
    if (loadedPlayer || hasEnemySave) {
      setLoadCount((c) => c + 1);
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10分
    return () => clearInterval(interval);
  }, []);

  /* ======================================
      ■ 経験値追加処理
  ====================================== */
  const gainExp = (amount = 20) => {
    setExp((prev) => {
      let newExp = prev + amount;
      let newLevel = level;
      let newPoints = points;

      while (newExp >= newLevel * 10) {
        newExp -= newLevel * 10;
        newLevel += 1;
        newPoints += 1;
      }

      setLevel(newLevel);
      setPoints(newPoints);

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

  const attackEnemy = () => {
    const baseDamage = 1 + stats.str;
    const isCritical = Math.random() < (stats.crt + 1) / 100;
    const damage = isCritical ? baseDamage * 2 : baseDamage;
    return { damage, isCritical };
  };

  /* ======================================
      ■ セーブデータ保存（プレイヤー＋敵）
  ====================================== */
  const saveGame = () => {
    const data = { stats, level, exp, points };
    localStorage.setItem("weatherRPGsave", JSON.stringify(data));

    setSaveCount((c) => c + 1); // ★EnemyDisplayにもセーブ命令
    alert("セーブしました！");
  };

  /* ======================================
      ■ セーブデータ読み込み（プレイヤー＋敵）
  ====================================== */
  const loadGame = () => {
    const ok = loadGameSilent();
    if (!ok) {
      alert("セーブデータがありません！");
      return;
    }

    setLoadCount((c) => c + 1); // ★EnemyDisplayにもロード命令
    alert("ロードしました！");
  };

  /* ======================================
      ■ リセット
  ====================================== */
  const resetGame = () => {
    if (!confirm("本当にリセットしますか？")) return;

    localStorage.removeItem("weatherRPGsave");

    setStats({ str: 0, crt: 0, hp: 0 });
    setLevel(1);
    setExp(0);
    setPoints(0);

    setResetCount((c) => c + 1); // ★EnemyDisplayは resetCount で敵保存も消す
    alert("リセットしました！");
  };

  /* ======================================
      ■ JSX
  ====================================== */
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <StatsPanel stats={stats} points={points} onUpgrade={upgradeStat} />

      <div style={{ padding: 24, flex: 1 }}>
        <h1>Weather RPG</h1>

        <p>
          <strong>現在の天気：</strong> {weather}
        </p>

        <p>
          <strong>Level:</strong> {level} | <strong>EXP:</strong> {exp} / {expToNext}
        </p>

        <p>
          <strong>攻撃力:</strong> {1 + stats.str}
        </p>

        <EnemyDisplay
          addHp={stats.hp}
          attackPower={1 + stats.str}
          onAttack={attackEnemy}
          onGainExp={gainExp}
          weather={weather}
          resetCount={resetCount}
          saveCount={saveCount}
          loadCount={loadCount}
        />

        <div style={{ marginTop: 20 }}>
          <button onClick={saveGame} style={{ marginRight: 10 }}>
            セーブ
          </button>
          <button onClick={loadGame} style={{ marginRight: 10 }}>
            ロード
          </button>
          <button onClick={resetGame}>リセット</button>
        </div>
      </div>
    </div>
  );
}