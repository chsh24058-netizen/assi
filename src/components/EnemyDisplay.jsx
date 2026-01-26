import { useEffect, useMemo, useState } from "react";

export default function EnemyDisplay({
  addHp = 1,
  attackPower = 1,
  onAttack,
  onGainExp = () => {},
  weather = "Clear",
  resetCount,
  saveCount,
  loadCount,
}) {
  const ENEMY_SAVE_KEY = "weatherRPG_enemySave";

  const [hydrated, setHydrated] = useState(false);

  const [enemySets, setEnemySets] = useState({
    Clear: [
      { name: "ファイヤースライム", baseHp: 10, exp: 5, kill: 0, unlockKill: 10, unlock: 0 },
      { name: "ヒートバット", baseHp: 50, exp: 20, kill: 0, unlockKill: 5, unlock: 0 },
      { name: "フレアタイタン", baseHp: 100, exp: 100, kill: 0, unlockKill: 10, unlock: 0 },
      { name: "インフェルノ", baseHp: 1000, exp: 1000, kill: 0 },
    ],
    Rain: [
      { name: "ウォータースライム", baseHp: 15, exp: 7, kill: 0, unlockKill: 10, unlock: 0 },
      { name: "アクアウルフ", baseHp: 60, exp: 30, kill: 0, unlockKill: 5, unlock: 0 },
      { name: "ウォーターゴーレム", baseHp: 220, exp: 180, kill: 0, unlockKill: 10, unlock: 0 },
      { name: "ポセイドン", baseHp: 1200, exp: 1000, kill: 0 },
    ],
    Clouds: [
      { name: "クラウドバット", baseHp: 10, exp: 5, kill: 0, unlockKill: 10, unlock: 0 },
      { name: "フォッグウルフ", baseHp: 80, exp: 30, kill: 0, unlockKill: 5, unlock: 0 },
      { name: "ミストゴーレム", baseHp: 150, exp: 150, kill: 0, unlockKill: 10, unlock: 0 },
      { name: "ファントム", baseHp: 1500, exp: 2000, kill: 0 },
    ],
    Thunderstorm: [
      { name: "サンダーインプ", baseHp: 15, exp: 5, kill: 0, unlockKill: 10, unlock: 0 },
      { name: "ライトニングウルフ", baseHp: 75, exp: 25, kill: 0, unlockKill: 10, unlock: 0 },
      { name: "トールゴーレム", baseHp: 200, exp: 200, kill: 0, unlockKill: 10, unlock: 0 },
      { name: "ゼウス", baseHp: 2000, exp: 2000, kill: 0 },
    ],
  });

  const enemyList = useMemo(() => enemySets[weather] || enemySets["Clear"], [enemySets, weather]);

  const [index, setIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(1);

  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const isBoss = (e) => e === enemyList[enemyList.length - 1];
  const [isBossBattle, setIsBossBattle] = useState(false);

  const [playerTime, setPlayerTime] = useState(0);
  const [maxPlayerTime, setMaxPlayerTime] = useState(0);

  // ✅「ボス勝利直後だけ、ボスHP=0を固定する」フラグ
  const [bossDefeatedHold, setBossDefeatedHold] = useState(false);

  const isBossUnlocked = enemyList.slice(0, enemyList.length - 1).every((e) => e.unlock === 1);

  const calcEnemyHp = (baseHp, kill) => Math.floor(baseHp * (1 + kill * 0.1));

  // 天気変化で index リセット（ボス戦中は触らない）
  useEffect(() => {
    if (isBossBattle) return;
    setIndex(0);
  }, [weather, isBossBattle]);

  const enemy = enemyList[index];
  const maxHp = calcEnemyHp(enemy.baseHp, enemy.kill);

  const [hp, setHp] = useState(() => calcEnemyHp(enemy.baseHp, enemy.kill));

  // ✅ 敵が切り替わった時だけHPを満タンにする（hp依存は絶対入れない）
  // ✅ ただし「ボス勝利後で、まだボスを表示している間」は0を維持
  useEffect(() => {
    if (bossDefeatedHold && isBoss(enemy)) {
      setHp(0);
      return;
    }
    setHp(calcEnemyHp(enemy.baseHp, enemy.kill));
  }, [index, enemy.baseHp, enemy.kill, enemyList, bossDefeatedHold]); // ← hp は入れない

  const saveEnemyData = (nextEnemySets = enemySets) => {
    const data = {
      enemySets: nextEnemySets,
      index,
      maxIndex,
      isBossBattle,
      playerTime,
      maxPlayerTime,
      bossDefeatedHold,
    };
    localStorage.setItem(ENEMY_SAVE_KEY, JSON.stringify(data));
  };

  const loadEnemyData = () => {
    const raw = localStorage.getItem(ENEMY_SAVE_KEY);
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);

      const loadedSets = data.enemySets || enemySets;
      if (data.enemySets) setEnemySets(data.enemySets);

      const list =
        loadedSets?.[weather] ||
        loadedSets?.["Clear"] ||
        enemySets?.[weather] ||
        enemySets?.["Clear"];

      const safeMaxIndex = Math.max(1, Math.min(data.maxIndex ?? 1, list.length - 1));
      const safeIndex = Math.max(0, Math.min(data.index ?? 0, list.length - 1));

      setMaxIndex(safeMaxIndex);
      setIndex(safeIndex);

      setIsBossBattle(!!data.isBossBattle);
      setPlayerTime(Math.max(0, data.playerTime ?? 0));
      setMaxPlayerTime(Math.max(0, data.maxPlayerTime ?? 0));

      setBossDefeatedHold(!!data.bossDefeatedHold);

      return true;
    } catch (e) {
      console.error("enemy load error:", e);
      return false;
    }
  };

  // 起動時ロード
  useEffect(() => {
    loadEnemyData();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自動セーブ
  useEffect(() => {
    if (!hydrated) return;
    saveEnemyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, index, maxIndex, isBossBattle, playerTime, maxPlayerTime, bossDefeatedHold, enemySets]);

  // App側セーブ
  useEffect(() => {
    if (!saveCount) return;
    saveEnemyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveCount]);

  // App側ロード
  useEffect(() => {
    if (!loadCount) return;
    loadEnemyData();
    setHydrated(true);
  }, [loadCount]);

  // リセット
  useEffect(() => {
    if (!resetCount) return;

    localStorage.removeItem(ENEMY_SAVE_KEY);

    setEnemySets((prev) => {
      const newSets = {};
      for (const key in prev) {
        newSets[key] = prev[key].map((e) => ({
          ...e,
          kill: 0,
          unlock: 0,
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
    setBossDefeatedHold(false);
    setHydrated(true);
  }, [resetCount]);

  const endBossBattle = () => {
    setIsBossBattle(false);
    setPlayerTime(0);
    setMaxPlayerTime(0);
    setIndex(0);
    // ここでは bossDefeatedHold は消さない（勝利後にボスHP=0を維持したいので）
    // ※次の敵に移ると useEffect 側で満タン復帰する
  };

  const startBossBattle = () => {
    const bossIndex = enemyList.findIndex(isBoss);
    if (bossIndex === -1) return;

    // ✅ ボス戦開始時は「0固定」を解除してちゃんと戦えるようにする
    setBossDefeatedHold(false);

    const timeLimit = 9 + addHp;
    setIndex(bossIndex);
    setIsBossBattle(true);
    setPlayerTime(timeLimit);
    setMaxPlayerTime(timeLimit);
  };

  useEffect(() => {
    if (!isBossBattle) return;
    if (playerTime <= 0) return;
    const timer = setInterval(() => setPlayerTime((prev) => prev - 1), 1000);
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
  }, [playerTime, isBossBattle]);

  const handleAttack = () => {
    if (isBossBattle && !isBoss(enemy)) return;

    const { damage, isCritical } = onAttack();

    if (isCritical) {
      setIsCriticalHit(true);
      setTimeout(() => setIsCriticalHit(false), 150);
    }

    // ✅ 普通に減る（ここが基本）
    const newHp = Math.max(hp - damage, 0);
    setHp(newHp);

    if (newHp !== 0) return;

    const nextKill = enemy.kill + 1;
    onGainExp(Math.floor(enemy.exp * (1 + enemy.kill * 0.1)));

    // ✅ ボス勝利：ボスのkillだけ増やす + HP=0固定
    if (isBossBattle && isBoss(enemy)) {
      // 先に0固定をON（kill更新でuseEffectが走っても復活しない）
      setBossDefeatedHold(true);
      setHp(0);

      setEnemySets((prev) => {
        const nextList = prev[weather].map((e, i) =>
          i === index ? { ...e, kill: (e.kill ?? 0) + 1 } : e
        );
        const nextSets = { ...prev, [weather]: nextList };

        const saveData = {
          enemySets: nextSets,
          index,
          maxIndex,
          isBossBattle,
          playerTime,
          maxPlayerTime,
          bossDefeatedHold: true,
        };
        localStorage.setItem(ENEMY_SAVE_KEY, JSON.stringify(saveData));

        return nextSets;
      });

      setTimeout(() => {
        alert("win!");
        endBossBattle();
      }, 300);
      return;
    }

    // 通常敵：kill/unlock 更新 + 即保存
    setEnemySets((prev) => {
      const updatedWeatherList = prev[weather].map((e, i) => {
        if (i !== index) return e;

        const nextUnlock = e.unlockKill
          ? nextKill >= e.unlockKill && e.unlock === 0
            ? 1
            : e.unlock
          : e.unlock;

        return {
          ...e,
          kill: nextKill,
          unlock: nextUnlock,
        };
      });

      const nextSets = {
        ...prev,
        [weather]: updatedWeatherList,
      };

      const saveData = {
        enemySets: nextSets,
        index,
        maxIndex,
        isBossBattle,
        playerTime,
        maxPlayerTime,
        bossDefeatedHold,
      };
      localStorage.setItem(ENEMY_SAVE_KEY, JSON.stringify(saveData));

      return nextSets;
    });

    // 次の敵へ
    setTimeout(() => {
      if (isBoss(enemy)) {
        setIsBossBattle(false);
        setIndex(0);
        return;
      }

      if (nextKill >= enemy.unlockKill && maxIndex < enemyList.length - 1 && enemy.unlock == 0) {
        setMaxIndex((prev) => prev + 1);
        setIndex(maxIndex);
      } else {
        setIndex((index + 1) % maxIndex);
      }
    }, 200);
  };

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
          userSelect: "none",
        }}
        onClick={handleAttack}
      >
        <h3 style={{ margin: "6px 0" }}>
          敵（{weather}）: {enemy.name}
        </h3>

        <div style={{ height: 18, background: "#eee", borderRadius: 9, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${maxHp === 0 ? 0 : (hp / maxHp) * 100}%`,
              background: "linear-gradient(90deg,#f66,#f00)",
              transition: "width 0.15s",
            }}
          />
        </div>

        <div style={{ marginTop: 8 }}>HP: {hp} / {maxHp}</div>

        <div style={{ marginTop: 12, color: "#555" }}>
          <small>攻撃力: {attackPower} （クリックで攻撃）</small>
        </div>
        <div style={{ marginTop: 3}}>
          <small>{enemy.name} : {enemy.kill}</small>
          <small>: {maxIndex}</small>
        </div>
      </div>

      {isBossUnlocked && !isBossBattle && (
        <button onClick={startBossBattle} disabled={isBossBattle} style={{ background: "darkred", color: "white" }}>
          ボスに挑戦
        </button>
      )}

      {isBossBattle && (
        <div style={{ width: 260, margin: "10px auto" }}>
          <div style={{ height: 10, background: "#444", borderRadius: 5, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${maxPlayerTime === 0 ? 0 : (playerTime / maxPlayerTime) * 100}%`,
                background: "lime",
                transition: "width 0.3s",
              }}
            />
          </div>
          <small>自分のHP：{playerTime}</small>
        </div>
      )}
    </div>
  );
}