import { useState, useEffect } from "react";

/*i
  EnemyDisplay は「敵のHPを管理して表示するコンポーネント」。
  props:
    - attackPower: 親が渡す現在の攻撃力（数値）
    - onGainExp: 敵を倒したときに呼ぶ関数（経験値付与など）
    - weather: 天気APIから渡ってくる天気（Clear / Rain / Clouds など）
*/
export default function EnemyDisplay({ addHp = 1, attackPower = 1, onAttack, onGainExp = () => {}, weather = "Clear", resetCount }) {

  // ★ 天気ごとの敵リスト
  const [enemySets, setEnemySets] = useState({
    Clear: [
      { name: "ファイヤースライム", baseHp: 10, exp: 5, kill: 0, unlockKill: 10, unlock: 0},
      { name: "ヒートバット", baseHp: 50, exp: 20, kill: 0, unlockKill: 5, unlock: 0},
      { name: "フレアタイタン", baseHp: 100, exp: 100, kill: 0, unlockKill: 10, unlock: 0},
      { name: "インフェルノ", baseHp: 1000, exp: 1000, kill: 0 }
    ],
    Rain: [
      { name: "ウォータースライム", baseHp: 15, exp: 7, kill: 0, unlockKill: 10, unlock: 0},
      { name: "アクアウルフ", baseHp: 60, exp: 30, kill: 0, unlockKill: 5, unlock: 0},
      { name: "ウォーターゴーレム", baseHp: 220, exp: 180, kill: 0, unlockKill: 10, unlock: 0},
      { name: "ポセイドン", baseHp: 1200, exp: 1000, kill: 0 }
    ],
    Clouds: [
      { name: "クラウドバット", baseHp: 10, exp: 5, kill: 0, unlockKill: 10, unlock: 0},
      { name: "フォッグウルフ", baseHp: 80, exp: 30, kill: 0, unlockKill: 5, unlock: 0},
      { name: "ミストゴーレム", baseHp: 150, exp: 150, kill: 0, unlockKill: 10, unlock: 0},
      { name: "ファントム", baseHp: 1500, exp: 2000, kill: 0 }
    ],
    Thunderstorm: [
      { name: "サンダーインプ", baseHp: 15, exp: 5, kill: 0, unlockKill: 10, unlock: 0},
      { name: "ライトニングウルフ", baseHp: 75, exp: 25, kill: 0, unlockKill: 10, unlock: 0},
      { name: "トールゴーレム", baseHp: 200, exp: 200, kill: 0, unlockKill: 10, unlock: 0},
      { name: "ゼウス", baseHp: 2000, exp: 2000, kill: 0 }
    ]
  });

  // ★ 天気に対応する敵リストを取得（未対応天気は Clear 扱い）
  const enemyList = enemySets[weather] || enemySets["Clear"];

  // 敵 index と HP
  const [index, setIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(1);

  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const isBoss = (enemy) => enemy === enemyList[enemyList.length - 1];
  const [isBossBattle, setIsBossBattle] = useState(false);

  const [playerTime, setPlayerTime] = useState(0);
  const [maxPlayerTime, setMaxPlayerTime] = useState(0);

  const isBossUnlocked = enemyList
    .slice(0, enemyList.length - 1) // boss を除く
    .every(enemy => enemy.unlock === 1);


  const calcEnemyHp = (baseHp, kill) => {
    // 倒すたびにHPが10%ずつ増える例
    return Math.floor(baseHp * (1 + kill * 0.1));
  };


  // ★ 天気が変わったとき → 敵リストも変わるので index と HP をリセット
  useEffect(() => {
    setIndex(0);
  }, [weather]);


  const enemy = enemyList[index];
  const maxHp = calcEnemyHp(enemy.baseHp, enemy.kill);
  const [hp, setHp] = useState(() =>
    calcEnemyHp(enemy.baseHp, enemy.kill)
  );


  // index が変わったらHPリセット

  useEffect(() => {
    const newMaxHp = calcEnemyHp(enemy.baseHp, enemy.kill);
    setHp(newMaxHp);
  }, [index, enemy.kill]);

  

  // 攻撃
  const handleAttack = () => {
    if (isBossBattle && !isBoss(enemy)) return;
    const { damage, isCritical } = onAttack();
    
    if (isCritical) {
      setIsCriticalHit(true);
      setTimeout(() => setIsCriticalHit(false), 150);
    }

    const newHp = Math.max(hp - damage, 0);
    setHp(newHp);

    if (newHp === 0) {
      const nextKill = enemy.kill + 1;
      onGainExp(Math.floor(enemy.exp * (1 + enemy.kill *0.1)));
      if (isBossBattle && isBoss(enemy)) {
        setHp(0);
        setTimeout(() => {
          alert("win!");
          endBossBattle();
        }, 300);
        return;
      }
      setEnemySets(prev => ({
        ...prev,
        [weather]: prev[weather].map((e, i) =>{
          if (i !== index) return e;

        // ★ unlock 判定もここで
        return {
          ...e,
          kill: nextKill,
          unlock: e.unlockKill
            ? nextKill >= e.unlockKill && e.unlock === 0
              ? 1
              : e.unlock
            : e.unlock
        };
      })
    }));
      setTimeout(() => {
        if (isBoss(enemy)) {
          setIsBossBattle(false);
          setIndex(0);
        } else {
        // ★ 規定回数倒したら次の敵を解放
          if (nextKill >= enemy.unlockKill && maxIndex < enemyList.length - 1 && enemy.unlock == 0) {
            setMaxIndex(prev => prev + 1);
            setIndex(maxIndex);
          } else {
           // ★ 同じ敵 or 解放済み範囲内でローテーション
           setIndex((index + 1) % maxIndex);
          }
        }
      }, 200);
    }
  };

  const startBossBattle = () => {
    const bossIndex = enemyList.findIndex(isBoss);
    if (bossIndex === -1) return;
    const timeLimit = 9 + addHp;
    setIndex(bossIndex);
    setIsBossBattle(true);
    setPlayerTime(timeLimit);
    setMaxPlayerTime(timeLimit);
  };

  useEffect(() => {
    if (!isBossBattle) return;
    if (playerTime <= 0) return;
    const timer = setInterval(() => {
      setPlayerTime(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isBossBattle, playerTime]);

  useEffect(() => {
    if (!isBossBattle) return;
    if (playerTime <= 0) {
      setTimeout(() => {
        alert("lose...");
        endBossBattle();
      }, 300);
    }
  }, [playerTime]);

  const endBossBattle = () => {
    setIsBossBattle(false);
    setPlayerTime(0);
    setMaxPlayerTime(0);
    setIndex(0); // 通常戦に戻す
  };

  
  useEffect(() => {
    setEnemySets(prev => {
      const newSets = {};
      for (const key in prev) {
        newSets[key] = prev[key].map(e => ({
          ...e,
          kill: 0,
          unlock: 0
        }));
      }
     return newSets;
    });
    setIndex(0);
    setMaxIndex(1);
    setIsBossBattle(false);
    setPlayerTime(0);
    setMaxPlayerTime(0);
    setIsCriticalHit(false);
  }, [resetCount]);


  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <div
        style={{
          width: 260,
          margin: "0 auto",
          padding: 16,
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          background: isCriticalHit ? "#fbb8b8ff" : "#fff",
          transition: "background 0.15s",
          cursor: "pointer",
          userSelect: "none"
        }}
        onClick={handleAttack}
      >
        <h3 style={{ margin: "6px 0" }}>敵（{weather}）: {enemy.name}</h3>

        {/* HPバー */}
        <div style={{ height: 18, background: "#eee", borderRadius: 9, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${(hp / maxHp) * 100}%`,
              background: "linear-gradient(90deg,#f66,#f00)",
              transition: "width 0.15s"
            }}
          />
        </div>

        <div style={{ marginTop: 8 }}>
          HP: {hp} / {maxHp}
        </div>

        <div style={{ marginTop: 12, color: "#555" }}>
          <small>攻撃力: {attackPower} （クリックで攻撃）</small>
        </div>
        <div style={{ marginTop: 3}}>
          <small>{enemy.name} : {enemy.kill}</small>
          <small>: {maxIndex}</small>
        </div>
      </div>
      {isBossUnlocked && !isBossBattle && (
        <button onClick={startBossBattle}
          disabled={isBossBattle}
          style={{ background: "darkred", color: "white" }}
          >ボスに挑戦</button>
      )}
      {isBossBattle && (
        <div style={{ width: 260, margin: "10px auto" }}>
          <div style={{
            height: 10,
            background: "#444",
            borderRadius: 5,
            overflow: "hidden"
          }}>
            <div style={{
              height: "100%",
              width: `${(playerTime / maxPlayerTime) * 100}%`,
              background: "lime",
              transition: "width 0.3s"
            }} />
        </div>
        <small>自分のHP：{playerTime}</small>
      </div>
    )}
    </div>
  );
}
