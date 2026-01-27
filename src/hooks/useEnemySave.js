// src/hooks/useEnemySave.js
import { useEffect, useState } from "react";
import { DEFAULT_ENEMY_SETS } from "../data/enemies";

const ENEMY_SAVE_KEY = "weatherRPG_enemySave";

export function useEnemySave({
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

  // EnemyDisplay側の状態を更新するためのsetter群
  setIndex,
  setMaxIndex,
  setIsBossBattle,
  setPlayerTime,
  setMaxPlayerTime,
  setBossDefeatedHold,
}) {
  const [hydrated, setHydrated] = useState(false);
  const [enemySets, setEnemySets] = useState(DEFAULT_ENEMY_SETS);

  const getListForWeather = (sets, w) => {
    const fallback = sets?.Clear || DEFAULT_ENEMY_SETS.Clear;
    return sets?.[w] || fallback;
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

  const buildSaveData = (sets, overrides = {}) => ({
    enemySets: sets,
    index: safeIndex,
    maxIndex,
    isBossBattle,
    playerTime,
    maxPlayerTime,
    bossDefeatedHold,
    ...overrides,
  });

  const saveEnemyData = (nextEnemySets = enemySets, overrides = {}) => {
    try {
      const data = buildSaveData(nextEnemySets, overrides);
      localStorage.setItem(ENEMY_SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("enemy save error:", e);
    }
  };

  // “戦闘中に即保存したい”場面用（今までの挙動維持）
  const saveNow = (nextEnemySets, snapshotOverrides = {}) => {
    saveEnemyData(nextEnemySets, snapshotOverrides);
  };

  const applyLoadedState = (data, loadedSets) => {
    const list = getListForWeather(loadedSets, weather);
    const lastIdx = Math.max(0, list.length - 1);

    // maxIndex は「ボス除外」で管理してるので、最大は lastIdx（ボス含む配列の末尾）- 1 が通常
    // ただしボス戦の index は lastIdx を使うので index は lastIdx まで許可
    const safeMax = clamp(data.maxIndex ?? 1, 1, Math.max(1, lastIdx));
    const safeIdx = clamp(data.index ?? 0, 0, lastIdx);

    setMaxIndex(safeMax);
    setIndex(safeIdx);

    setIsBossBattle(!!data.isBossBattle);
    setPlayerTime(Math.max(0, data.playerTime ?? 0));
    setMaxPlayerTime(Math.max(0, data.maxPlayerTime ?? 0));
    setBossDefeatedHold(!!data.bossDefeatedHold);
  };

  const loadEnemyData = () => {
    const raw = localStorage.getItem(ENEMY_SAVE_KEY);
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);

      // 保存が壊れてても落ちないように
      const loadedSets = data?.enemySets || DEFAULT_ENEMY_SETS;

      setEnemySets(loadedSets);
      applyLoadedState(data, loadedSets);

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

  // 自動セーブ（今まで通り）
  useEffect(() => {
    if (!hydrated) return;
    saveEnemyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hydrated,
    safeIndex,
    maxIndex,
    isBossBattle,
    playerTime,
    maxPlayerTime,
    bossDefeatedHold,
    enemySets,
    weather,
  ]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCount]);

  // リセット（EnemyDisplayの resetCount と同じトリガー）
  useEffect(() => {
    if (!resetCount) return;

    localStorage.removeItem(ENEMY_SAVE_KEY);

    // 既存のキー構造を保ちつつ kill/unlock を0に戻す（元の挙動維持）
    setEnemySets((prev) => {
      const newSets = {};
      for (const key in prev) {
        newSets[key] = (prev[key] || []).map((e) => ({
          ...e,
          kill: 0,
          unlock: 0,
        }));
      }
      return newSets;
    });

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCount]);

  return { hydrated, enemySets, setEnemySets, saveNow };
}