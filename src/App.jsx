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


  const expToNext = level * 10;

  /* ======================================
      ■ 天気の状態（Clear / Rain / Clouds…）
  ====================================== */
  const [weather, setWeather] = useState("Clear"); // 初期値：晴れ

  /* ======================================
      ■ 天気を取得する関数（OpenWeatherMap）
         天気名例：Clear, Clouds, Rain, Snow, Thunderstorm
  ====================================== */
  const fetchWeather = async () => {
    const API_KEY = "xxxxxxxx";
    const API_URL =`https://api.openweathermap.org/data/2.5/weather?q=Tokyo&appid=${API_KEY}&lang=ja&units=metric`;


    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      if (data.weather && data.weather.length > 0) {
        const mainWeather = data.weather[0].main;
        setWeather(mainWeather);
      }
    } catch (err) {
      console.error("天気APIエラー:", err);
    }
  };

  /* ======================================
      ■ マウント時＋60秒ごとに天気更新
  ====================================== */
  useEffect(() => {
    fetchWeather(); // 最初に実行

    const interval = setInterval(fetchWeather, 600000); // 10分
    return () => clearInterval(interval);
  }, []);

  /* ======================================
      ■ 経験値追加処理
  ====================================== */
  const gainExp = (amount = 20) => {
    setExp(prev => {
      let newExp = prev + amount;
      let newLevel = level;
      let newPoints = points;

      // レベルアップ処理（何レベル分でも対応）
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
    setStats(prev => ({ ...prev, [key]: prev[key] + 1 }));
    setPoints(prev => prev - 1);
  };

  const attackEnemy = () => {
    const baseDamage = 1 + stats.str;

    const isCritical = Math.random() < (stats.crt + 1) / 100;
    const damage = isCritical ? baseDamage * 2 : baseDamage;

    return {
      damage,
      isCritical
    };
  };


  /* ======================================
      ■ セーブデータ保存
  ====================================== */
  const saveGame = () => {
    const data = {
      stats,
      level,
      exp,
      points
    };
    localStorage.setItem("weatherRPGsave", JSON.stringify(data));
    alert("セーブしました！");
  };

  /* ======================================
      ■ セーブデータ読み込み
  ====================================== */
  const loadGame = () => {
    const saveData = localStorage.getItem("weatherRPGsave");
    if (!saveData) {
      alert("セーブデータがありません！");
      return;
    }

    const data = JSON.parse(saveData);
    setStats(data.stats);
    setLevel(data.level);
    setExp(data.exp);
    setPoints(data.points);

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

    setResetCount(c => c + 1);

    alert("リセットしました！");
  };


  /* ======================================
      ■ JSX（表示部分）
  ====================================== */
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      
      {/* 左：ステータスパネル */}
      <StatsPanel stats={stats} points={points} onUpgrade={upgradeStat} />

      {/* 右：ゲーム画面 */}
      <div style={{ padding: 24, flex: 1 }}>
        <h1>Weather RPG</h1>

        <p><strong>現在の天気：</strong> {weather}</p>

        <p>
          <strong>Level:</strong> {level} |
          <strong> EXP:</strong> {exp} / {expToNext}
        </p>

        <p>
          <strong>攻撃力:</strong> {1 + stats.str}
        </p>

        {/* ★ 天気を EnemyDisplay に渡す */}
        <EnemyDisplay
          addHp={stats.hp}
          attackPower={1 + stats.str}
          onAttack={attackEnemy}
          onGainExp={gainExp}
          weather={weather}
          resetCount={resetCount}
        />
        

        <div style={{ marginTop: 20 }}>
          <button onClick={saveGame} style={{ marginRight: 10 }}>セーブ</button>
          <button onClick={loadGame} style={{ marginRight: 10 }}>ロード</button>
          <button onClick={resetGame}>リセット</button>
        </div>
      </div>
    </div>
  );
}
