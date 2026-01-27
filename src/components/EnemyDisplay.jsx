// src/components/EnemyDisplay.jsx
import { useEffect, useMemo, useState } from "react";
import { useEnemySave } from "../hooks/useEnemySave";

export default function EnemyDisplay({
  addHp = 1,
  attackPower = 1,
  onAttack,
  onGainExp = () => {},
  weather = "Clear",
  resetCount,
  saveCount,
  loadCount,
  onEnemyDefeated,
  onBossBattleChange = () => {},
}) {
  const [index, setIndex] = useState(0);

  // ★「通常敵の解放数（ボス除外）」として扱う：最小1
  const [maxIndex, setMaxIndex] = useState(1);

  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const [isBossBattle, setIsBossBattle] = useState(false);

  const [playerTime, setPlayerTime] = useState(0);
  const [maxPlayerTime, setMaxPlayerTime] = useState(0);

  const [bossDefeatedHold, setBossDefeatedHold] = useState(false);

  /* =========================
      ■ スキル（必殺技）
  ========================= */
  const SKILL_COOLDOWN_MS = 10_000;
  const SKILL_MULT = 5;

  const [skillReadyAt, setSkillReadyAt] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const skillRemainSec = Math.max(0, Math.ceil((skillReadyAt - nowMs) / 1000));
  const canUseSkill = skillRemainSec === 0;

  const calcEnemyHp = (baseHp, kill) => Math.floor(baseHp * (1 + (kill ?? 0) * 0.1));

  /* =========================
      ■ セーブ/ロード（フック）
  ========================= */
  const safeIndex = Math.max(0, Math.min(index, 999999));

  const { hydrated, enemySets, setEnemySets, saveNow } = useEnemySave({
    weather,
    safeIndex,
    maxIndex,
    isBossBattle,
    playerTime,
    maxPlayerTime,
    bossDefeatedHold,
    resetCount,
    saveCount,
    loadCount,
    setIndex,
    setMaxIndex,
    setIsBossBattle,
    setPlayerTime,
    setMaxPlayerTime,
    setBossDefeatedHold,
  });

  const enemyList = useMemo(() => enemySets[weather] || enemySets["Clear"], [enemySets, weather]);

  const lastIdx = Math.max(0, enemyList.length - 1);
  const bossIdx = lastIdx;

  // ★安全なboss判定：indexで判断
  const isBossIndex = (idx) => idx === bossIdx;

  // ★通常敵（ボス除外）の数
  const normalCount = Math.max(1, enemyList.length - 1);

  const isBossUnlocked = enemyList.slice(0, enemyList.length - 1).every((e) => e.unlock === 1);

  /* =========================
      ■ 天気変更時の調整（通常時のみ）
  ========================= */
  useEffect(() => {
    if (isBossBattle) return;

    setIndex(0);
    setMaxIndex((prev) => Math.max(1, Math.min(prev, normalCount)));
  }, [weather, isBossBattle, normalCount]);

  // indexが変になったら保険（ボス戦中は bossIdx も許可）
  useEffect(() => {
    const maxAllowedIndex = isBossBattle ? bossIdx : Math.max(0, maxIndex - 1);
    if (index < 0 || index > maxAllowedIndex) setIndex(0);
  }, [index, maxIndex, bossIdx, isBossBattle]);

  const clampedIndex = Math.max(0, Math.min(index, bossIdx));
  const enemy = enemyList[clampedIndex];

  const maxHp = enemy ? calcEnemyHp(enemy.baseHp, enemy.kill) : 1;
  const [hp, setHp] = useState(() => (enemy ? calcEnemyHp(enemy.baseHp, enemy.kill) : 1));

  useEffect(() => {
    if (!enemy) return;

    if (bossDefeatedHold && isBossIndex(clampedIndex)) {
      setHp(0);
      return;
    }
    setHp(calcEnemyHp(enemy.baseHp, enemy.kill));
  }, [clampedIndex, enemy, bossDefeatedHold]);

  /* =========================
      ■ リセット時
  ========================= */
  useEffect(() => {
    if (!resetCount) return;

    setIndex(0);
    setMaxIndex(1);
    setIsBossBattle(false);
    setPlayerTime(0);
    setMaxPlayerTime(0);
    setIsCriticalHit(false);
    setBossDefeatedHold(false);
    setSkillReadyAt(0);
  }, [resetCount]);

  /* =========================
      ■ ボス戦
  ========================= */
  const endBossBattle = () => {
    setIsBossBattle(false);
    setPlayerTime(0);
    setMaxPlayerTime(0);
    setIndex(0);
  };

  const startBossBattle = () => {
    if (bossIdx < 0) return;

    setBossDefeatedHold(false);

    const timeLimit = 9 + addHp;
    setIndex(bossIdx);
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

  useEffect(() => {
    onBossBattleChange(!!isBossBattle);
  }, [isBossBattle, onBossBattleChange]);

  /* =========================
      ■ 攻撃
  ========================= */
  const handleAttack = (mult = 1) => {
    if (!enemy) return;

    // ボス戦中はボス以外を殴れない
    if (isBossBattle && !isBossIndex(clampedIndex)) return;

    const result = onAttack?.(mult);
    const { damage, isCritical } = result || { damage: 0, isCritical: false };

    if (isCritical) {
      setIsCriticalHit(true);
      setTimeout(() => setIsCriticalHit(false), 150);
    }

    const newHp = Math.max(hp - damage, 0);
    setHp(newHp);

    if (newHp !== 0) return;

    // 撃破通知
    onEnemyDefeated?.({ isBoss: isBossIndex(clampedIndex), enemyName: enemy.name, weather });

    const nextKill = (enemy.kill ?? 0) + 1;
    onGainExp(Math.floor(enemy.exp * (1 + (enemy.kill ?? 0) * 0.1)));

    // ===== ボス勝利 =====
    if (isBossBattle && isBossIndex(clampedIndex)) {
      setBossDefeatedHold(true);
      setHp(0);

      setEnemySets((prev) => {
        const baseList = prev[weather] || prev["Clear"] || [];
        const nextList = baseList.map((e, i) => (i === clampedIndex ? { ...e, kill: (e.kill ?? 0) + 1 } : e));
        const nextSets = { ...prev, [weather]: nextList };

        saveNow(nextSets, {
          index: clampedIndex,
          maxIndex,
          isBossBattle,
          playerTime,
          maxPlayerTime,
          bossDefeatedHold: true,
        });

        return nextSets;
      });

      setTimeout(() => {
        alert("win!");
        endBossBattle();
      }, 300);
      return;
    }

    // ===== 通常敵 =====
    setEnemySets((prev) => {
      const baseList = prev[weather] || prev["Clear"] || [];
      const updatedWeatherList = baseList.map((e, i) => {
        if (i !== clampedIndex) return e;

        const nextUnlock = e.unlockKill
          ? nextKill >= e.unlockKill && e.unlock === 0
            ? 1
            : e.unlock
          : e.unlock;

        return { ...e, kill: nextKill, unlock: nextUnlock };
      });

      const nextSets = { ...prev, [weather]: updatedWeatherList };

      saveNow(nextSets, {
        index: clampedIndex,
        maxIndex,
        isBossBattle,
        playerTime,
        maxPlayerTime,
        bossDefeatedHold,
      });

      return nextSets;
    });

    // 次の敵へ（通常敵の範囲で回す）
    setTimeout(() => {
      // 次に解放されるかチェック
      const shouldUnlockNext =
        nextKill >= (enemy.unlockKill ?? Infinity) && maxIndex < normalCount && enemy.unlock === 0;

      if (shouldUnlockNext) {
        const newUnlockedCount = Math.min(maxIndex + 1, normalCount);
        setMaxIndex(newUnlockedCount);
        setIndex(newUnlockedCount - 1); // ★「新しく解放された敵」へ
      } else {
        setIndex((prev) => (prev + 1) % Math.max(1, maxIndex));
      }
    }, 200);
  };

  const handleSkill = () => {
    if (!canUseSkill) return;
    setSkillReadyAt(Date.now() + SKILL_COOLDOWN_MS);
    handleAttack(SKILL_MULT);
  };

  if (!hydrated && !enemy) {
    return <div style={{ textAlign: "center", marginTop: 20 }}>Loading...</div>;
  }

  /* =========================
      ■ 背景（通常/ボスで切替）
      - 「今表示してる敵がボス」 または 「ボス戦中」はボス背景
  ========================= */
  const isBossNow = isBossIndex(clampedIndex) || isBossBattle;

  // 天気の雰囲気（控えめ）
  const weatherTint = (() => {
    if (weather === "Rain") return "rgba(59,130,246,0.10)";
    if (weather === "Clouds") return "rgba(107,114,128,0.10)";
    if (weather === "Snow") return "rgba(148,163,184,0.12)";
    if (weather === "Thunderstorm") return "rgba(168,85,247,0.10)";
    return "rgba(16,185,129,0.06)"; // Clear等
  })();

  const cardBase = {
    width: 260,
    margin: "0 auto",
    padding: 16,
    borderRadius: 12,
    boxShadow: isBossNow ? "0 0 18px rgba(168,85,247,0.45)" : "0 2px 6px rgba(0,0,0,0.15)",
    transition: "background 0.15s, box-shadow 0.25s, border-color 0.25s",
    cursor: "pointer",
    userSelect: "none",
    border: isBossNow ? "1px solid rgba(217,70,239,0.55)" : "1px solid rgba(0,0,0,0.06)",
    overflow: "hidden",
  };

  const normalBg = `linear-gradient(135deg, rgba(255,255,255,0.96), ${weatherTint})`;
  const bossBg = "linear-gradient(135deg, rgba(36,0,48,0.92), rgba(88,28,135,0.92))";

  const cardBg = isCriticalHit
    ? "linear-gradient(135deg, rgba(255,210,210,0.98), rgba(255,235,235,0.98))"
    : isBossNow
      ? bossBg
      : normalBg;

  const titleColor = isBossNow ? "#f5d0fe" : "#111827";
  const subColor = isBossNow ? "rgba(245,208,254,0.85)" : "#555";

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <div
        style={{
          ...cardBase,
          background: cardBg,
        }}
        onClick={() => handleAttack(1)}
      >
        {/* バッジ（ボス/通常） */}
        {isBossNow ? (
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.5,
              color: "#fde68a",
              background: "rgba(220,38,38,0.35)",
              border: "1px solid rgba(250,204,21,0.45)",
              marginBottom: 8,
            }}
          >
            ⚠ BOSS ⚠
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>通常の敵</div>
        )}

        <h3 style={{ margin: "6px 0", color: titleColor }}>
          敵（{weather}）: {enemy ? enemy.name : "Loading..."}
        </h3>

        {/* HPバー */}
        <div style={{ height: 18, background: "rgba(0,0,0,0.10)", borderRadius: 9, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${maxHp === 0 ? 0 : (hp / maxHp) * 100}%`,
              background: isBossNow
                ? "linear-gradient(90deg,#fbbf24,#ef4444)"
                : "linear-gradient(90deg,#f66,#f00)",
              transition: "width 0.15s",
            }}
          />
        </div>

        <div style={{ marginTop: 8, color: isBossNow ? "rgba(255,255,255,0.90)" : "#111827" }}>
          HP: {hp} / {maxHp}
        </div>

        <div style={{ marginTop: 12, color: subColor }}>
          <small>攻撃力: {attackPower} （クリックで攻撃）</small>
        </div>

        <div style={{ marginTop: 3, color: isBossNow ? "rgba(255,255,255,0.75)" : "#6b7280" }}>
          <small>{enemy ? `${enemy.name} : ${enemy.kill ?? 0}` : ""}</small>
        </div>

        {/* 必殺技 */}
        <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSkill();
            }}
            disabled={!canUseSkill}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: isBossNow ? "1px solid rgba(245,208,254,0.45)" : "1px solid #999",
              cursor: canUseSkill ? "pointer" : "not-allowed",
              opacity: canUseSkill ? 1 : 0.6,
              background: isBossNow ? "rgba(255,255,255,0.08)" : "white",
              color: isBossNow ? "rgba(255,255,255,0.90)" : "#111827",
            }}
          >
            必殺技 ×{SKILL_MULT}
          </button>

          <span style={{ fontSize: 12, color: isBossNow ? "rgba(255,255,255,0.75)" : "#555" }}>
            {canUseSkill ? "使用可能" : `CT: ${skillRemainSec}s`}
          </span>
        </div>
      </div>

      {/* ボス挑戦ボタン */}
      {isBossUnlocked && !isBossBattle && (
        <button
          onClick={startBossBattle}
          disabled={isBossBattle}
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(127,29,29,0.45)",
            background: "darkred",
            color: "white",
            cursor: "pointer",
          }}
        >
          ボスに挑戦
        </button>
      )}

      {/* プレイヤーHP（ボス戦時） */}
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