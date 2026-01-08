// StatsPanel.jsx
/*
  左側のステータスパネル（ステータスポイントを振るUI）
  props:
    - stats: { str, dex, hp }
    - points: 残り振れるポイント
    - onUpgrade: (key) => void
*/
export default function StatsPanel({ stats = {str:0,crt:0,hp:0}, points = 0, onUpgrade = () => {} }) {
  return (
    <div style={{
      width: 220,
      padding: 12,
      background: "#f3f3f3",
      borderRight: "1px solid #ddd",
      minHeight: "100vh",
      boxSizing: "border-box"
    }}>
      <h3 style={{ marginTop: 6 }}>ステータス</h3>
      <p>未振りポイント: <strong>{points}</strong></p>

      <div style={{ marginBottom: 8 }}>
        <div>STR (攻撃): {stats.str}</div>
        <button disabled={points<=0} onClick={() => onUpgrade("str")}>+</button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div>CRT (クリティカル): {stats.crt}</div>
        <button disabled={points<=0} onClick={() => onUpgrade("crt")}>+</button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div>HP (最大体力成長): {stats.hp}</div>
        <button disabled={points<=0} onClick={() => onUpgrade("hp")}>+</button>
      </div>

      <hr style={{ margin: "12px 0" }} />
      <div style={{ fontSize: 12, color: "#666" }}>
        レベルアップでポイント獲得 → 左の「+」で振ってください。
      </div>
    </div>
  );
}
