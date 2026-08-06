import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from './supabase.js';

// ============================================================
// BVN BRAND COLORS & THEME — Industrial / Hydraulic / Bold Red
// ============================================================
const C = {
  red: "#C41230",
  redHover: "#A50E28",
  redDim: "rgba(196,18,48,0.10)",
  redGlow: "rgba(196,18,48,0.25)",
  dark: "#1B1B1F",
  darkCard: "#232328",
  darkCardHover: "#2C2C33",
  darkSidebar: "#18181C",
  darkInput: "#2A2A31",
  border: "#333340",
  borderLight: "#3E3E4C",
  text: "#F0F0F5",
  textMuted: "#9999AA",
  textDim: "#66667A",
  white: "#FFFFFF",
  steel: "#A8A8B8",
  blue: "#2563EB",
  blueDim: "rgba(37,99,235,0.12)",
  green: "#22C55E",
  greenDim: "rgba(34,197,94,0.12)",
  yellow: "#EAB308",
  yellowDim: "rgba(234,179,8,0.12)",
  orange: "#F97316",
  orangeDim: "rgba(249,115,22,0.12)",
  danger: "#EF4444",
  dangerDim: "rgba(239,68,68,0.12)",
};

// ============================================================
// SAMPLE DATA
// ============================================================
const initialItems = [
  { code: "FLANGE-A1", description: "Flange de aço inox 2\"", productionTime: 45 },
  { code: "TUBO-B2", description: "Tubo galvanizado 3m", productionTime: 30 },
  { code: "VALV-C3", description: "Válvula esfera 1/2\"", productionTime: 60 },
  { code: "CONEX-D4", description: "Conexão roscada 3/4\"", productionTime: 15 },
  { code: "BRIDA-E5", description: "Brida de fixação 4\"", productionTime: 90 },
  { code: "ANEL-F6", description: "Anel de vedação NBR", productionTime: 10 },
  { code: "SUPT-G7", description: "Suporte metálico L", productionTime: 25 },
  { code: "JUNTA-H8", description: "Junta de expansão DN50", productionTime: 120 },
];

const initialOrders = [
  { id: 1, client: "HARAMAQ", orderNumber: "76306", deliveryDate: "2025-01-29", productionStart: "2025-01-26", productionEnd: "2025-01-28", status: "executing", observations: "Pedido urgente", items: [{ code: "FLANGE-A1", description: "Flange de aço inox 2\"", quantity: 10, productionTime: 450 }, { code: "TUBO-B2", description: "Tubo galvanizado 3m", quantity: 5, productionTime: 150 }], itemsCompleted: { "FLANGE-A1": false, "TUBO-B2": false } },
  { id: 2, client: "INTERPUMP", orderNumber: "76295", deliveryDate: "2025-01-30", productionStart: "2025-01-27", productionEnd: "2025-01-29", status: "scheduled", observations: "", items: [{ code: "VALV-C3", description: "Válvula esfera 1/2\"", quantity: 20, productionTime: 1200 }], itemsCompleted: { "VALV-C3": false } },
  { id: 3, client: "MARTELLO", orderNumber: "76309", deliveryDate: "2025-01-28", productionStart: "2025-01-26", productionEnd: "2025-01-27", status: "scheduled", observations: "", items: [{ code: "CONEX-D4", description: "Conexão roscada 3/4\"", quantity: 50, productionTime: 750 }, { code: "ANEL-F6", description: "Anel de vedação NBR", quantity: 100, productionTime: 1000 }], itemsCompleted: { "CONEX-D4": false, "ANEL-F6": false } },
  { id: 4, client: "ACRYLUS", orderNumber: "76320", deliveryDate: "2025-01-28", productionStart: "2025-01-26", productionEnd: "2025-01-27", status: "scheduled", observations: "", items: [{ code: "SUPT-G7", description: "Suporte metálico L", quantity: 30, productionTime: 750 }], itemsCompleted: { "SUPT-G7": false } },
  { id: 5, client: "GANA", orderNumber: "76350", deliveryDate: "2025-01-30", productionStart: "2025-01-27", productionEnd: "2025-01-29", status: "scheduled", observations: "", items: [{ code: "JUNTA-H8", description: "Junta de expansão DN50", quantity: 8, productionTime: 960 }], itemsCompleted: { "JUNTA-H8": false } },
  { id: 6, client: "KOLLER", orderNumber: "76315", deliveryDate: "2025-01-31", productionStart: "2025-01-29", productionEnd: "2025-01-30", status: "scheduled", observations: "", items: [{ code: "BRIDA-E5", description: "Brida de fixação 4\"", quantity: 12, productionTime: 1080 }], itemsCompleted: { "BRIDA-E5": false } },
  { id: 7, client: "BANDEIRANTE", orderNumber: "76329", deliveryDate: "2025-02-03", productionStart: "2025-01-30", productionEnd: "2025-02-01", status: "scheduled", observations: "", items: [{ code: "FLANGE-A1", description: "Flange de aço inox 2\"", quantity: 25, productionTime: 1125 }, { code: "VALV-C3", description: "Válvula esfera 1/2\"", quantity: 10, productionTime: 600 }], itemsCompleted: { "FLANGE-A1": false, "VALV-C3": false } },
  { id: 8, client: "MHP", orderNumber: "76340", deliveryDate: "2025-02-05", productionStart: "2025-02-03", productionEnd: "2025-02-04", status: "scheduled", observations: "", items: [{ code: "TUBO-B2", description: "Tubo galvanizado 3m", quantity: 40, productionTime: 1200 }], itemsCompleted: { "TUBO-B2": false } },
];

const defaultCalSettings = { segunda: 8, terca: 8, quarta: 8, quinta: 8, sexta: 8, sabado: 0, saturdayEnabled: false };

const defaultUsers = [];

const ROLE_LABELS = { gestor: "Gestor", montador: "Montador", vendedor: "Vendedor" };
const ROLE_COLORS = { gestor: C.red, montador: C.steel, vendedor: C.yellow };

// ============================================================
// UTILITIES
// ============================================================
function fmtMin(m) { const h = Math.floor(m / 60); const mm = m % 60; if (h === 0) return `${mm}min`; if (mm === 0) return `${h}h`; return `${h}h ${mm}min`; }
function fmtSec(s) { if (!s) return "0s"; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; if (h === 0 && m === 0) return `${sec}s`; if (h === 0) return sec === 0 ? `${m}m` : `${m}m${sec}s`; if (m === 0 && sec === 0) return `${h}h`; if (sec === 0) return `${h}h${m}m`; return `${h}h${m}m${sec}s`; }
// Aceita "1h23m45s", "15m30s", "45s" ou um número puro (segundos, para compatibilidade)
function parseTimeStr(str) {
  if (str === null || str === undefined) return null;
  const s = String(str).trim().toLowerCase().replace(/\s/g, "");
  if (!s) return null;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const m = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m || (!m[1] && !m[2] && !m[3])) return null;
  return parseInt(m[1] || "0", 10) * 3600 + parseInt(m[2] || "0", 10) * 60 + parseInt(m[3] || "0", 10);
}
function fmtDate(s) { if (!s) return ""; const [, m, d] = s.split("-"); return `${d}/${m}`; }
function fmtDateFull(s) { if (!s) return ""; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; }
function getDayName(s) { const d = new Date(s + "T12:00:00"); return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][d.getDay()]; }
function getDayKey(s) { const d = new Date(s + "T12:00:00"); return ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][d.getDay()]; }
function getToday() { return new Date().toISOString().split("T")[0]; }
function getTomorrow() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; }
function addDays(s, n) { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }
function getMonday(s) { const d = new Date(s + "T12:00:00"); const day = d.getDay(); d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); return d.toISOString().split("T")[0]; }

// ============================================================
// SHARED UI COMPONENTS
// ============================================================
const F = "'Barlow', sans-serif";
const FH = "'Barlow Condensed', sans-serif";

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 6,
  border: `1px solid ${C.border}`, background: C.darkInput,
  color: C.text, fontSize: 14, fontFamily: F,
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
};
const labelStyle = {
  display: "block", color: C.textMuted, fontSize: 11,
  fontWeight: 700, marginBottom: 6, fontFamily: FH,
  textTransform: "uppercase", letterSpacing: "0.08em",
};

function Field({ label, children, style: s }) {
  return <div style={{ marginBottom: 16, ...s }}><label style={labelStyle}>{label}</label>{children}</div>;
}

function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.darkCard, borderRadius: 12, border: `1px solid ${C.border}`, width, maxWidth: "92vw", maxHeight: "85vh", overflow: "auto", boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, color: C.text, fontSize: 17, fontFamily: FH, fontWeight: 700, letterSpacing: "0.02em" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, message, onYes, onNo }) {
  return (
    <Modal open={open} title="Confirmação" width={400} onClose={onNo}>
      <p style={{ color: C.text, fontSize: 15, lineHeight: 1.6, margin: "0 0 24px", fontFamily: F }}>{message}</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button onClick={onNo} style={{ padding: "10px 24px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 600 }}>Não</button>
        <button onClick={onYes} style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: C.red, color: "#fff", cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 700 }}>Sim</button>
      </div>
    </Modal>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, style: s }) {
  const base = { padding: "11px 24px", borderRadius: 6, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontFamily: FH, fontSize: 14, fontWeight: 700, letterSpacing: "0.03em", transition: "all 0.15s", opacity: disabled ? 0.4 : 1, ...s };
  if (variant === "primary") return <button onClick={onClick} disabled={disabled} style={{ ...base, background: C.red, color: "#fff", boxShadow: "0 2px 12px " + C.redGlow }}>{children}</button>;
  if (variant === "ghost") return <button onClick={onClick} disabled={disabled} style={{ ...base, background: C.darkInput, color: C.textMuted, border: `1px solid ${C.border}` }}>{children}</button>;
  if (variant === "success") return <button onClick={onClick} disabled={disabled} style={{ ...base, background: C.green, color: "#fff" }}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} style={base}>{children}</button>;
}

// ============================================================
// SUGGESTION DROPDOWN — extracted to module level to prevent remount on each keystroke
// ============================================================
function SuggestionDropdown({ items, onSelect, renderLabel }) {
  if (!items.length) return null;
  return (
    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: C.darkCard, border: `1px solid ${C.border}`, borderRadius: 6, marginTop: 4, maxHeight: 150, overflow: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => onSelect(item)} style={{ padding: "10px 14px", cursor: "pointer", color: C.text, fontSize: 13, fontFamily: F, borderBottom: `1px solid ${C.border}` }}
          onMouseEnter={e => e.target.style.background = C.darkCardHover} onMouseLeave={e => e.target.style.background = "transparent"}>
          {renderLabel(item)}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage({ users, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  function handleLogin() {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { onLogin(user); }
    else { setError("Usuário ou senha inválidos"); setTimeout(() => setError(""), 3000); }
  }

  function handleKey(e) { if (e.key === "Enter") handleLogin(); }

  return (
    <div style={{
      width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.dark, position: "relative", overflow: "hidden",
    }}>
      {/* Background industrial pattern */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, ${C.white} 40px, ${C.white} 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, ${C.white} 40px, ${C.white} 41px)` }} />

      {/* Red accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${C.red}, ${C.red} 30%, transparent)` }} />

      <div style={{
        width: 420, background: C.darkCard, borderRadius: 16, border: `1px solid ${C.border}`,
        boxShadow: "0 40px 80px rgba(0,0,0,0.5)", overflow: "hidden", position: "relative",
      }}>
        {/* Header with BVN branding */}
        <div style={{
          padding: "40px 40px 28px", textAlign: "center",
          borderBottom: `1px solid ${C.border}`,
          background: `linear-gradient(180deg, rgba(196,18,48,0.06) 0%, transparent 100%)`,
        }}>
          <div style={{
            fontSize: 48, fontWeight: 900, color: C.red, fontFamily: FH,
            letterSpacing: "-0.02em", lineHeight: 1,
          }}>BVN</div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.textMuted, fontFamily: FH,
            letterSpacing: "0.3em", textTransform: "uppercase", marginTop: 4,
          }}>HIDRÁULICA E PNEUMÁTICA</div>
          <div style={{
            marginTop: 20, fontSize: 20, fontWeight: 700, color: C.text, fontFamily: FH,
            letterSpacing: "0.05em",
          }}>PCP — Controle de Produção</div>
        </div>

        <div style={{ padding: "32px 40px 40px" }}>
          <Field label="Usuário">
            <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={handleKey}
              placeholder="Digite seu usuário" style={inputStyle} autoFocus />
          </Field>
          <Field label="Senha">
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
                placeholder="Digite sua senha" style={inputStyle} />
              <button onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 13, fontFamily: F,
              }}>{showPass ? "Ocultar" : "Mostrar"}</button>
            </div>
          </Field>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 6, background: C.dangerDim,
              color: C.danger, fontSize: 13, fontFamily: F, marginBottom: 16,
              border: `1px solid ${C.danger}30`,
            }}>{error}</div>
          )}

          <button onClick={handleLogin} style={{
            width: "100%", padding: 14, borderRadius: 8, border: "none",
            background: C.red, color: "#fff", cursor: "pointer",
            fontSize: 16, fontWeight: 800, fontFamily: FH,
            letterSpacing: "0.05em", textTransform: "uppercase",
            boxShadow: `0 4px 20px ${C.redGlow}`,
            transition: "all 0.15s",
          }}>Entrar</button>

          <div style={{
            marginTop: 24, padding: 16, borderRadius: 8, background: C.darkInput,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 11, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontWeight: 700 }}>
              Acesso
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, fontFamily: F, lineHeight: 1.8 }}>
              Use o usuário e senha fornecidos pelo gestor.
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: C.textDim, fontFamily: F }}>
            v1.3.0
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({ activePage, setActivePage, currentUser, onLogout }) {
  const allPages = [
    { id: "demand", icon: "📋", label: "Demanda de Produção", roles: ["gestor", "montador", "vendedor"] },
    { id: "calendar", icon: "📅", label: "Calendário", roles: ["gestor", "montador", "vendedor"] },
    { id: "open", icon: "🔄", label: "Demandas em Aberto", roles: ["gestor", "montador", "vendedor"] },
    { id: "logistics", icon: "🚚", label: "Logística", roles: ["gestor", "montador"] },
    { id: "missing", icon: "⚠", label: "Itens Faltantes", roles: ["gestor", "montador"] },
    { id: "items", icon: "📦", label: "Cadastro de Itens", roles: ["gestor", "montador"] },
    { id: "reports", icon: "📊", label: "Relatórios", roles: ["gestor"] },
    { id: "export", icon: "📤", label: "Exportação", roles: ["gestor"] },
    { id: "users", icon: "👤", label: "Usuários", roles: ["gestor"] },
  ];

  const pages = allPages.filter(p => p.roles.includes(currentUser.role));

  return (
    <div style={{
      width: 250, minWidth: 250, background: C.darkSidebar,
      borderRight: `1px solid ${C.border}`, display: "flex",
      flexDirection: "column", height: "100vh",
    }}>
      {/* BVN Logo */}
      <div style={{ padding: "22px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 8,
            background: C.red, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: FH,
            boxShadow: `0 2px 10px ${C.redGlow}`,
          }}>BVN</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.03em" }}>
              PCP System
            </div>
            <div style={{ fontSize: 10, color: C.textDim, fontFamily: FH, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Controle de Produção
            </div>
          </div>
        </div>
      </div>

      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {pages.map(p => (
          <button key={p.id} onClick={() => setActivePage(p.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "11px 14px", borderRadius: 8, border: "none",
            background: activePage === p.id ? C.redDim : "transparent",
            color: activePage === p.id ? C.red : C.textMuted,
            cursor: "pointer", fontSize: 13, fontWeight: activePage === p.id ? 700 : 500,
            fontFamily: F, textAlign: "left", transition: "all 0.12s", marginBottom: 2,
          }}>
            <span style={{ fontSize: 16 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </nav>

      {/* User Info */}
      <div style={{
        padding: "16px 16px", borderTop: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: F }}>{currentUser.name}</div>
          <div style={{
            fontSize: 10, fontWeight: 700, fontFamily: FH, letterSpacing: "0.08em", textTransform: "uppercase",
            color: ROLE_COLORS[currentUser.role] || C.steel, marginTop: 2,
          }}>{ROLE_LABELS[currentUser.role] || currentUser.role}</div>
        </div>
        <button onClick={onLogout} title="Sair" style={{
          width: 34, height: 34, borderRadius: 6, border: `1px solid ${C.border}`,
          background: C.darkInput, color: C.textMuted, cursor: "pointer", fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>⏻</button>
      </div>
    </div>
  );
}

// ============================================================
// PAGE 1: DEMANDA DE PRODUÇÃO
// ============================================================
function DemandPage({ orders, addOrder, updateOrder, registeredItems, clientHistory, addClient, editingOrderId, setEditingOrderId, setActivePage, calendarSettings, dayOverrides }) {
  const isEditing = editingOrderId !== null;
  const editingOrder = isEditing ? orders.find(o => o.id === editingOrderId) : null;
  const [client, setClient] = useState(editingOrder?.client || "");
  const [orderNumber, setOrderNumber] = useState(editingOrder?.orderNumber || "");
  const [deliveryDate, setDeliveryDate] = useState(editingOrder?.deliveryDate || "");
  const [prodStart, setProdStart] = useState(editingOrder?.productionStart || "");
  const [prodEnd, setProdEnd] = useState(editingOrder?.productionEnd || "");
  const [demandItems, setDemandItems] = useState(editingOrder?.items || []);
  const [observations, setObservations] = useState(editingOrder?.observations || "");
  const [itemCode, setItemCode] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [showClientSugg, setShowClientSugg] = useState(false);
  const [showCodeSugg, setShowCodeSugg] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [distMode, setDistMode] = useState(editingOrder?.productionDays?.length > 0 ? "personalizado" : "equal");
  const [productionDays, setProductionDays] = useState(editingOrder?.productionDays?.length ? [...editingOrder.productionDays] : []);
  const [missingItems, setMissingItems] = useState(editingOrder?.missingItems ? [...editingOrder.missingItems] : []);
  const [missingCode, setMissingCode] = useState("");
  const [missingQtyInput, setMissingQtyInput] = useState("");

  const totalItems = demandItems.length;
  const totalUnits = demandItems.reduce((s, i) => s + i.quantity, 0);
  const totalProdTime = demandItems.reduce((s, i) => s + i.productionTime, 0);

  useEffect(() => {
    if (editingOrder) {
      setClient(editingOrder.client); setOrderNumber(editingOrder.orderNumber); setDeliveryDate(editingOrder.deliveryDate);
      setProdStart(editingOrder.productionStart); setProdEnd(editingOrder.productionEnd);
      setDemandItems([...editingOrder.items]); setObservations(editingOrder.observations);
      const pd = editingOrder.productionDays || [];
      setProductionDays(pd.length ? [...pd] : []);
      setDistMode(pd.length ? "personalizado" : "equal");
      setMissingItems(editingOrder.missingItems ? [...editingOrder.missingItems] : []);
    }
  }, [editingOrderId]);

  function addMissingItem() {
    const code = missingCode.trim().toUpperCase();
    if (!code) return alert("Digite o código do item faltante.");
    const qty = parseInt(missingQtyInput);
    if (!qty || qty < 1) return alert("Quantidade deve ser um número inteiro positivo.");
    const existing = missingItems.find(m => m.code === code);
    if (existing) { setMissingItems(missingItems.map(m => m.code === code ? { ...m, qty: m.qty + qty } : m)); }
    else { setMissingItems([...missingItems, { code, qty, delivered: false }]); }
    setMissingCode(""); setMissingQtyInput("");
  }
  function removeMissingItem(code) { setMissingItems(missingItems.filter(m => m.code !== code)); }
  function toggleMissingDelivered(code) { setMissingItems(missingItems.map(m => m.code === code ? { ...m, delivered: !m.delivered } : m)); }

  const filteredClients = clientHistory.filter(c => c.toLowerCase().includes(client.toLowerCase()) && c !== client);
  const filteredCodes = registeredItems.filter(i => i.code.toLowerCase().includes(itemCode.toLowerCase()) && i.code !== itemCode);

  // ── Distribuição da produção entre dias ─────────────────────────
  function getDayHours(ds) { if (dayOverrides[ds] !== undefined) return dayOverrides[ds]; return calendarSettings[getDayKey(ds)] ?? 8; }
  function getWorkDaysBetween(start, end) {
    if (!start || !end || end < start) return [];
    const days = []; let d = start; let guard = 0;
    while (d <= end && guard < 400) { if (getDayHours(d) > 0) days.push(d); d = addDays(d, 1); guard++; }
    return days;
  }
  function getOtherOrdersSecondsForDay(ds) {
    return orders.reduce((sum, o) => {
      if (isEditing && o.id === editingOrderId) return sum;
      let secs = 0;
      if (o.productionDays && o.productionDays.length > 0) { const pd = o.productionDays.find(p => p.date === ds); secs = pd ? pd.minutes : 0; }
      else if (o.productionStart === ds) { secs = o.items.reduce((s, i) => s + i.productionTime, 0); }
      return sum + secs;
    }, 0);
  }

  useEffect(() => {
    if (distMode === "personalizado") return;
    if (!prodStart || totalProdTime <= 0) { setProductionDays([]); return; }
    if (distMode === "equal") {
      const end = prodEnd && prodEnd >= prodStart ? prodEnd : prodStart;
      let days = getWorkDaysBetween(prodStart, end);
      if (days.length === 0) days = [prodStart];
      const per = Math.floor(totalProdTime / days.length);
      const rem = totalProdTime - per * days.length;
      setProductionDays(days.map((d, i) => ({ date: d, minutes: per + (i === days.length - 1 ? rem : 0) })));
    } else if (distMode === "maximo") {
      const dist = []; let remaining = totalProdTime, d = prodStart, guard = 0;
      while (remaining > 0 && guard < 400) {
        const hours = getDayHours(d);
        if (hours > 0) {
          const cap = Math.max(0, hours * 3600 - getOtherOrdersSecondsForDay(d));
          const take = Math.min(remaining, cap);
          if (take > 0) { dist.push({ date: d, minutes: take }); remaining -= take; }
        }
        d = addDays(d, 1); guard++;
      }
      setProductionDays(dist);
      if (dist.length > 0) { const lastDay = dist[dist.length - 1].date; if (lastDay !== prodEnd) setProdEnd(lastDay); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distMode, prodStart, prodEnd, totalProdTime]);

  function addCustomDay() {
    const lastDate = productionDays.length ? productionDays[productionDays.length - 1].date : (prodStart || getToday());
    const nextDate = productionDays.length ? addDays(lastDate, 1) : (prodStart || getToday());
    setProductionDays([...productionDays, { date: nextDate, minutes: 0 }]);
  }
  function removeCustomDay(idx) { setProductionDays(productionDays.filter((_, i) => i !== idx)); }
  function updateCustomDayDate(idx, date) { setProductionDays(productionDays.map((pd, i) => i === idx ? { ...pd, date } : pd)); }
  function updateCustomDayTime(idx, raw) {
    const secs = parseTimeStr(raw);
    setProductionDays(productionDays.map((pd, i) => i === idx ? { ...pd, minutes: secs !== null ? secs : pd.minutes, _raw: raw } : pd));
  }
  const distTotal = productionDays.reduce((s, pd) => s + (pd.minutes || 0), 0);

  function handleProdStartChange(val) {
    if (deliveryDate && val > deliveryDate) {
      setConfirm({ message: "Você deseja alterar a previsão de entrega?", onYes: () => { setProdStart(val); setDeliveryDate(val); setConfirm(null); }, onNo: () => setConfirm(null) });
    } else setProdStart(val);
  }
  function handleProdEndChange(val) {
    if (deliveryDate && val > deliveryDate) {
      setConfirm({ message: "Você deseja alterar a previsão de entrega?", onYes: () => { setProdEnd(val); setDeliveryDate(val); setConfirm(null); }, onNo: () => setConfirm(null) });
    } else if (prodStart && val < prodStart) {
      setConfirm({ message: "Você deseja alterar o início da produção?", onYes: () => { setProdEnd(val); setProdStart(val); setConfirm(null); }, onNo: () => setConfirm(null) });
    } else setProdEnd(val);
  }
  function addItem() {
    const found = registeredItems.find(i => i.code === itemCode.toUpperCase());
    if (!found) return alert("Código não encontrado no cadastro.");
    const qty = parseInt(itemQty);
    if (!qty || qty < 1) return alert("Quantidade deve ser um número inteiro positivo.");
    const existing = demandItems.find(di => di.code === found.code);
    if (existing) { setDemandItems(demandItems.map(di => di.code === found.code ? { ...di, quantity: di.quantity + qty, productionTime: (di.quantity + qty) * found.productionTime } : di)); }
    else { setDemandItems([...demandItems, { code: found.code, description: found.description, quantity: qty, productionTime: qty * found.productionTime }]); }
    setItemCode(""); setItemQty("");
  }
  function removeItem(code) { setDemandItems(demandItems.filter(i => i.code !== code)); }
  function confirmOrder() {
    if (!client || !orderNumber || !deliveryDate) return alert("Preencha cliente, pedido e previsão de entrega.");
    if (demandItems.length === 0) return alert("Adicione ao menos um item.");
    if (!prodStart) return alert("Selecione o início de produção.");
    if (productionDays.length === 0) return alert("Configure a distribuição da produção entre os dias.");
    const finalDays = productionDays.map(({ date, minutes }) => ({ date, minutes })).sort((a, b) => a.date.localeCompare(b.date));
    const finalDistTotal = finalDays.reduce((s, pd) => s + pd.minutes, 0);
    const mismatchWarning = finalDistTotal !== totalProdTime ? `\n\nAtenção: o total distribuído (${fmtSec(finalDistTotal)}) é diferente do tempo total dos itens (${fmtSec(totalProdTime)}).` : "";
    const finalStart = finalDays[0].date;
    const finalEnd = finalDays[finalDays.length - 1].date;
    setConfirm({
      message: "Deseja concluir o pedido?" + mismatchWarning,
      onYes: () => {
        addClient(client);
        const cm = {}; demandItems.forEach(i => cm[i.code] = false);
        if (isEditing) { updateOrder(editingOrderId, { client, orderNumber, deliveryDate, productionStart: finalStart, productionEnd: finalEnd, productionDays: finalDays, items: demandItems, observations, itemsCompleted: { ...editingOrder.itemsCompleted, ...cm }, missingItems }); setEditingOrderId(null); }
        else { addOrder({ id: String(Date.now()), client, orderNumber, deliveryDate, productionStart: finalStart, productionEnd: finalEnd, productionDays: finalDays, items: demandItems, observations, status: "scheduled", itemsCompleted: cm, missingItems }); }
        setClient(""); setOrderNumber(""); setDeliveryDate(""); setProdStart(""); setProdEnd(""); setDemandItems([]); setObservations(""); setProductionDays([]); setDistMode("equal"); setMissingItems([]); setConfirm(null);
      }, onNo: () => setConfirm(null),
    });
  }

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <ConfirmDialog open={!!confirm} message={confirm?.message || ""} onYes={confirm?.onYes} onNo={confirm?.onNo} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>
          {isEditing ? "Editar Demanda" : "Demanda de Produção"}
        </h1>
        {isEditing && <Btn variant="ghost" onClick={() => { setEditingOrderId(null); setClient(""); setOrderNumber(""); setDeliveryDate(""); setProdStart(""); setProdEnd(""); setDemandItems([]); setObservations(""); setProductionDays([]); setDistMode("equal"); setMissingItems([]); }}>← Cancelar</Btn>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Field label="Cliente"><div style={{ position: "relative" }}>
          <input value={client} onChange={e => { setClient(e.target.value); setShowClientSugg(true); }} onBlur={() => setTimeout(() => setShowClientSugg(false), 200)} placeholder="Nome do cliente" style={inputStyle} />
          {showClientSugg && <SuggestionDropdown items={filteredClients} onSelect={c => { setClient(c); setShowClientSugg(false); }} renderLabel={c => c} />}
        </div></Field>
        <Field label="Pedido"><input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="Nº do pedido" style={inputStyle} /></Field>
        <Field label="Previsão de Entrega"><input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={inputStyle} /></Field>
        <Field label="Início de Produção"><input type="date" value={prodStart} onChange={e => handleProdStartChange(e.target.value)} style={inputStyle} /></Field>
        <Field label="Fim de Produção"><input type="date" value={prodEnd} onChange={e => handleProdEndChange(e.target.value)} style={inputStyle} /></Field>
      </div>

      {/* Add Item */}
      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, fontFamily: FH, letterSpacing: "0.04em", textTransform: "uppercase" }}>Adicionar Item</div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 2, position: "relative" }}>
            <label style={labelStyle}>Código</label>
            <input value={itemCode} onChange={e => { setItemCode(e.target.value.toUpperCase()); setShowCodeSugg(true); }} onBlur={() => setTimeout(() => setShowCodeSugg(false), 200)} placeholder="Ex: FLANGE-A1" style={inputStyle} />
            {showCodeSugg && <SuggestionDropdown items={filteredCodes} onSelect={i => { setItemCode(i.code); setShowCodeSugg(false); }} renderLabel={i => <><span style={{ fontWeight: 700 }}>{i.code}</span><span style={{ color: C.textMuted, marginLeft: 8 }}>{i.description}</span></>} />}
          </div>
          <div style={{ flex: 1 }}><label style={labelStyle}>Quantidade</label><input type="number" min="1" step="1" value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="Qtd" style={inputStyle} /></div>
          <Btn onClick={addItem} style={{ height: 42 }}>Confirmar</Btn>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FH, letterSpacing: "0.04em", textTransform: "uppercase" }}>Itens da Demanda</span>
          <div style={{ display: "flex", gap: 16, fontSize: 12, fontFamily: F }}>
            <span style={{ color: C.textMuted }}>Itens: <span style={{ color: C.red, fontWeight: 700 }}>{totalItems}</span></span>
            <span style={{ color: C.textMuted }}>Unidades: <span style={{ color: C.red, fontWeight: 700 }}>{totalUnits}</span></span>
            <span style={{ color: C.textMuted }}>Tempo: <span style={{ color: C.red, fontWeight: 700 }}>{fmtSec(totalProdTime)}</span></span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr 1fr 2fr 36px", padding: "8px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span>Código</span><span>Descrição</span><span>Qtd</span><span>Tempo Prod.</span><span></span>
        </div>
        <div style={{ maxHeight: 220, overflow: "auto" }}>
          {demandItems.length === 0 ? <div style={{ padding: 28, textAlign: "center", color: C.textDim, fontSize: 13, fontFamily: F }}>Nenhum item adicionado</div>
          : demandItems.map((item, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 3fr 1fr 2fr 36px", padding: "11px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: C.red }}>{item.code}</span>
              <span>{item.description}</span>
              <span>{item.quantity}</span>
              <span>{fmtSec(item.productionTime)}</span>
              <button onClick={() => removeItem(item.code)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Distribuição da Produção */}
      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, fontFamily: FH, letterSpacing: "0.04em", textTransform: "uppercase" }}>Distribuição da Produção</div>
        {(!prodStart || totalProdTime <= 0) ? (
          <div style={{ color: C.textDim, fontSize: 13, fontFamily: F }}>Escolha o início de produção e adicione itens para configurar a distribuição por dia.</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[["equal", "Dividir Igualmente"], ["maximo", "Máximo por Dia"], ["personalizado", "Personalizado"]].map(([id, label]) => (
                <button key={id} onClick={() => setDistMode(id)} style={{ padding: "9px 16px", borderRadius: 6, cursor: "pointer", border: distMode === id ? `2px solid ${C.red}` : `1px solid ${C.border}`, background: distMode === id ? C.redDim : C.darkInput, color: distMode === id ? C.red : C.textMuted, fontFamily: FH, fontSize: 12, fontWeight: 700 }}>
                  {label}
                </button>
              ))}
            </div>

            {distMode === "personalizado" && (
              <div style={{ marginBottom: 10 }}>
                <Btn variant="ghost" onClick={addCustomDay} style={{ padding: "7px 16px", fontSize: 12 }}>+ Adicionar Dia</Btn>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: distMode === "personalizado" ? "1fr 1fr 36px" : "1fr 1fr", padding: "8px 4px", fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>
              <span>Data</span><span>Tempo</span>{distMode === "personalizado" && <span />}
            </div>
            <div style={{ maxHeight: 220, overflow: "auto" }}>
              {productionDays.length === 0 ? (
                <div style={{ padding: 16, color: C.textDim, fontSize: 12, fontFamily: F }}>Nenhum dia configurado</div>
              ) : productionDays.map((pd, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: distMode === "personalizado" ? "1fr 1fr 36px" : "1fr 1fr", padding: "8px 4px", borderBottom: `1px solid ${C.border}`, alignItems: "center", fontSize: 13, color: C.text, fontFamily: F, gap: 8 }}>
                  {distMode === "personalizado" ? (
                    <input type="date" value={pd.date} onChange={e => updateCustomDayDate(idx, e.target.value)} style={{ ...inputStyle, padding: "7px 10px" }} />
                  ) : (
                    <span>{getDayName(pd.date)} — {fmtDateFull(pd.date)}</span>
                  )}
                  {distMode === "personalizado" ? (
                    <input value={pd._raw !== undefined ? pd._raw : fmtSec(pd.minutes)} onChange={e => updateCustomDayTime(idx, e.target.value)} placeholder="Ex: 2h30m" style={{ ...inputStyle, padding: "7px 10px" }} />
                  ) : (
                    <span style={{ color: C.red, fontWeight: 700 }}>{fmtSec(pd.minutes)}</span>
                  )}
                  {distMode === "personalizado" && (
                    <button onClick={() => removeCustomDay(idx)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14 }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, fontFamily: F, flexWrap: "wrap", gap: 8 }}>
              <span style={{ color: C.textMuted }}>Total alocado: <span style={{ color: distTotal === totalProdTime ? C.green : C.orange, fontWeight: 700 }}>{fmtSec(distTotal)}</span> de {fmtSec(totalProdTime)}</span>
              {distMode === "maximo" && prodEnd && <span style={{ color: C.textMuted }}>Fim recalculado: <span style={{ color: C.text, fontWeight: 700 }}>{fmtDateFull(prodEnd)}</span></span>}
            </div>
          </>
        )}
      </div>

      {/* Itens Faltantes — peças compradas/complementares, não fabricadas pela BVN */}
      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4, fontFamily: FH, letterSpacing: "0.04em", textTransform: "uppercase" }}>Itens Faltantes</div>
        <div style={{ fontSize: 12, color: C.textDim, fontFamily: F, marginBottom: 14 }}>Peças compradas/complementares que não passam por montagem — sem cadastro, sem tempo de produção.</div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Código</label>
            <input value={missingCode} onChange={e => setMissingCode(e.target.value.toUpperCase())} placeholder="Ex: PARAFUSO-M8" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Quantidade</label>
            <input type="number" min="1" step="1" value={missingQtyInput} onChange={e => setMissingQtyInput(e.target.value)} placeholder="Qtd" style={inputStyle} />
          </div>
          <Btn onClick={addMissingItem} style={{ height: 42 }}>Adicionar</Btn>
        </div>
        {missingItems.length > 0 && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 110px 36px", padding: "8px 4px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <span>Código</span><span>Qtd</span><span>Entregue</span><span></span>
            </div>
            {missingItems.map(m => (
              <div key={m.code} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 110px 36px", padding: "10px 4px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: C.orange }}>{m.code}</span>
                <span>{m.qty}</span>
                <button onClick={() => toggleMissingDelivered(m.code)} style={{ padding: "5px 12px", borderRadius: 5, border: "none", background: m.delivered ? C.greenDim : C.dangerDim, color: m.delivered ? C.green : C.danger, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700, width: "fit-content" }}>
                  {m.delivered ? "Sim" : "Não"}
                </button>
                <button onClick={() => removeMissingItem(m.code)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Field label="Observações"><textarea value={observations} onChange={e => setObservations(e.target.value)} rows={3} placeholder="Observações..." style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <Btn onClick={confirmOrder} style={{ width: "100%", padding: 14, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {isEditing ? "Salvar Alterações" : "Confirmar Pedido"}
      </Btn>
    </div>
  );
}

// ============================================================
// PAGE 2: CALENDÁRIO DE PRODUÇÃO
// ============================================================
function CalendarPage({ orders, updateOrder, calendarSettings, saveCalendarSettings, dayOverrides, saveDayOverrides, setEditingOrderId, setActivePage, logistics }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showDayConfig, setShowDayConfig] = useState(null);
  const [dayConfigHours, setDayConfigHours] = useState(8);
  const [dragOrder, setDragOrder] = useState(null);

  const startDate = addDays(getMonday(getToday()), weekOffset * 7);
  const daysOfWeek = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const dayLabels = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  function getWeeks() {
    const weeks = [];
    for (let w = 0; w < 4; w++) { const week = []; for (let d = 0; d < 6; d++) week.push(addDays(startDate, w * 7 + d)); weeks.push(week); }
    return weeks;
  }
  function getHoursForDay(ds) { if (dayOverrides[ds] !== undefined) return dayOverrides[ds]; return calendarSettings[getDayKey(ds)] ?? 8; }
  function getOrdersForDay(ds) {
    return orders.filter(o => {
      if (o.productionDays && o.productionDays.length > 0) return o.productionDays.some(pd => pd.date === ds);
      return o.productionStart === ds;
    });
  }
  function getOrderMinutesForDay(o, ds) {
    if (o.productionDays && o.productionDays.length > 0) { const pd = o.productionDays.find(p => p.date === ds); return pd ? pd.minutes : 0; }
    return o.productionStart === ds ? o.items.reduce((s, i) => s + i.productionTime, 0) : 0;
  }
  function getOccupation(ds) { const h = getHoursForDay(ds); if (h === 0) return 0; const m = getOrdersForDay(ds).reduce((s, o) => s + getOrderMinutesForDay(o, ds), 0); return Math.round((m / (h * 3600)) * 100); }
  function occColor(pct) { if (pct <= 60) return { bg: C.greenDim, text: C.green }; if (pct <= 75) return { bg: C.yellowDim, text: C.yellow }; if (pct <= 90) return { bg: C.orangeDim, text: C.orange }; return { bg: C.dangerDim, text: C.danger }; }
  function handleDrop(ds) { if (!dragOrder) return; updateOrder(dragOrder, { productionStart: ds }); setDragOrder(null); }

  const weeks = getWeeks();

  return (
    <div style={{ padding: 24, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Calendário de Produção</h1>
          <button onClick={() => setShowSettings(true)} style={{ width: 34, height: 34, borderRadius: 6, border: `1px solid ${C.border}`, background: C.darkCard, color: C.textMuted, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, fontSize: 11, fontFamily: FH, fontWeight: 700, letterSpacing: "0.04em" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.redDim, border: `2px solid ${C.red}` }} /><span style={{ color: C.textMuted }}>Ativo</span></span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.blueDim, border: `2px solid ${C.blue}` }} /><span style={{ color: C.textMuted }}>Pronto</span></span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.greenDim, border: `2px solid ${C.green}` }} /><span style={{ color: C.textMuted }}>Coletado</span></span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn variant="ghost" onClick={() => setWeekOffset(w => w - 4)}>◀</Btn>
            <Btn variant="ghost" onClick={() => setWeekOffset(0)} style={{ color: C.red }}>Hoje</Btn>
            <Btn variant="ghost" onClick={() => setWeekOffset(w => w + 4)}>▶</Btn>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 6 }}>
          {dayLabels.map((n, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em" }}>{n}</div>)}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 6 }}>
            {week.map((ds, di) => {
              const h = getHoursForDay(ds); const occ = getOccupation(ds); const oc = occColor(occ);
              const isToday = ds === getToday(); const isSat = di === 5;
              const off = isSat && !calendarSettings.saturdayEnabled && dayOverrides[ds] === undefined;
              return (
                <div key={di} onDragOver={e => { e.preventDefault(); e.currentTarget.style.boxShadow = `inset 0 0 0 2px ${C.red}`; }} onDragLeave={e => { e.currentTarget.style.boxShadow = "none"; }} onDrop={e => { e.preventDefault(); e.currentTarget.style.boxShadow = "none"; handleDrop(ds); }}
                  style={{ background: off ? C.dark : C.darkCard, borderRadius: 8, border: `1px solid ${isToday ? C.red : C.border}`, padding: 8, minHeight: 110, opacity: off ? 0.35 : 1, transition: "all 0.12s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: isToday ? C.red : C.text, fontFamily: FH }}>{fmtDate(ds)}</span>
                      {!off && h > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: oc.bg, color: oc.text, fontFamily: FH }}>{occ}%</span>}
                    </div>
                    <button onClick={() => { setShowDayConfig(ds); setDayConfigHours(getHoursForDay(ds)); }} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 13, padding: 0 }}>⋯</button>
                  </div>
                  {getOrdersForDay(ds).map(o => {
                    const logiData = (logistics || {})[String(o.id)] || {};
                    const isCollected = o.status === "completed" && logiData.collected;
                    const isCompleted = o.status === "completed" && !logiData.collected;
                    const cardBg = isCollected ? C.greenDim : isCompleted ? C.blueDim : C.redDim;
                    const cardBorder = isCollected ? C.green : isCompleted ? C.blue : C.red;
                    const clientColor = isCollected ? C.green : isCompleted ? C.blue : C.red;
                    return (
                      <div key={o.id} draggable onDragStart={() => setDragOrder(o.id)} onDoubleClick={() => { setEditingOrderId(o.id); setActivePage("demand"); }}
                        style={{ padding: "5px 8px", borderRadius: 5, background: cardBg, cursor: "grab", fontSize: 10, fontFamily: F, color: C.text, fontWeight: 600, borderLeft: `3px solid ${cardBorder}`, marginBottom: 3, transition: "transform 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                        <span style={{ fontWeight: 800, color: clientColor }}>{o.client}</span>
                        <span style={{ color: C.textMuted, marginLeft: 5 }}>#{o.orderNumber}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Configurações do Calendário">
        {daysOfWeek.map((k, i) => (
          <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: C.text, fontSize: 14, fontFamily: F, fontWeight: 600 }}>{dayLabels[i]}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="number" min="0" max="24" value={calendarSettings[k]} onChange={e => saveCalendarSettings({ ...calendarSettings, [k]: parseInt(e.target.value) || 0 })} style={{ ...inputStyle, width: 65, textAlign: "center" }} />
              <span style={{ color: C.textMuted, fontSize: 12, fontFamily: F }}>h</span>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <span style={{ color: C.text, fontSize: 14, fontFamily: F, fontWeight: 600 }}>Sábado é dia útil?</span>
          <button onClick={() => { const v = !calendarSettings.saturdayEnabled; saveCalendarSettings({ ...calendarSettings, saturdayEnabled: v, sabado: v ? 4 : 0 }); }}
            style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: calendarSettings.saturdayEnabled ? C.green : C.darkInput, color: calendarSettings.saturdayEnabled ? "#fff" : C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 13, fontWeight: 700 }}>
            {calendarSettings.saturdayEnabled ? "Sim" : "Não"}
          </button>
        </div>
      </Modal>

      <Modal open={!!showDayConfig} onClose={() => setShowDayConfig(null)} title={`Configurar ${showDayConfig ? fmtDateFull(showDayConfig) : ""}`} width={360}>
        <Field label="Horas produtivas"><input type="number" min="0" max="24" value={dayConfigHours} onChange={e => setDayConfigHours(parseInt(e.target.value) || 0)} style={inputStyle} /></Field>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => { if (showDayConfig) { const c = { ...dayOverrides }; delete c[showDayConfig]; saveDayOverrides(c); } setShowDayConfig(null); }}>Restaurar</Btn>
          <Btn onClick={() => { if (showDayConfig) saveDayOverrides({ ...dayOverrides, [showDayConfig]: dayConfigHours }); setShowDayConfig(null); }}>Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// DROP ZONE — extracted to module level to prevent remount on each drag/state change
// ============================================================
function DropZone({ title, zone, items, color, onDragStart, onDrop, onSelect, onEdit }) {
  return (
    <div onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = color; }} onDragLeave={e => { e.currentTarget.style.borderColor = C.border; }} onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.border; onDrop(zone); }}
      style={{ flex: 1, background: C.dark, borderRadius: 10, border: `2px dashed ${C.border}`, padding: 14, minHeight: 170, transition: "border-color 0.2s" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color, marginBottom: 10, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />{title}
        <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginLeft: "auto" }}>{items.length}</span>
      </div>
      {items.map(o => (
        <div key={o.id} draggable onDragStart={() => onDragStart(o.id)} onClick={() => zone === "executing" && onSelect(o.id)}
          onDoubleClick={() => onEdit(o.id)}
          style={{ padding: "10px 14px", borderRadius: 8, background: C.darkCard, border: `1px solid ${C.border}`, cursor: "grab", marginBottom: 6, transition: "transform 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}>
          <div style={{ fontWeight: 800, color: C.text, fontSize: 13, fontFamily: F }}>{o.client}</div>
          <div style={{ color: C.textMuted, fontSize: 11, fontFamily: F, marginTop: 2 }}>#{o.orderNumber}</div>
        </div>
      ))}
      {items.length === 0 && <div style={{ color: C.textDim, fontSize: 12, textAlign: "center", fontFamily: F, padding: 16 }}>Arraste pedidos aqui</div>}
    </div>
  );
}

// ============================================================
// PAGE 3: DEMANDAS EM ABERTO
// ============================================================
function OpenDemandsPage({ orders, updateOrder, setEditingOrderId, setActivePage, logistics, saveLogistics }) {
  const today = getToday(); const tomorrow = getTomorrow();
  const [selectedExec, setSelectedExec] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [deliverModal, setDeliverModal] = useState(null); // { orderId, hasMissing, location }
  const [missingCode, setMissingCode] = useState("");
  const [missingQtyInput, setMissingQtyInput] = useState("");

  function isOrderForDay(o, day) {
    if (o.productionDays && o.productionDays.length > 0) return o.productionDays.some(pd => pd.date === day);
    return o.productionStart === day;
  }
  const todayOrders = orders.filter(o => isOrderForDay(o, today) && o.status !== "executing" && o.status !== "completed");
  const executingOrders = orders.filter(o => o.status === "executing");
  const tomorrowOrders = orders.filter(o => isOrderForDay(o, tomorrow) && o.status !== "executing" && o.status !== "completed");

  function moveOrder(id, target) {
    if (target === "executing") updateOrder(id, { status: "executing" });
    else if (target === "today") updateOrder(id, { status: "scheduled", productionStart: today });
    else if (target === "tomorrow") updateOrder(id, { status: "scheduled", productionStart: tomorrow });
  }
  function handleDrop(zone) { if (!dragItem) return; moveOrder(dragItem, zone); setDragItem(null); }
  function toggleItem(orderId, code) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    updateOrder(orderId, { itemsCompleted: { ...order.itemsCompleted, [code]: !order.itemsCompleted[code] } });
  }
  function allDone(o) { return o.items.every(i => o.itemsCompleted[i.code]); }
  function addMissingItem(orderId) {
    const code = missingCode.trim().toUpperCase();
    if (!code) return;
    const qty = parseInt(missingQtyInput);
    if (!qty || qty < 1) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const current = order.missingItems || [];
    const existing = current.find(m => m.code === code);
    const updated = existing ? current.map(m => m.code === code ? { ...m, qty: m.qty + qty } : m) : [...current, { code, qty, delivered: false }];
    updateOrder(orderId, { missingItems: updated });
    setMissingCode(""); setMissingQtyInput("");
  }
  function removeMissingItem(orderId, code) {
    const order = orders.find(o => o.id === orderId); if (!order) return;
    updateOrder(orderId, { missingItems: (order.missingItems || []).filter(m => m.code !== code) });
  }
  function toggleMissingDelivered(orderId, code) {
    const order = orders.find(o => o.id === orderId); if (!order) return;
    updateOrder(orderId, { missingItems: (order.missingItems || []).map(m => m.code === code ? { ...m, delivered: !m.delivered } : m) });
  }
  function deliverOrder(id) {
    const order = orders.find(o => o.id === id);
    const hasMissing = order && order.items.length > 0 && !order.items.every(i => order.itemsCompleted[i.code]);
    setDeliverModal({ orderId: id, hasMissing, location: "" });
  }
  function confirmDeliver() {
    if (!deliverModal || !deliverModal.location.trim()) return;
    const { orderId, location } = deliverModal;
    const today = getToday();
    updateOrder(orderId, { status: "completed" });
    const existing = (logistics || {})[String(orderId)] || {};
    if (saveLogistics) saveLogistics({ ...(logistics || {}), [String(orderId)]: { ...existing, completionDate: today, location: location.trim() } });
    setSelectedExec(null);
    setDeliverModal(null);
  }

  const execOrder = selectedExec ? orders.find(o => o.id === selectedExec) : (executingOrders[0] || null);
  const totalProd = execOrder ? execOrder.items.reduce((s, i) => s + i.productionTime, 0) : 0;
  const doneProd = execOrder ? execOrder.items.filter(i => execOrder.itemsCompleted[i.code]).reduce((s, i) => s + i.productionTime, 0) : 0;

  const editOrder = useCallback((id) => { setEditingOrderId(id); setActivePage("demand"); }, [setEditingOrderId, setActivePage]);

  return (
    <div style={{ padding: 24, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Modal open={!!deliverModal} onClose={() => setDeliverModal(null)} title="Confirmar Entrega" width={440}>
        {deliverModal && (
          <div>
            {deliverModal.hasMissing && (
              <div style={{ padding: "10px 14px", borderRadius: 6, background: C.yellowDim, color: C.yellow, fontSize: 13, fontFamily: F, marginBottom: 16, border: `1px solid ${C.yellow}30` }}>
                ⚠ Alguns itens não foram concluídos. Eles ficarão registrados como faltantes na Logística.
              </div>
            )}
            <Field label="Localização no estoque">
              <input value={deliverModal.location} onChange={e => setDeliverModal({ ...deliverModal, location: e.target.value })} placeholder="Ex: EXP-2 E-09" style={inputStyle} autoFocus />
            </Field>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setDeliverModal(null)} style={{ padding: "10px 24px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 600 }}>Cancelar</button>
              <button onClick={confirmDeliver} disabled={!deliverModal.location.trim()} style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: C.green, color: "#fff", cursor: deliverModal.location.trim() ? "pointer" : "not-allowed", opacity: deliverModal.location.trim() ? 1 : 0.5, fontFamily: FH, fontSize: 14, fontWeight: 700 }}>✓ Confirmar Entrega</button>
            </div>
          </div>
        )}
      </Modal>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Demandas em Aberto</h1>
        <span style={{ fontSize: 13, color: C.textMuted, fontFamily: F }}>{getDayName(today)} — {fmtDateFull(today)}</span>
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
        <DropZone title="Programado Hoje" zone="today" items={todayOrders} color={C.red} onDragStart={setDragItem} onDrop={handleDrop} onSelect={setSelectedExec} onEdit={editOrder} />
        <DropZone title="Em Execução" zone="executing" items={executingOrders} color={C.green} onDragStart={setDragItem} onDrop={handleDrop} onSelect={setSelectedExec} onEdit={editOrder} />
        <DropZone title="Programado Amanhã" zone="tomorrow" items={tomorrowOrders} color={C.steel} onDragStart={setDragItem} onDrop={handleDrop} onSelect={setSelectedExec} onEdit={editOrder} />
      </div>
      {execOrder && execOrder.status === "executing" && (
        <div style={{ flex: 1, background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            {[["Cliente", execOrder.client, C.text], ["Pedido", "#" + execOrder.orderNumber, C.red], ["Início", fmtDateFull(execOrder.productionStart), C.text], ["Fim", fmtDateFull(execOrder.productionEnd), C.text], ["Entrega", fmtDateFull(execOrder.deliveryDate), C.text], ["Restante", fmtSec(totalProd - doneProd), C.yellow]].map(([l, v, c]) => (
              <div key={l}><div style={{ fontSize: 10, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{l}</div><div style={{ fontSize: 14, fontWeight: 800, color: c, fontFamily: FH }}>{v}</div></div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr 1fr 1.5fr", padding: "8px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <span>Código</span><span>Descrição</span><span>Qtd</span><span>Concluído</span>
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            {execOrder.items.map((item, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 3fr 1fr 1.5fr", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center", opacity: execOrder.itemsCompleted[item.code] ? 0.45 : 1 }}>
                <span style={{ fontWeight: 700, color: C.red }}>{item.code}</span>
                <span>{item.description}</span>
                <span>{item.quantity}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => toggleItem(execOrder.id, item.code)} style={{ padding: "5px 14px", borderRadius: 5, border: "none", background: execOrder.itemsCompleted[item.code] ? C.green : C.darkInput, color: execOrder.itemsCompleted[item.code] ? "#fff" : C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 12, fontWeight: 700 }}>Sim</button>
                  <button onClick={() => { if (execOrder.itemsCompleted[item.code]) toggleItem(execOrder.id, item.code); }} style={{ padding: "5px 14px", borderRadius: 5, border: "none", background: !execOrder.itemsCompleted[item.code] ? C.dangerDim : C.darkInput, color: !execOrder.itemsCompleted[item.code] ? C.danger : C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 12, fontWeight: 700 }}>Não</button>
                </div>
              </div>
            ))}
          </div>

          {/* Itens Faltantes — peças compradas/complementares */}
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, background: C.dark }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Itens Faltantes</div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 10 }}>
              <input value={missingCode} onChange={e => setMissingCode(e.target.value.toUpperCase())} placeholder="Código" style={{ ...inputStyle, flex: 2, padding: "8px 12px" }} />
              <input type="number" min="1" value={missingQtyInput} onChange={e => setMissingQtyInput(e.target.value)} placeholder="Qtd" style={{ ...inputStyle, flex: 1, padding: "8px 12px" }} />
              <Btn onClick={() => addMissingItem(execOrder.id)} style={{ height: 36, padding: "0 18px", fontSize: 12 }}>Adicionar</Btn>
            </div>
            {(execOrder.missingItems || []).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {execOrder.missingItems.map(m => (
                  <div key={m.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 6, background: C.darkCard, border: `1px solid ${C.border}` }}>
                    <span style={{ fontWeight: 700, color: C.orange, fontFamily: FH, fontSize: 12, flex: 2 }}>{m.code}</span>
                    <span style={{ color: C.textMuted, fontSize: 12, flex: 1 }}>Qtd {m.qty}</span>
                    <button onClick={() => toggleMissingDelivered(execOrder.id, m.code)} style={{ padding: "4px 12px", borderRadius: 5, border: "none", background: m.delivered ? C.greenDim : C.dangerDim, color: m.delivered ? C.green : C.danger, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>
                      {m.delivered ? "Entregue" : "Pendente"}
                    </button>
                    <button onClick={() => removeMissingItem(execOrder.id, m.code)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 13 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}` }}>
            <Btn onClick={() => deliverOrder(execOrder.id)}
              style={{ width: "100%", padding: 14, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.06em", background: allDone(execOrder) ? C.green : C.yellow, color: "#fff" }}>
              {allDone(execOrder) ? "Entregar Demanda" : "⚠ Entregar com Faltantes"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE 4: CADASTRO DE ITENS
// ============================================================
function ItemsPage({ registeredItems, addItem, updateItem, deleteItem }) {
  const [code, setCode] = useState(""); const [desc, setDesc] = useState(""); const [time, setTime] = useState("");
  const [search, setSearch] = useState(""); const [editCode, setEditCode] = useState(null); // código original em edição (não índice)
  const [confirm, setConfirm] = useState(null);
  const filtered = registeredItems.filter(i => i.code.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()));

  function saveItem() {
    if (!code || !desc || !time) return alert("Preencha todos os campos.");
    const secs = parseTimeStr(time); if (!secs || secs < 1) return alert("Tempo inválido. Use um formato como 15m30s ou 1h23m45s.");
    if (editCode !== null) {
      updateItem(editCode, { code: code.toUpperCase(), description: desc, productionTime: secs });
      setEditCode(null);
    } else {
      if (registeredItems.find(i => i.code === code.toUpperCase())) return alert("Código já cadastrado.");
      addItem({ code: code.toUpperCase(), description: desc, productionTime: secs });
    }
    setCode(""); setDesc(""); setTime("");
  }

  function requestDelete(itemCode) {
    setConfirm({
      message: `Excluir o item "${itemCode}" do catálogo? Esta ação não pode ser desfeita.`,
      onYes: () => { deleteItem(itemCode); setConfirm(null); },
      onNo: () => setConfirm(null),
    });
  }

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <ConfirmDialog open={!!confirm} message={confirm?.message || ""} onYes={confirm?.onYes} onNo={confirm?.onNo} />
      <h1 style={{ margin: "0 0 28px", fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Cadastro de Itens</h1>
      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 24, marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 14, marginBottom: 14 }}>
          <Field label="Código"><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex: FLANGE-A1" style={inputStyle} /></Field>
          <Field label="Descrição"><input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição completa" style={inputStyle} /></Field>
          <Field label="Tempo de Produção"><input value={time} onChange={e => setTime(e.target.value)} placeholder="Ex: 15m30s ou 1h23m45s" style={inputStyle} /></Field>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={saveItem}>{editCode !== null ? "Atualizar" : "Salvar"}</Btn>
          {editCode !== null && <Btn variant="ghost" onClick={() => { setEditCode(null); setCode(""); setDesc(""); setTime(""); }}>Cancelar</Btn>}
        </div>
      </div>
      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Itens Cadastrados ({registeredItems.length})</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." style={{ ...inputStyle, width: 200 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 4fr 1.5fr 70px", padding: "8px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span>Código</span><span>Descrição</span><span>Tempo</span><span></span>
        </div>
        <div style={{ maxHeight: 380, overflow: "auto" }}>
          {filtered.map((item, idx) => {
            return (
              <div key={item.code} style={{ display: "grid", gridTemplateColumns: "2fr 4fr 1.5fr 70px", padding: "11px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: C.red }}>{item.code}</span>
                <span>{item.description}</span>
                <span>{fmtSec(item.productionTime)}</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => { setCode(item.code); setDesc(item.description); setTime(fmtSec(item.productionTime)); setEditCode(item.code); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13 }}>✎</button>
                  <button onClick={() => requestDelete(item.code)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 13 }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KPI CARD — extracted to module level to prevent remount on each render
// ============================================================
function KPI({ label, value, sub, color = C.red, icon }) {
  return (
    <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 22, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -12, right: -8, fontSize: 56, opacity: 0.06, color, fontWeight: 900 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color, fontFamily: FH, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textMuted, fontFamily: F, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ============================================================
// PAGE 5: RELATÓRIOS
// ============================================================
function ReportsPage({ orders, registeredItems, calendarSettings, dayOverrides }) {
  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState("");
  const today = getToday();

  function filterByPeriod(list) {
    if (period === "all") return list;
    if (period === "custom" && startDate && endDate) return list.filter(o => o.productionStart >= startDate && o.productionStart <= endDate);
    if (period === "week") return list.filter(o => o.productionStart >= addDays(today, -7) && o.productionStart <= today);
    if (period === "month") return list.filter(o => o.productionStart >= addDays(today, -30) && o.productionStart <= today);
    return list;
  }

  const filtered = filterByPeriod(orders);
  const completed = filtered.filter(o => o.status === "completed");
  const executing = filtered.filter(o => o.status === "executing");
  const scheduled = filtered.filter(o => o.status === "scheduled");
  const overdue = filtered.filter(o => o.status !== "completed" && o.deliveryDate < today);
  const totalUnits = filtered.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);
  const totalMin = filtered.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.productionTime, 0), 0);

  const clientMap = {}; filtered.forEach(o => { if (!clientMap[o.client]) clientMap[o.client] = { orders: 0, units: 0, minutes: 0 }; clientMap[o.client].orders++; clientMap[o.client].units += o.items.reduce((s, i) => s + i.quantity, 0); clientMap[o.client].minutes += o.items.reduce((s, i) => s + i.productionTime, 0); });
  const clientStats = Object.entries(clientMap).sort((a, b) => b[1].minutes - a[1].minutes);

  const itemMap = {}; filtered.forEach(o => { o.items.forEach(i => { if (!itemMap[i.code]) itemMap[i.code] = { code: i.code, description: i.description, quantity: 0, minutes: 0 }; itemMap[i.code].quantity += i.quantity; itemMap[i.code].minutes += i.productionTime; }); });
  const itemStats = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);

  function getOrderSecondsForDay(o, dt) {
    if (o.productionDays && o.productionDays.length > 0) { const pd = o.productionDays.find(p => p.date === dt); return pd ? pd.minutes : 0; }
    return o.productionStart === dt ? o.items.reduce((s, i) => s + i.productionTime, 0) : 0;
  }
  const occDays = []; for (let d = 0; d < 14; d++) { const dt = addDays(today, d); const dk = getDayKey(dt); const dw = new Date(dt + "T12:00:00").getDay(); if (dw === 0) continue; const h = dayOverrides[dt] !== undefined ? dayOverrides[dt] : (calendarSettings[dk] ?? 8); if (h === 0) continue; const m = orders.reduce((s, o) => s + getOrderSecondsForDay(o, dt), 0); occDays.push({ date: dt, occ: Math.round((m / (h * 3600)) * 100) }); }
  const avgOcc = occDays.length ? Math.round(occDays.reduce((s, d) => s + d.occ, 0) / occDays.length) : 0;

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Relatórios</h1>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "week", "month", "custom"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: "7px 14px", borderRadius: 6, border: period === p ? "none" : `1px solid ${C.border}`, background: period === p ? C.redDim : C.darkCard, color: period === p ? C.red : C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 12, fontWeight: 700 }}>
              {{ all: "Todos", week: "7 dias", month: "30 dias", custom: "Período" }[p]}
            </button>
          ))}
        </div>
      </div>

      {period === "custom" && (
        <div style={{ display: "flex", gap: 14, marginBottom: 20, padding: 14, background: C.darkCard, borderRadius: 8, border: `1px solid ${C.border}`, alignItems: "flex-end" }}>
          <Field label="De" style={{ marginBottom: 0 }}><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Até" style={{ marginBottom: 0 }}><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} /></Field>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <KPI label="Total Pedidos" value={filtered.length} sub={`${completed.length} concluídos`} icon="📋" />
        <KPI label="Unidades" value={totalUnits.toLocaleString("pt-BR")} color={C.steel} icon="📦" />
        <KPI label="Tempo Produção" value={fmtSec(totalMin)} color={C.green} icon="⏱" />
        <KPI label="Atrasados" value={overdue.length} sub={overdue.length ? "Atenção" : "Nenhum"} color={overdue.length ? C.danger : C.green} icon="⚠" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        {/* Status */}
        <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Status dos Pedidos</h3>
          {[["Programados", scheduled.length, C.red], ["Em Execução", executing.length, C.yellow], ["Concluídos", completed.length, C.green], ["Atrasados", overdue.length, C.danger]].map(([l, n, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} /><span style={{ fontSize: 13, color: C.text, fontFamily: F }}>{l}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 100, height: 5, background: C.darkInput, borderRadius: 3, overflow: "hidden" }}><div style={{ width: filtered.length ? `${(n / filtered.length) * 100}%` : "0%", height: "100%", background: c, borderRadius: 3 }} /></div>
                <span style={{ fontSize: 15, fontWeight: 900, color: c, fontFamily: FH, width: 28, textAlign: "right" }}>{n}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Occupation */}
        <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Ocupação Próximos Dias</h3>
            <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 5, background: avgOcc <= 60 ? C.greenDim : avgOcc <= 75 ? C.yellowDim : avgOcc <= 90 ? C.orangeDim : C.dangerDim, color: avgOcc <= 60 ? C.green : avgOcc <= 75 ? C.yellow : avgOcc <= 90 ? C.orange : C.danger, fontFamily: FH }}>Média: {avgOcc}%</span>
          </div>
          {occDays.slice(0, 8).map((d, i) => {
            const c = d.occ <= 60 ? C.green : d.occ <= 75 ? C.yellow : d.occ <= 90 ? C.orange : C.danger;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 50, fontSize: 12, color: C.textMuted, fontFamily: F, textAlign: "right", flexShrink: 0 }}>{fmtDate(d.date)}</span>
                <div style={{ flex: 1, height: 20, background: C.darkInput, borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${Math.min(d.occ, 100)}%`, height: "100%", background: c, borderRadius: 4 }} /></div>
                <span style={{ width: 40, fontSize: 12, fontWeight: 800, color: c, fontFamily: FH, textAlign: "right" }}>{d.occ}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rankings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}` }}><h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Ranking por Cliente</h3></div>
          <div style={{ display: "grid", gridTemplateColumns: "28px 2fr 1fr 1fr 1.5fr", padding: "8px 22px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em" }}><span>#</span><span>Cliente</span><span>Ped.</span><span>Un.</span><span>Tempo</span></div>
          <div style={{ maxHeight: 220, overflow: "auto" }}>
            {clientStats.map(([n, d], i) => (
              <div key={n} style={{ display: "grid", gridTemplateColumns: "28px 2fr 1fr 1fr 1.5fr", padding: "10px 22px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center" }}>
                <span style={{ fontWeight: 900, color: i === 0 ? C.yellow : C.textDim, fontSize: 14 }}>{i + 1}</span>
                <span style={{ fontWeight: 700 }}>{n}</span><span>{d.orders}</span><span>{d.units}</span>
                <span style={{ color: C.red, fontWeight: 700 }}>{fmtSec(d.minutes)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}` }}><h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Itens Mais Produzidos</h3></div>
          <div style={{ display: "grid", gridTemplateColumns: "28px 1.5fr 2.5fr 1fr 1.5fr", padding: "8px 22px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em" }}><span>#</span><span>Código</span><span>Descrição</span><span>Qtd</span><span>Tempo</span></div>
          <div style={{ maxHeight: 220, overflow: "auto" }}>
            {itemStats.map((it, i) => (
              <div key={it.code} style={{ display: "grid", gridTemplateColumns: "28px 1.5fr 2.5fr 1fr 1.5fr", padding: "10px 22px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center" }}>
                <span style={{ fontWeight: 900, color: i === 0 ? C.yellow : C.textDim, fontSize: 14 }}>{i + 1}</span>
                <span style={{ fontWeight: 700, color: C.red }}>{it.code}</span>
                <span style={{ fontSize: 12 }}>{it.description}</span><span>{it.quantity}</span>
                <span style={{ color: C.steel, fontWeight: 700 }}>{fmtSec(it.minutes)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {overdue.length > 0 && (
        <div style={{ marginTop: 24, background: C.darkCard, borderRadius: 10, border: `1px solid ${C.danger}30`, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, background: C.dangerDim }}><h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.danger, fontFamily: FH }}>⚠ Pedidos Atrasados</h3></div>
          {overdue.map(o => {
            const late = Math.ceil((new Date(today) - new Date(o.deliveryDate)) / 86400000);
            return (
              <div key={o.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1.5fr 1fr", padding: "11px 22px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>{o.client}</span><span style={{ color: C.red }}>#{o.orderNumber}</span>
                <span>{fmtDateFull(o.deliveryDate)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: o.status === "executing" ? C.yellowDim : C.redDim, color: o.status === "executing" ? C.yellow : C.red, width: "fit-content" }}>{o.status === "executing" ? "Executando" : "Programado"}</span>
                <span style={{ fontWeight: 900, color: C.danger }}>{late}d</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE 6: EXPORTAÇÃO
// ============================================================
function ExportPage({ orders, registeredItems }) {
  const [exportType, setExportType] = useState("orders");
  const [format, setFormat] = useState("csv");
  const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exportSuccess, setExportSuccess] = useState(null);

  function esc(v) { const s = String(v ?? ""); return (s.includes(",") || s.includes('"') || s.includes("\n")) ? '"' + s.replace(/"/g, '""') + '"' : s; }

  function getFiltered() {
    let r = [...orders];
    if (statusFilter !== "all") r = r.filter(o => o.status === statusFilter);
    if (startDate) r = r.filter(o => o.productionStart >= startDate);
    if (endDate) r = r.filter(o => o.productionStart <= endDate);
    return r;
  }

  function genCSV() {
    const data = exportType === "items" ? null : getFiltered();
    if (exportType === "items") {
      const rows = [["Código", "Descrição", "Tempo (seg)", "Tempo"]];
      registeredItems.forEach(i => rows.push([i.code, i.description, i.productionTime, fmtSec(i.productionTime)]));
      return rows.map(r => r.map(esc).join(",")).join("\n");
    }
    if (exportType === "orders") {
      const rows = [["Cliente", "Pedido", "Status", "Entrega", "Início", "Fim", "Itens", "Unidades", "Tempo (seg)", "Obs"]];
      data.forEach(o => rows.push([o.client, o.orderNumber, o.status, o.deliveryDate, o.productionStart, o.productionEnd, o.items.length, o.items.reduce((s, i) => s + i.quantity, 0), o.items.reduce((s, i) => s + i.productionTime, 0), o.observations || ""]));
      return rows.map(r => r.map(esc).join(",")).join("\n");
    }
    if (exportType === "order-detail") {
      const rows = [["Cliente", "Pedido", "Status", "Código", "Descrição", "Qtd", "Tempo (seg)", "Concluído"]];
      data.forEach(o => o.items.forEach(i => rows.push([o.client, o.orderNumber, o.status, i.code, i.description, i.quantity, i.productionTime, o.itemsCompleted?.[i.code] ? "Sim" : "Não"])));
      return rows.map(r => r.map(esc).join(",")).join("\n");
    }
    // report
    const rows = [["RELATÓRIO DE PRODUÇÃO"], ["Gerado", new Date().toLocaleString("pt-BR")], [], ["Resumo"], ["Total Pedidos", data.length], ["Concluídos", data.filter(o => o.status === "completed").length], ["Em Execução", data.filter(o => o.status === "executing").length], ["Programados", data.filter(o => o.status === "scheduled").length], ["Unidades", data.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0)], ["Tempo Total (seg)", data.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.productionTime, 0), 0)]];
    return rows.map(r => r.map(esc).join(",")).join("\n");
  }

  function genJSON() {
    if (exportType === "items") return JSON.stringify(registeredItems, null, 2);
    return JSON.stringify(getFiltered().map(o => ({ ...o, totalUnits: o.items.reduce((s, i) => s + i.quantity, 0), totalMinutes: o.items.reduce((s, i) => s + i.productionTime, 0) })), null, 2);
  }

  function doExport() {
    const content = format === "csv" ? "\uFEFF" + genCSV() : genJSON();
    const ext = format === "csv" ? ".csv" : ".json";
    const names = { orders: "pedidos", "order-detail": "pedidos_detalhado", items: "itens", report: "relatorio" };
    const filename = (names[exportType] || "export") + ext;
    const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8;" : "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setExportSuccess(filename); setTimeout(() => setExportSuccess(null), 4000);
  }

  const preview = format === "csv" ? genCSV() : genJSON();
  const lines = preview.split("\n");
  const count = exportType === "items" ? registeredItems.length : getFiltered().length;

  const types = [
    { id: "orders", label: "Pedidos (Resumo)", desc: "Lista resumida com totais", icon: "📋" },
    { id: "order-detail", label: "Pedidos (Detalhado)", desc: "Cada item em linha separada", icon: "📑" },
    { id: "items", label: "Itens Cadastrados", desc: "Catálogo completo", icon: "📦" },
    { id: "report", label: "Relatório", desc: "Resumo gerencial", icon: "📊" },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 28px", fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Exportação de Dados</h1>

      <div style={{ marginBottom: 24 }}>
        <label style={{ ...labelStyle, marginBottom: 10 }}>O que exportar?</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {types.map(t => (
            <button key={t.id} onClick={() => setExportType(t.id)} style={{ padding: 18, borderRadius: 10, cursor: "pointer", textAlign: "left", background: exportType === t.id ? C.redDim : C.darkCard, border: exportType === t.id ? `2px solid ${C.red}` : `1px solid ${C.border}`, transition: "all 0.12s" }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: exportType === t.id ? C.red : C.text, fontFamily: FH }}>{t.label}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F, lineHeight: 1.4, marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 22 }}>
          <label style={{ ...labelStyle, marginBottom: 10 }}>Formato</label>
          {[{ id: "csv", label: "CSV", desc: "Excel / Google Sheets" }, { id: "json", label: "JSON", desc: "Integração sistemas" }].map(f => (
            <button key={f.id} onClick={() => setFormat(f.id)} style={{ width: "100%", padding: "12px 14px", borderRadius: 6, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, marginBottom: 8, background: format === f.id ? C.redDim : C.darkInput, border: format === f.id ? `1px solid ${C.red}40` : "1px solid transparent" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${format === f.id ? C.red : C.textDim}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {format === f.id && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.red }} />}
              </div>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: format === f.id ? C.red : C.text, fontFamily: FH }}>{f.label}</div><div style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>{f.desc}</div></div>
            </button>
          ))}
        </div>
        <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 22 }}>
          <label style={{ ...labelStyle, marginBottom: 10 }}>Filtros</label>
          {exportType !== "items" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
              <Field label="De" style={{ marginBottom: 0 }}><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} /></Field>
              <Field label="Até" style={{ marginBottom: 0 }}><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} /></Field>
              <Field label="Status" style={{ marginBottom: 0 }}><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}><option value="all">Todos</option><option value="scheduled">Programados</option><option value="executing">Em Execução</option><option value="completed">Concluídos</option></select></Field>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.darkInput, borderRadius: 6, marginTop: 8 }}>
            <span style={{ fontSize: 13, color: C.textMuted, fontFamily: F }}>Registros:</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: C.red, fontFamily: FH }}>{count}</span>
          </div>
        </div>
      </div>

      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: "12px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Preview</span>
          <span style={{ fontSize: 11, color: C.textDim, fontFamily: F }}>{lines.length} linhas · {format.toUpperCase()}</span>
        </div>
        <div style={{ padding: 14, maxHeight: 180, overflow: "auto", fontFamily: "monospace", fontSize: 11, color: C.textMuted, lineHeight: 1.6, whiteSpace: "pre", background: C.dark }}>
          {lines.slice(0, 25).join("\n")}{lines.length > 25 ? `\n\n... +${lines.length - 25} linhas` : ""}
        </div>
      </div>

      <Btn onClick={doExport} style={{ width: "100%", padding: 16, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        📤 Exportar {format.toUpperCase()}
      </Btn>

      {exportSuccess && (
        <div style={{ marginTop: 14, padding: "12px 18px", borderRadius: 8, background: C.greenDim, border: `1px solid ${C.green}30`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <span style={{ fontSize: 13, color: C.green, fontFamily: F, fontWeight: 700 }}>"{exportSuccess}" exportado!</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE 7: LOGÍSTICA
// ============================================================
function LogisticsPage({ orders, logistics, saveLogistics, updateOrder }) {
  const today = getToday();
  const completedOrders = orders.filter(o => o.status === "completed");
  const [confirm, setConfirm] = useState(null);
  const [faturarModal, setFaturarModal] = useState(null); // { orderId, carrier }
  const [editarModal, setEditarModal] = useState(null);   // { orderId, carrier, location, invoiceDate }
  const [localModal, setLocalModal] = useState(null);     // { orderId, location }

  function getLogi(orderId) {
    const d = logistics[String(orderId)] || {};
    return {
      location:       d.location       || "",
      invoiced:       d.invoiced       || false,
      invoiceDate:    d.invoiceDate    || "",
      carrier:        d.carrier        || d.collectionMethod || "",
      collected:      d.collected      || false,
      completionDate: d.completionDate || "",
    };
  }
  function updateLogi(orderId, changes) {
    const curr = getLogi(orderId);
    saveLogistics({ ...logistics, [String(orderId)]: { ...curr, ...changes } });
  }
  function hasNoMissingParts(o) {
    return (o.missingItems || []).every(m => m.delivered);
  }
  function getMissingParts(o) {
    return (o.missingItems || []).filter(m => !m.delivered);
  }

  const sortByDate = (a, b) => (b.deliveryDate || "").localeCompare(a.deliveryDate || "");
  const withMissing = completedOrders.filter(o => !hasNoMissingParts(o) && !getLogi(o.id).invoiced).sort(sortByDate);
  const notInvoiced = completedOrders.filter(o =>  hasNoMissingParts(o) && !getLogi(o.id).invoiced).sort(sortByDate);
  const invoiced    = completedOrders.filter(o => getLogi(o.id).invoiced && !getLogi(o.id).collected).sort(sortByDate);

  // Itens faltantes (peças compradas/complementares) — Seção 1
  function toggleMissingDelivered(orderId, code) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    updateOrder(orderId, { missingItems: (order.missingItems || []).map(m => m.code === code ? { ...m, delivered: !m.delivered } : m) });
  }
  const [addMissingFor, setAddMissingFor] = useState(null); // { orderId, code, qty }
  function confirmAddMissing() {
    if (!addMissingFor) return;
    const code = addMissingFor.code.trim().toUpperCase();
    const qty = parseInt(addMissingFor.qty);
    if (!code || !qty || qty < 1) return;
    const order = orders.find(o => o.id === addMissingFor.orderId);
    if (!order) return;
    const current = order.missingItems || [];
    const existing = current.find(m => m.code === code);
    const updated = existing ? current.map(m => m.code === code ? { ...m, qty: m.qty + qty } : m) : [...current, { code, qty, delivered: false }];
    updateOrder(addMissingFor.orderId, { missingItems: updated });
    setAddMissingFor(null);
  }

  // Faturar: abre modal (localização já foi definida na conclusão do pedido)
  function openFaturar(o) {
    const lg = getLogi(o.id);
    setFaturarModal({ orderId: o.id, carrier: lg.carrier });
  }
  function confirmFaturar() {
    if (!faturarModal) return;
    updateLogi(faturarModal.orderId, {
      invoiced: true,
      invoiceDate: today,
      carrier: faturarModal.carrier,
    });
    setFaturarModal(null);
  }

  // Definir/corrigir localização (seções 1 e 2 — antes do faturamento)
  function openLocal(o) {
    const lg = getLogi(o.id);
    setLocalModal({ orderId: o.id, location: lg.location });
  }
  function confirmLocal() {
    if (!localModal) return;
    updateLogi(localModal.orderId, { location: localModal.location });
    setLocalModal(null);
  }

  // Expedido: confirmação
  function requestExpedir(o) {
    setConfirm({
      message: `Confirmar expedição do pedido #${o.orderNumber} — ${o.client}? O pedido sairá da logística e ficará verde no calendário.`,
      onYes: () => { updateLogi(o.id, { collected: true }); setConfirm(null); },
      onNo: () => setConfirm(null),
    });
  }

  // Editar (seção 3 — corrigir transportadora/localização/data)
  function openEditar(o) {
    const lg = getLogi(o.id);
    setEditarModal({ orderId: o.id, carrier: lg.carrier, location: lg.location, invoiceDate: lg.invoiceDate });
  }
  function confirmEditar() {
    if (!editarModal) return;
    updateLogi(editarModal.orderId, { carrier: editarModal.carrier, location: editarModal.location, invoiceDate: editarModal.invoiceDate });
    setEditarModal(null);
  }

  const HDR = { padding: "8px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em", display: "grid", alignItems: "center" };
  const ROW = { padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, display: "grid", alignItems: "center" };

  const sectionTitle = (icon, title, color, count) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</h2>
      <span style={{ fontSize: 12, color: C.textMuted, fontFamily: F }}>({count})</span>
    </div>
  );

  const COLS2 = "90px 1.5fr 120px 120px 130px 110px";
  const COLS3 = "90px 1.8fr 1.5fr 1.5fr 130px 90px 60px";

  return (
    <div style={{ padding: 32, maxWidth: 1300, margin: "0 auto" }}>
      <ConfirmDialog open={!!confirm} message={confirm?.message || ""} onYes={confirm?.onYes} onNo={confirm?.onNo} />

      {/* ── MODAL FATURAR ───────────────────────────────────── */}
      <Modal open={!!faturarModal} onClose={() => setFaturarModal(null)} title="Faturar Pedido" width={500}>
        {faturarModal && (() => {
          const o = orders.find(x => x.id === faturarModal.orderId);
          if (!o) return null;
          return (
            <div>
              <div style={{ display: "flex", gap: 20, marginBottom: 22, padding: 14, background: C.dark, borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div><div style={{ fontSize: 10, color: C.textDim, fontFamily: FH, textTransform: "uppercase", fontWeight: 700 }}>Pedido</div><div style={{ fontSize: 15, fontWeight: 800, color: C.red, fontFamily: FH }}>#{o.orderNumber}</div></div>
                <div><div style={{ fontSize: 10, color: C.textDim, fontFamily: FH, textTransform: "uppercase", fontWeight: 700 }}>Cliente</div><div style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: FH }}>{o.client}</div></div>
                <div><div style={{ fontSize: 10, color: C.textDim, fontFamily: FH, textTransform: "uppercase", fontWeight: 700 }}>Prev. Entrega</div><div style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: FH }}>{fmtDateFull(o.deliveryDate)}</div></div>
              </div>
              <Field label="Transportadora">
                <input value={faturarModal.carrier} onChange={e => setFaturarModal({ ...faturarModal, carrier: e.target.value })} placeholder="Ex: São Miguel, Retirada cliente, Transportadora X" style={inputStyle} autoFocus />
              </Field>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setFaturarModal(null)} style={{ padding: "10px 24px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 600 }}>Cancelar</button>
                <button onClick={confirmFaturar} style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: C.green, color: "#fff", cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 700 }}>✓ Confirmar Faturamento</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── MODAL LOCALIZAÇÃO (Seções 1 e 2) ────────────────── */}
      <Modal open={!!localModal} onClose={() => setLocalModal(null)} title="Localização no Estoque" width={420}>
        {localModal && (
          <div>
            <Field label="Localização no estoque">
              <input value={localModal.location} onChange={e => setLocalModal({ ...localModal, location: e.target.value })} placeholder="Ex: EXP-2 E-09" style={inputStyle} autoFocus />
            </Field>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setLocalModal(null)} style={{ padding: "10px 24px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 600 }}>Cancelar</button>
              <button onClick={confirmLocal} style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: C.red, color: "#fff", cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 700 }}>Salvar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL EDITAR (Seção 3) ──────────────────────────── */}
      <Modal open={!!editarModal} onClose={() => setEditarModal(null)} title="Editar Informações" width={460}>
        {editarModal && (
          <div>
            <Field label="Transportadora">
              <input value={editarModal.carrier} onChange={e => setEditarModal({ ...editarModal, carrier: e.target.value })} placeholder="Transportadora ou forma de coleta" style={inputStyle} />
            </Field>
            <Field label="Localização no estoque">
              <input value={editarModal.location} onChange={e => setEditarModal({ ...editarModal, location: e.target.value })} placeholder="Ex: EXP-2 E-09" style={inputStyle} />
            </Field>
            <Field label="Data do Faturamento">
              <input type="date" value={editarModal.invoiceDate} onChange={e => setEditarModal({ ...editarModal, invoiceDate: e.target.value })} style={inputStyle} />
            </Field>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setEditarModal(null)} style={{ padding: "10px 24px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 600 }}>Cancelar</button>
              <button onClick={confirmEditar} style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: C.red, color: "#fff", cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 700 }}>Salvar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL ADICIONAR PEÇA FALTANTE (Seção 1) ─────────── */}
      <Modal open={!!addMissingFor} onClose={() => setAddMissingFor(null)} title="Adicionar Peça Faltante" width={420}>
        {addMissingFor && (
          <div>
            <Field label="Código">
              <input value={addMissingFor.code} onChange={e => setAddMissingFor({ ...addMissingFor, code: e.target.value.toUpperCase() })} placeholder="Ex: PARAFUSO-M8" style={inputStyle} autoFocus />
            </Field>
            <Field label="Quantidade">
              <input type="number" min="1" value={addMissingFor.qty} onChange={e => setAddMissingFor({ ...addMissingFor, qty: e.target.value })} placeholder="Qtd" style={inputStyle} />
            </Field>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setAddMissingFor(null)} style={{ padding: "10px 24px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 600 }}>Cancelar</button>
              <button onClick={confirmAddMissing} style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: C.red, color: "#fff", cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 700 }}>Adicionar</button>
            </div>
          </div>
        )}
      </Modal>

      <h1 style={{ margin: "0 0 28px", fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Logística</h1>

      {/* ── SEÇÃO 1: PRONTO COM PEÇAS FALTANTES ─────────── */}
      {withMissing.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          {sectionTitle("⚠", "Pronto com Peças Faltantes", C.danger, withMissing.length)}
          <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.danger}30`, overflow: "hidden" }}>
            {withMissing.map((o, idx) => {
              const lg = getLogi(o.id);
              const missing = getMissingParts(o);
              return (
                <div key={o.id} style={{ borderBottom: idx < withMissing.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  {/* cabeçalho do pedido */}
                  <div style={{ display: "grid", gridTemplateColumns: "90px 1.5fr 130px 130px 130px 32px", padding: "14px 20px", alignItems: "center", background: "rgba(239,68,68,0.05)", gap: 8 }}>
                    <span style={{ fontWeight: 800, color: C.red, fontFamily: FH, fontSize: 14 }}>#{o.orderNumber}</span>
                    <span style={{ fontWeight: 700, color: C.text, fontFamily: F, fontSize: 13 }}>{o.client}</span>
                    <div>
                      <div style={{ fontSize: 10, color: C.textDim, fontFamily: FH, textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Conclusão</div>
                      <span style={{ color: C.textMuted, fontSize: 12, fontFamily: F }}>{lg.completionDate ? fmtDateFull(lg.completionDate) : "—"}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.textDim, fontFamily: FH, textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Prev. Entrega</div>
                      <span style={{ color: C.textMuted, fontSize: 12, fontFamily: F }}>{fmtDateFull(o.deliveryDate)}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.textDim, fontFamily: FH, textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Localização</div>
                      <span style={{ color: lg.location ? C.text : C.textDim, fontSize: 12, fontFamily: F }}>{lg.location || "—"}</span>
                    </div>
                    <button onClick={() => openLocal(o)} title="Editar localização" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13 }}>✎</button>
                  </div>
                  {/* itens faltantes */}
                  <div style={{ padding: "0 20px 14px 36px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: C.danger, fontFamily: FH, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>
                        Peças Faltantes ({missing.length})
                      </span>
                      <button onClick={() => setAddMissingFor({ orderId: o.id, code: "", qty: "" })}
                        style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>
                        + Adicionar Peça
                      </button>
                    </div>
                    {missing.map(m => (
                      <div key={m.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 6, background: C.dark, border: `1px solid ${C.border}`, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: C.red, fontFamily: FH, fontSize: 12, flex: 2 }}>{m.code}</span>
                        <span style={{ color: C.textMuted, fontFamily: F, fontSize: 12, flex: 1 }}>Qtd {m.qty}</span>
                        <button onClick={() => toggleMissingDelivered(o.id, m.code)}
                          style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${C.green}55`, background: C.greenDim, color: C.green, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                          ✓ Marcar Entregue
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SEÇÃO 2: CONCLUÍDOS — AGUARDANDO FATURAMENTO ───── */}
      {notInvoiced.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          {sectionTitle("📋", "Concluídos — Aguardando Faturamento", C.yellow, notInvoiced.length)}
          <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ ...HDR, gridTemplateColumns: COLS2 }}>
              <span>Pedido</span><span>Cliente</span><span>Conclusão</span><span>Prev. Entrega</span><span>Localização</span><span />
            </div>
            {notInvoiced.map(o => {
              const lg = getLogi(o.id);
              return (
                <div key={o.id} style={{ ...ROW, gridTemplateColumns: COLS2 }}>
                  <span style={{ fontWeight: 800, color: C.red }}>#{o.orderNumber}</span>
                  <span style={{ fontWeight: 700 }}>{o.client}</span>
                  <span style={{ color: C.textMuted, fontSize: 12 }}>{lg.completionDate ? fmtDateFull(lg.completionDate) : "—"}</span>
                  <span style={{ color: C.textMuted, fontSize: 12 }}>{fmtDateFull(o.deliveryDate)}</span>
                  <span style={{ color: lg.location ? C.text : C.textDim, fontSize: 12 }}>{lg.location || "—"}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openFaturar(o)}
                      style={{ padding: "5px 14px", borderRadius: 5, border: `1px solid ${C.yellow}55`, background: C.yellowDim, color: C.yellow, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>
                      Faturar
                    </button>
                    <button onClick={() => openLocal(o)} title="Editar localização" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13 }}>✎</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SEÇÃO 3: FATURADOS — AGUARDANDO EXPEDIÇÃO ────────── */}
      <div style={{ marginBottom: 28 }}>
        {sectionTitle("✅", "Faturados — Aguardando Expedição", C.green, invoiced.length)}
        <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ ...HDR, gridTemplateColumns: COLS3 }}>
            <span>Pedido</span><span>Cliente</span><span>Transportadora</span><span>Localização</span><span>Dt. Faturamento</span><span>Expedido</span><span />
          </div>
          {invoiced.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: C.textDim, fontSize: 13, fontFamily: F }}>Nenhum pedido aguardando expedição</div>
          )}
          {invoiced.map(o => {
            const lg = getLogi(o.id);
            return (
              <div key={o.id} style={{ ...ROW, gridTemplateColumns: COLS3 }}>
                <span style={{ fontWeight: 800, color: C.red }}>#{o.orderNumber}</span>
                <span style={{ fontWeight: 700 }}>{o.client}</span>
                <span style={{ color: lg.carrier ? C.text : C.textDim, fontSize: 12 }}>{lg.carrier || "—"}</span>
                <span style={{ color: lg.location ? C.text : C.textDim, fontSize: 12 }}>{lg.location || "—"}</span>
                <span style={{ color: C.textMuted, fontSize: 12 }}>{lg.invoiceDate ? fmtDateFull(lg.invoiceDate) : "—"}</span>
                <button onClick={() => requestExpedir(o)}
                  style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${C.green}55`, background: C.greenDim, color: C.green, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>
                  Expedido
                </button>
                <button onClick={() => openEditar(o)}
                  style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>
                  ✎
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE: ITENS FALTANTES (consolidado — gestor e montador)
// ============================================================
function MissingItemsPage({ orders, updateOrder, setEditingOrderId, setActivePage }) {
  const rows = [];
  orders.forEach(o => {
    (o.missingItems || []).forEach(m => {
      if (!m.delivered) rows.push({ orderId: o.id, orderNumber: o.orderNumber, client: o.client, status: o.status, deliveryDate: o.deliveryDate, code: m.code, qty: m.qty });
    });
  });
  rows.sort((a, b) => (a.deliveryDate || "").localeCompare(b.deliveryDate || ""));

  const totalUnits = rows.reduce((s, r) => s + r.qty, 0);
  const distinctItems = new Set(rows.map(r => r.code)).size;
  const distinctOrders = new Set(rows.map(r => r.orderId)).size;

  const byItem = {};
  rows.forEach(r => {
    if (!byItem[r.code]) byItem[r.code] = { code: r.code, total: 0, orders: 0 };
    byItem[r.code].total += r.qty;
    byItem[r.code].orders += 1;
  });
  const itemStats = Object.values(byItem).sort((a, b) => b.total - a.total);

  function markDelivered(orderId, code) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    updateOrder(orderId, { missingItems: (order.missingItems || []).map(m => m.code === code ? { ...m, delivered: true } : m) });
  }

  const STATUS_LABEL = { scheduled: "Programado", executing: "Em Execução", completed: "Concluído" };
  const STATUS_COLOR = { scheduled: C.red, executing: C.yellow, completed: C.blue };

  const editOrder = (id) => { setEditingOrderId(id); setActivePage("demand"); };

  const COLS = "80px 1.3fr 110px 1.3fr 90px 100px 90px 32px";

  return (
    <div style={{ padding: 32, maxWidth: 1300, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 24px", fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Itens Faltantes</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        <KPI label="Unidades Faltantes" value={totalUnits.toLocaleString("pt-BR")} icon="📦" />
        <KPI label="Itens Distintos" value={distinctItems} color={C.steel} icon="🔧" />
        <KPI label="Pedidos Afetados" value={distinctOrders} color={C.yellow} icon="📋" />
      </div>

      {rows.length === 0 ? (
        <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 40, textAlign: "center", color: C.textDim, fontSize: 14, fontFamily: F }}>
          Nenhum item faltante registrado no momento.
        </div>
      ) : (
        <>
          <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 28 }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Faltas por Pedido</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: COLS, padding: "8px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Pedido</span><span>Cliente</span><span>Status</span><span>Código</span><span>Qtd</span><span>Entrega</span><span></span><span></span>
            </div>
            <div style={{ maxHeight: 420, overflow: "auto" }}>
              {rows.map((r, idx) => (
                <div key={r.orderId + r.code} style={{ display: "grid", gridTemplateColumns: COLS, padding: "10px 20px", borderBottom: idx < rows.length - 1 ? `1px solid ${C.border}` : "none", fontSize: 13, color: C.text, fontFamily: F, alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 800, color: C.red }}>#{r.orderNumber}</span>
                  <span style={{ fontWeight: 700 }}>{r.client}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 5, background: `${STATUS_COLOR[r.status] || C.steel}18`, color: STATUS_COLOR[r.status] || C.steel, fontFamily: FH, width: "fit-content", textTransform: "uppercase" }}>{STATUS_LABEL[r.status] || r.status}</span>
                  <span style={{ fontWeight: 700, color: C.orange }}>{r.code}</span>
                  <span>{r.qty}</span>
                  <span style={{ color: C.textMuted, fontSize: 12 }}>{fmtDateFull(r.deliveryDate)}</span>
                  <button onClick={() => markDelivered(r.orderId, r.code)} title="Marcar entregue" style={{ padding: "5px 8px", borderRadius: 5, border: `1px solid ${C.green}55`, background: C.greenDim, color: C.green, cursor: "pointer", fontFamily: FH, fontSize: 10, fontWeight: 700 }}>✓</button>
                  <button onClick={() => editOrder(r.orderId)} title="Abrir pedido" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13 }}>✎</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Faltante por Código (reposição)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "8px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Código</span><span>Qtd Total Faltante</span><span>Pedidos</span>
            </div>
            <div style={{ maxHeight: 300, overflow: "auto" }}>
              {itemStats.map(it => (
                <div key={it.code} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "11px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: C.orange }}>{it.code}</span>
                  <span style={{ color: C.orange, fontWeight: 800 }}>{it.total}</span>
                  <span>{it.orders}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// PAGE 8: USUÁRIOS (gestor only)
// ============================================================
function UsersPage({ users, addUser, updateUser, deleteUser, currentUser }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("montador");
  const [editUsername, setEditUsername] = useState(null);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  function saveUser() {
    if (!name || !role) return alert("Preencha nome e perfil.");
    if (editUsername !== null) {
      updateUser(editUsername, { name, role, ...(password ? { password } : {}) });
      setEditUsername(null);
    } else {
      if (!username || !password) return alert("Preencha todos os campos.");
      if (users.find(u => u.username === username)) return alert("Usuário já existe.");
      addUser({ username, password, name, role });
    }
    setName(""); setUsername(""); setPassword(""); setRole("montador");
  }

  function startEdit(u) {
    setEditUsername(u.username); setName(u.name); setUsername(u.username); setPassword(""); setRole(u.role);
  }

  function requestDelete(u) {
    if (u.username === currentUser.username) return alert("Você não pode excluir seu próprio usuário.");
    setConfirm({ message: `Excluir o usuário "${u.name}" (${u.username})?`, onYes: () => { deleteUser(u.username); setConfirm(null); }, onNo: () => setConfirm(null) });
  }

  const roleOptions = [
    { value: "gestor", label: "Gestor", desc: "Acesso total + gestão de usuários" },
    { value: "montador", label: "Montador", desc: "Produção, calendário, demandas, itens, logística" },
    { value: "vendedor", label: "Vendedor", desc: "Cadastra demandas, visualiza calendário" },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <ConfirmDialog open={!!confirm} message={confirm?.message || ""} onYes={confirm?.onYes} onNo={confirm?.onNo} />
      <h1 style={{ margin: "0 0 28px", fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Cadastro de Usuários</h1>

      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 24, marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Field label="Nome Completo">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do colaborador" style={inputStyle} />
          </Field>
          <Field label="Usuário (login)">
            <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} placeholder="Ex: joao.santos" style={inputStyle} disabled={editUsername !== null} />
          </Field>
          <Field label={editUsername !== null ? "Nova Senha (vazio = manter)" : "Senha"}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editUsername !== null ? "Deixe vazio para manter" : "Defina a senha"} style={inputStyle} />
          </Field>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Perfil de Acesso</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {roleOptions.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)} style={{ padding: "14px 16px", borderRadius: 8, cursor: "pointer", textAlign: "left", background: role === r.value ? C.redDim : C.darkInput, border: role === r.value ? `2px solid ${ROLE_COLORS[r.value]}` : `1px solid ${C.border}`, transition: "all 0.12s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: ROLE_COLORS[r.value] }} />
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: FH, color: role === r.value ? ROLE_COLORS[r.value] : C.text }}>{r.label}</span>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F, lineHeight: 1.4 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={saveUser}>{editUsername !== null ? "Atualizar" : "Cadastrar Usuário"}</Btn>
          {editUsername !== null && <Btn variant="ghost" onClick={() => { setEditUsername(null); setName(""); setUsername(""); setPassword(""); setRole("montador"); }}>Cancelar</Btn>}
        </div>
      </div>

      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Usuários ({users.length})</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." style={{ ...inputStyle, width: 200 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 2fr 1.5fr 80px", padding: "8px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span>Nome</span><span>Usuário</span><span>Perfil</span><span></span>
        </div>
        <div style={{ maxHeight: 400, overflow: "auto" }}>
          {filtered.map((u, idx) => {
            const rc = ROLE_COLORS[u.role] || C.steel;
            const isSelf = u.username === currentUser.username;
            return (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2.5fr 2fr 1.5fr 80px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center", background: isSelf ? "rgba(196,18,48,0.04)" : "transparent" }}>
                <div><span style={{ fontWeight: 700 }}>{u.name}</span>{isSelf && <span style={{ fontSize: 10, color: C.red, fontFamily: FH, marginLeft: 8, fontWeight: 700 }}>VOCÊ</span>}</div>
                <span style={{ color: C.textMuted }}>{u.username}</span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 5, background: `${rc}18`, color: rc, fontFamily: FH, display: "inline-block", width: "fit-content", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => startEdit(u)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13 }}>✎</button>
                  {!isSelf && <button onClick={() => requestDelete(u)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 13 }}>✕</button>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.textDim, fontSize: 13, fontFamily: F }}>Nenhum usuário encontrado</div>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: "12px 18px", borderRadius: 8, fontSize: 13, fontFamily: "'Barlow', sans-serif",
          fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          background: t.type === "error" ? "#EF4444" : t.type === "warning" ? "#EAB308" : "#22C55E",
          color: "#fff", maxWidth: 360, lineHeight: 1.4,
        }}>
          {t.type === "error" ? "⚠ " : "✓ "}{t.message}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// LOCAL STORAGE — Backup para funcionar sem conexão com Supabase
// Supabase free tier pausa projetos após 7 dias sem acesso.
// Esse cache garante que os dados não desaparecem quando isso ocorre.
// ============================================================
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.warn('localStorage cheio ou bloqueado:', e); } },
};
const LSK = {
  orders:   'pcp_bvn_orders',
  items:    'pcp_bvn_items',
  clients:  'pcp_bvn_clients',
  cal:      'pcp_bvn_cal',
  overrides:'pcp_bvn_overrides',
  logistics:'pcp_bvn_logistics',
  users:    'pcp_bvn_users',
  sync:     'pcp_bvn_lastsync',
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(defaultUsers);
  const [logistics, setLogistics] = useState({});
  const [activePage, setActivePage] = useState("demand");
  const [orders, setOrders] = useState([]);
  const [registeredItems, setRegisteredItems] = useState([]);
  const [clientHistory, setClientHistory] = useState([]);
  const [calendarSettings, setCalendarSettings] = useState(defaultCalSettings);
  const [dayOverrides, setDayOverrides] = useState({});
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const calendarSettingsRef = useRef(calendarSettings);
  const dayOverridesRef = useRef(dayOverrides);
  const offlineModeRef = useRef(false);
  const syncedRef = useRef(false); // ativa o espelho após a primeira carga
  useEffect(() => { calendarSettingsRef.current = calendarSettings; }, [calendarSettings]);
  useEffect(() => { dayOverridesRef.current = dayOverrides; }, [dayOverrides]);
  useEffect(() => { offlineModeRef.current = offlineMode; }, [offlineMode]);

  // Sincroniza estado para localStorage com debounce (evita sobrecarga)
  useEffect(() => {
    if (!syncedRef.current) return;
    const timer = setTimeout(() => {
      try {
        if (orders && orders.length >= 0) LS.set(LSK.orders, orders);
      } catch (e) { console.warn('Erro ao sincronizar orders:', e); }
    }, 800);
    return () => clearTimeout(timer);
  }, [orders]);

  useEffect(() => {
    if (!syncedRef.current) return;
    const timer = setTimeout(() => {
      try {
        if (registeredItems && registeredItems.length >= 0) LS.set(LSK.items, registeredItems);
      } catch (e) { console.warn('Erro ao sincronizar items:', e); }
    }, 800);
    return () => clearTimeout(timer);
  }, [registeredItems]);

  useEffect(() => {
    if (!syncedRef.current) return;
    const timer = setTimeout(() => {
      try {
        if (clientHistory && clientHistory.length >= 0) LS.set(LSK.clients, clientHistory);
      } catch (e) { console.warn('Erro ao sincronizar clients:', e); }
    }, 800);
    return () => clearTimeout(timer);
  }, [clientHistory]);

  useEffect(() => {
    if (!syncedRef.current) return;
    const timer = setTimeout(() => {
      try {
        if (calendarSettings) LS.set(LSK.cal, calendarSettings);
      } catch (e) { console.warn('Erro ao sincronizar calendário:', e); }
    }, 800);
    return () => clearTimeout(timer);
  }, [calendarSettings]);

  useEffect(() => {
    if (!syncedRef.current) return;
    const timer = setTimeout(() => {
      try {
        if (dayOverrides) LS.set(LSK.overrides, dayOverrides);
      } catch (e) { console.warn('Erro ao sincronizar overrides:', e); }
    }, 800);
    return () => clearTimeout(timer);
  }, [dayOverrides]);

  useEffect(() => {
    if (!syncedRef.current) return;
    const timer = setTimeout(() => {
      try { if (users && users.length >= 0) LS.set(LSK.users, users); } catch (e) {}
    }, 800);
    return () => clearTimeout(timer);
  }, [users]);

  function showToast(message, type = "error") {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }

  function mapOrder(o) {
    const status = o.status === 'delivered' ? 'completed' : o.status;
    return { id: o.id, client: o.client, orderNumber: o.order_number, deliveryDate: o.delivery_date, productionStart: o.production_start, productionEnd: o.production_end, status, observations: o.observations || '', items: o.items || [], itemsCompleted: o.items_completed || {}, productionDays: o.production_days || [], missingItems: o.missing_items || [] };
  }
  function mapUser(u) {
    return { username: u.username, password: u.password, name: u.name || u.username, role: u.role };
  }
  function mapItem(i) {
    return { code: i.code, description: i.description, productionTime: i.production_time };
  }

  async function loadData() {
    setLoading(true);
    setLoadError(false);

    // ── PASSO 1: carrega localStorage imediatamente ──────────────────────────
    // O app fica disponível na hora, mesmo sem internet ou com Supabase pausado.
    const cached = {
      orders:   LS.get(LSK.orders,   null),
      items:    LS.get(LSK.items,    null),
      clients:  LS.get(LSK.clients,  []),
      cal:      LS.get(LSK.cal,      null),
      overrides:LS.get(LSK.overrides,{}),
      logistics:LS.get(LSK.logistics,{}),
      users:    LS.get(LSK.users,    null),
      sync:     LS.get(LSK.sync,     null),
    };
    const hasCache = cached.orders !== null && cached.items !== null;

    if (hasCache) {
      setOrders(cached.orders);
      setRegisteredItems(cached.items);
      setClientHistory(cached.clients);
      if (cached.cal) setCalendarSettings(cached.cal);
      setDayOverrides(cached.overrides);
      setLogistics(cached.logistics);
      if (cached.users && cached.users.length > 0) setUsers(cached.users);
      syncedRef.current = true;
      setLoading(false); // app visível imediatamente
    }

    // ── PASSO 2: sincroniza com Supabase em segundo plano ────────────────────
    setSyncing(true);
    try {
      const [itemsRes, ordersRes, clientsRes, settingsRes, usersRes] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('client_history').select('name'),
        supabase.from('settings').select('*'),
        supabase.from('users').select('*'),
      ]);
      if (itemsRes.error) throw itemsRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const newItems = itemsRes.data?.map(mapItem) ?? [];
      if (newItems.length > 0) {
        setRegisteredItems(newItems);
      } else if ((cached.items || []).length > 0) {
        showToast("Catálogo de itens vazio no servidor — cache local restaurado.", "warning");
      }
      if (ordersRes.data) setOrders(ordersRes.data.map(mapOrder));
      if (clientsRes.data) setClientHistory(clientsRes.data.map(c => c.name));
      if (settingsRes.data) {
        const calRow = settingsRes.data.find(r => r.key === 'calendar');
        const overRow = settingsRes.data.find(r => r.key === 'day_overrides');
        const logRow = settingsRes.data.find(r => r.key === 'logistics');
        if (calRow) setCalendarSettings(calRow.value);
        if (overRow) setDayOverrides(overRow.value || {});
        if (logRow) { setLogistics(logRow.value || {}); LS.set(LSK.logistics, logRow.value || {}); }
      }
      if (usersRes.data && usersRes.data.length > 0) {
        const mappedUsers = usersRes.data.map(mapUser);
        setUsers(mappedUsers);
        LS.set(LSK.users, mappedUsers);
      } else if (cached.users && cached.users.length > 0) {
        setUsers(cached.users);
      }
      syncedRef.current = true;
      setOfflineMode(false);
      setLoading(false);
      LS.set(LSK.sync, new Date().toISOString());
    } catch (e) {
      console.error("Supabase indisponível:", e);
      if (hasCache) {
        // Dados já estão visíveis do cache — apenas sinaliza modo offline
        setOfflineMode(true);
      } else {
        // Primeiro acesso sem cache e sem Supabase — sem dados possíveis
        setLoadError(true);
        setLoading(false);
      }
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadData();
    let subscription;

    // Sincronização em tempo real — todos os usuários veem mudanças ao instante
    const setupSubscription = async () => {
      const channel = supabase.channel('pcp-realtime-v2', { config: { broadcast: { self: false } } })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
          // Previne duplicatas em INSERTs: verifica se o ID já existe
          setOrders(prev => {
            const exists = prev.some(o => String(o.id) === String(payload.new.id));
            return exists ? prev : [...prev, mapOrder(payload.new)];
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
          setOrders(prev => prev.map(o => String(o.id) === String(payload.new.id) ? mapOrder(payload.new) : o));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, payload => {
          setOrders(prev => prev.filter(o => String(o.id) !== String(payload.old.id)));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' }, payload => {
          setRegisteredItems(prev => {
            const exists = prev.some(i => i.code === payload.new.code);
            return exists ? prev : [...prev, mapItem(payload.new)];
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' }, payload => {
          setRegisteredItems(prev => prev.map(i => i.code === payload.new.code ? mapItem(payload.new) : i));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, payload => {
          setRegisteredItems(prev => prev.filter(i => i.code !== payload.old.code));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'client_history' }, payload => {
          setClientHistory(prev => prev.includes(payload.new.name) ? prev : [...prev, payload.new.name]);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') console.log('✓ Realtime sync conectado');
        });
      subscription = channel;
    };

    setupSubscription().catch(err => console.error('Erro ao conectar realtime:', err));

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  async function addOrder(order) {
    // Validar dados antes de inserir
    if (!order.id || !order.client || !order.orderNumber) {
      showToast('Pedido incompleto. Verifique os dados.');
      return;
    }
    
    setOrders(prev => [...prev, order]);
    const { error } = await supabase.from('orders').insert({
      id: String(order.id),
      client: order.client,
      order_number: order.orderNumber,
      delivery_date: order.deliveryDate,
      production_start: order.productionStart,
      production_end: order.productionEnd,
      production_days: order.productionDays || [],
      status: order.status,
      observations: order.observations,
      items: order.items,
      items_completed: order.itemsCompleted,
      missing_items: order.missingItems || [],
      has_complementary: (order.missingItems || []).length > 0,
      complementary_complete: (order.missingItems || []).length === 0,
    });
    if (error) handleSaveError(error, () => setOrders(prev => prev.filter(o => o.id !== order.id)), "Erro ao salvar pedido. Tente novamente.");
  }
  async function updateOrder(id, changes) {
    const prev = orders.find(o => o.id === id);
    setOrders(p => p.map(o => o.id === id ? { ...o, ...changes } : o));
    const db = {};
    if (changes.client !== undefined) db.client = changes.client;
    if (changes.orderNumber !== undefined) db.order_number = changes.orderNumber;
    if (changes.deliveryDate !== undefined) db.delivery_date = changes.deliveryDate;
    if (changes.productionStart !== undefined) db.production_start = changes.productionStart;
    if (changes.productionEnd !== undefined) db.production_end = changes.productionEnd;
    if (changes.productionDays !== undefined) db.production_days = changes.productionDays;
    if (changes.status !== undefined) db.status = changes.status;
    if (changes.observations !== undefined) db.observations = changes.observations;
    if (changes.items !== undefined) db.items = changes.items;
    if (changes.itemsCompleted !== undefined) db.items_completed = changes.itemsCompleted;
    if (changes.missingItems !== undefined) {
      db.missing_items = changes.missingItems;
      db.has_complementary = changes.missingItems.length > 0;
      db.complementary_complete = changes.missingItems.length === 0 || changes.missingItems.every(i => i.delivered);
    }
    const { error } = await supabase.from('orders').update(db).eq('id', String(id));
    if (error) handleSaveError(error, () => { if (prev) setOrders(p => p.map(o => o.id === id ? prev : o)); }, "Erro ao atualizar pedido. Alteração desfeita.");
  }
  async function addItem(item) {
    setRegisteredItems(prev => [...prev, item]);
    const { error } = await supabase.from('items').insert({ code: item.code, description: item.description, production_time: item.productionTime });
    if (error) handleSaveError(error, () => setRegisteredItems(prev => prev.filter(i => i.code !== item.code)), "Erro ao salvar item. Tente novamente.");
  }
  async function updateItem(originalCode, newItem) {
    const prev = registeredItems.find(i => i.code === originalCode);
    setRegisteredItems(p => p.map(i => i.code === originalCode ? newItem : i));
    let error;
    if (originalCode !== newItem.code) {
      // Insere o novo PRIMEIRO — só deleta o antigo se o insert funcionar
      // Ordem oposta (delete antes do insert) causava perda irreversível do item
      const r1 = await supabase.from('items').insert({ code: newItem.code, description: newItem.description, production_time: newItem.productionTime });
      if (r1.error) { error = r1.error; }
      else {
        const r2 = await supabase.from('items').delete().eq('code', originalCode);
        if (r2.error) error = r2.error;
      }
    } else {
      const r = await supabase.from('items').update({ description: newItem.description, production_time: newItem.productionTime }).eq('code', originalCode);
      if (r.error) error = r.error;
    }
    if (error) handleSaveError(error, () => { if (prev) setRegisteredItems(p => p.map(i => i.code === newItem.code ? prev : i)); }, "Erro ao atualizar item. Alteração desfeita.");
  }
  async function deleteItem(code) {
    const prev = registeredItems.find(i => i.code === code);
    setRegisteredItems(p => p.filter(i => i.code !== code));
    const { error } = await supabase.from('items').delete().eq('code', code);
    if (error) handleSaveError(error, () => { if (prev) setRegisteredItems(p => [...p, prev]); }, "Erro ao excluir item. Tente novamente.");
  }
  async function addClient(name) {
    if (clientHistory.includes(name)) return;
    setClientHistory(prev => [...prev, name]);
    const { error } = await supabase.from('client_history').insert({ name });
    if (error && error.code !== '23505') console.error(error);
  }
  async function saveCalendarSettings(newSettings) {
    const prev = calendarSettings;
    setCalendarSettings(newSettings);
    const { error } = await supabase.from('settings').upsert({ key: 'calendar', value: newSettings }, { onConflict: 'key' });
    if (error) handleSaveError(error, () => setCalendarSettings(prev), "Erro ao salvar configurações de calendário.");
  }
  async function saveDayOverrides(newOverrides) {
    const prev = dayOverrides;
    setDayOverrides(newOverrides);
    const { error } = await supabase.from('settings').upsert({ key: 'day_overrides', value: newOverrides }, { onConflict: 'key' });
    if (error) handleSaveError(error, () => setDayOverrides(prev), "Erro ao salvar exceções do calendário.");
  }

  async function saveLogistics(newLogistics) {
    setLogistics(newLogistics);
    LS.set(LSK.logistics, newLogistics);
    await supabase.from('settings').upsert({ key: 'logistics', value: newLogistics }, { onConflict: 'key' });
  }

  async function addUser(user) {
    setUsers(prev => [...prev, user]);
    const { error } = await supabase.from('users').insert({ username: user.username, password: user.password, name: user.name, role: user.role });
    if (error) handleSaveError(error, () => setUsers(prev => prev.filter(u => u.username !== user.username)), "Erro ao cadastrar usuário.");
  }

  async function updateUser(uname, changes) {
    const prev = users.find(u => u.username === uname);
    setUsers(p => p.map(u => u.username === uname ? { ...u, ...changes } : u));
    const db = { name: changes.name, role: changes.role };
    if (changes.password) db.password = changes.password;
    const { error } = await supabase.from('users').update(db).eq('username', uname);
    if (error) handleSaveError(error, () => { if (prev) setUsers(p => p.map(u => u.username === uname ? prev : u)); }, "Erro ao atualizar usuário.");
  }

  async function deleteUser(uname) {
    const prev = users.find(u => u.username === uname);
    setUsers(p => p.filter(u => u.username !== uname));
    const { error } = await supabase.from('users').delete().eq('username', uname);
    if (error) handleSaveError(error, () => { if (prev) setUsers(p => [...p, prev]); }, "Erro ao excluir usuário.");
  }

  // Helper: trata erros de save respeitando modo offline
  function handleSaveError(error, rollback, msg) {
    console.error('SaveError:', error);
    
    // Se estamos em modo offline, salva no localStorage e aguarda reconexão
    if (offlineModeRef.current || error?.status === 0 || error?.message?.includes('network')) {
      showToast("Modo offline — alteração salva localmente. Sincronizará ao reconectar.", "warning");
    } else {
      // Se houver erro no servidor, desfaz a alteração
      if (rollback) rollback();
      showToast(msg || "Erro ao salvar. Alteração desfeita.", "error");
    }
  }

  function handleLogin(user) { setCurrentUser(user); setActivePage("demand"); }
  function handleLogout() { setCurrentUser(null); setActivePage("demand"); }

  if (loading && users.length === 0) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.dark, flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: C.red, fontFamily: "'Barlow Condensed', sans-serif" }}>BVN PCP</div>
        <div style={{ fontSize: 14, color: C.textMuted, fontFamily: "'Barlow', sans-serif" }}>Conectando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage users={users} onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.dark, flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: C.red, fontFamily: "'Barlow Condensed', sans-serif" }}>BVN PCP</div>
        <div style={{ fontSize: 14, color: C.textMuted, fontFamily: "'Barlow', sans-serif" }}>Carregando dados...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.dark, flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: C.red, fontFamily: "'Barlow Condensed', sans-serif" }}>BVN PCP</div>
        <div style={{ fontSize: 15, color: C.danger, fontFamily: "'Barlow', sans-serif", fontWeight: 600 }}>Não foi possível conectar ao banco de dados.</div>
        <div style={{ maxWidth: 420, textAlign: "center", fontSize: 13, color: C.textMuted, fontFamily: "'Barlow', sans-serif", lineHeight: 1.7 }}>
          O Supabase (free tier) pausa projetos após 7 dias sem acesso.<br/>
          Acesse <strong style={{ color: C.text }}>supabase.com</strong>, faça login e restaure o projeto para recuperar os dados.
        </div>
        <button onClick={loadData} style={{ padding: "12px 28px", borderRadius: 8, border: "none", background: C.red, color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <Toast toasts={toasts} />
      {syncing && !offlineMode && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 2000, background: C.darkCard, color: C.textMuted, padding: "5px 20px", fontSize: 11, fontWeight: 700, fontFamily: FH, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}` }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: C.green, animation: "pulse 1.2s ease-in-out infinite" }} />
          Sincronizando com servidor...
        </div>
      )}
      {offlineMode && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 2000, background: C.yellow, color: C.dark, padding: "7px 20px", fontSize: 12, fontWeight: 700, fontFamily: FH, letterSpacing: "0.04em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠ MODO OFFLINE — Supabase pausado. Exibindo dados salvos localmente. Suas alterações ficam guardadas aqui.</span>
          <button onClick={loadData} style={{ padding: "4px 14px", borderRadius: 4, border: "none", background: C.dark, color: C.yellow, cursor: "pointer", fontFamily: FH, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>↺ Reconectar</button>
        </div>
      )}
      <div style={{ display: "flex", height: "100vh", background: C.dark, fontFamily: F, overflow: "hidden", paddingTop: offlineMode ? 34 : syncing ? 26 : 0 }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} onLogout={handleLogout} />
        <div style={{ flex: 1, overflow: "auto" }}>
          {activePage === "demand" && <DemandPage orders={orders} addOrder={addOrder} updateOrder={updateOrder} registeredItems={registeredItems} clientHistory={clientHistory} addClient={addClient} editingOrderId={editingOrderId} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} calendarSettings={calendarSettings} dayOverrides={dayOverrides} />}
          {activePage === "calendar" && <CalendarPage orders={orders} updateOrder={updateOrder} calendarSettings={calendarSettings} saveCalendarSettings={saveCalendarSettings} dayOverrides={dayOverrides} saveDayOverrides={saveDayOverrides} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} logistics={logistics} />}
          {activePage === "open" && <OpenDemandsPage orders={orders} updateOrder={updateOrder} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} logistics={logistics} saveLogistics={saveLogistics} />}
          {activePage === "logistics" && <LogisticsPage orders={orders} logistics={logistics} saveLogistics={saveLogistics} updateOrder={updateOrder} />}
          {activePage === "missing" && (currentUser.role === "gestor" || currentUser.role === "montador") && <MissingItemsPage orders={orders} updateOrder={updateOrder} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} />}
          {activePage === "items" && (currentUser.role === "gestor" || currentUser.role === "montador") && <ItemsPage registeredItems={registeredItems} addItem={addItem} updateItem={updateItem} deleteItem={deleteItem} />}
          {activePage === "reports" && currentUser.role === "gestor" && <ReportsPage orders={orders} registeredItems={registeredItems} calendarSettings={calendarSettings} dayOverrides={dayOverrides} />}
          {activePage === "export" && currentUser.role === "gestor" && <ExportPage orders={orders} registeredItems={registeredItems} />}
          {activePage === "users" && currentUser.role === "gestor" && <UsersPage users={users} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} currentUser={currentUser} />}
        </div>
      </div>
    </>
  );
}
