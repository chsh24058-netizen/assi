// src/components/ItemPanel.jsx
export default function ItemPanel({ items = [], onUse = () => {}, max = 20 }) {
  const effectText = (it) => {
    const ef = it?.effect;
    if (!ef) return "";

    if (ef.type === "exp") return `経験値 +${ef.value}`;
    if (ef.type === "point") return `未振りポイント +${ef.value}`;
    if (ef.type === "atk_buff") return `次の攻撃 +${ef.value}`;
    return "";
  };

  // ★追加：レアリティ表示（色だけ付ける）
  const rarityText = (rarity) => {
    if (!rarity) return "";
    if (rarity === "N") return "N";
    if (rarity === "R") return "R";
    if (rarity === "SR") return "SR";
    return rarity;
  };

  const rarityColor = {
    N: "#6b7280", // グレー
    R: "#2563eb", // 青
    SR: "#c026d3", // 紫
  };

  return (
    <div
      style={{
        width: 260,
        padding: 12,
        borderRadius: 10,
        border: "1px solid #ddd",
        background: "white",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        所持品（{items.length}/{max}）
      </div>

      {items.length === 0 ? (
        <div style={{ color: "#777", fontSize: 14 }}>（何も持ってない）</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((it, idx) => (
            <button
              key={`${it.name}-${idx}`}
              onClick={() => onUse(idx)}
              style={{
                textAlign: "left",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #999",
                background: "white",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ fontSize: 24, lineHeight: 1 }}>{it.icon ?? "🎁"}</div>

                <div style={{ flex: 1 }}>
                  {/* ★追加：名前の横にレアリティ */}
                  <div style={{ fontWeight: 700 }}>
                    {it.name ?? "Item"}
                    {it.rarity && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          color: rarityColor[it.rarity] ?? "#666",
                        }}
                      >
                        [{rarityText(it.rarity)}]
                      </span>
                    )}
                  </div>

                  {/* 効果表示 */}
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    {effectText(it)}
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#666" }}>使う</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}