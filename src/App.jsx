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

const defaultUsers = [
  { username: "admin", password: "admin123", name: "Administrador", role: "gestor" },
  { username: "gestor", password: "gestor123", name: "Carlos Silva", role: "gestor" },
  { username: "operador", password: "operador123", name: "João Santos", role: "operador" },
  { username: "operador2", password: "operador123", name: "Maria Oliveira", role: "operador" },
];

// ============================================================
// UTILITIES
// ============================================================
function fmtMin(m) { const h = Math.floor(m / 60); const mm = m % 60; if (h === 0) return `${mm}min`; if (mm === 0) return `${h}h`; return `${h}h ${mm}min`; }
function fmtDate(s) { if (!s) return ""; const [y, m, d] = s.split("-"); return `${d}/${m}`; }
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
              Usuários de teste
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, fontFamily: F, lineHeight: 1.8 }}>
              <span style={{ color: C.red, fontWeight: 700 }}>Gestor:</span> gestor / gestor123<br />
              <span style={{ color: C.steel, fontWeight: 700 }}>Operador:</span> operador / operador123
            </div>
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
    { id: "demand", icon: "📋", label: "Demanda de Produção", roles: ["gestor", "operador"] },
    { id: "calendar", icon: "📅", label: "Calendário", roles: ["gestor", "operador"] },
    { id: "open", icon: "🔄", label: "Demandas em Aberto", roles: ["gestor", "operador"] },
    { id: "items", icon: "📦", label: "Cadastro de Itens", roles: ["gestor", "operador"] },
    { id: "reports", icon: "📊", label: "Relatórios", roles: ["gestor"] },
    { id: "export", icon: "📤", label: "Exportação", roles: ["gestor"] },
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
            color: currentUser.role === "gestor" ? C.red : C.steel, marginTop: 2,
          }}>{currentUser.role}</div>
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
function DemandPage({ orders, addOrder, updateOrder, registeredItems, clientHistory, addClient, editingOrderId, setEditingOrderId, setActivePage }) {
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

  useEffect(() => {
    if (editingOrder) { setClient(editingOrder.client); setOrderNumber(editingOrder.orderNumber); setDeliveryDate(editingOrder.deliveryDate); setProdStart(editingOrder.productionStart); setProdEnd(editingOrder.productionEnd); setDemandItems([...editingOrder.items]); setObservations(editingOrder.observations); }
  }, [editingOrderId]);

  const filteredClients = clientHistory.filter(c => c.toLowerCase().includes(client.toLowerCase()) && c !== client);
  const filteredCodes = registeredItems.filter(i => i.code.toLowerCase().includes(itemCode.toLowerCase()) && i.code !== itemCode);

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
    setConfirm({
      message: "Deseja concluir o pedido?",
      onYes: () => {
        addClient(client);
        const cm = {}; demandItems.forEach(i => cm[i.code] = false);
        if (isEditing) { updateOrder(editingOrderId, { client, orderNumber, deliveryDate, productionStart: prodStart, productionEnd: prodEnd, items: demandItems, observations, itemsCompleted: { ...editingOrder.itemsCompleted, ...cm } }); setEditingOrderId(null); }
        else { addOrder({ id: String(Date.now()), client, orderNumber, deliveryDate, productionStart: prodStart, productionEnd: prodEnd, items: demandItems, observations, status: "scheduled", itemsCompleted: cm }); }
        setClient(""); setOrderNumber(""); setDeliveryDate(""); setProdStart(""); setProdEnd(""); setDemandItems([]); setObservations(""); setConfirm(null);
      }, onNo: () => setConfirm(null),
    });
  }

  const totalItems = demandItems.length;
  const totalUnits = demandItems.reduce((s, i) => s + i.quantity, 0);
  const totalProdTime = demandItems.reduce((s, i) => s + i.productionTime, 0);

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

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <ConfirmDialog open={!!confirm} message={confirm?.message || ""} onYes={confirm?.onYes} onNo={confirm?.onNo} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>
          {isEditing ? "Editar Demanda" : "Demanda de Produção"}
        </h1>
        {isEditing && <Btn variant="ghost" onClick={() => { setEditingOrderId(null); setClient(""); setOrderNumber(""); setDeliveryDate(""); setProdStart(""); setProdEnd(""); setDemandItems([]); setObservations(""); }}>← Cancelar</Btn>}
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
            <span style={{ color: C.textMuted }}>Tempo: <span style={{ color: C.red, fontWeight: 700 }}>{fmtMin(totalProdTime)}</span></span>
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
              <span>{fmtMin(item.productionTime)}</span>
              <button onClick={() => removeItem(item.code)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
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
function CalendarPage({ orders, updateOrder, calendarSettings, saveCalendarSettings, dayOverrides, saveDayOverrides, setEditingOrderId, setActivePage }) {
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
  function getOrdersForDay(ds) { return orders.filter(o => o.productionStart === ds); }
  function getOccupation(ds) { const h = getHoursForDay(ds); if (h === 0) return 0; const m = getOrdersForDay(ds).reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.productionTime, 0), 0); return Math.round((m / (h * 60)) * 100); }
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
        <div style={{ display: "flex", gap: 6 }}>
          <Btn variant="ghost" onClick={() => setWeekOffset(w => w - 4)}>◀</Btn>
          <Btn variant="ghost" onClick={() => setWeekOffset(0)} style={{ color: C.red }}>Hoje</Btn>
          <Btn variant="ghost" onClick={() => setWeekOffset(w => w + 4)}>▶</Btn>
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
                  {getOrdersForDay(ds).map(o => (
                    <div key={o.id} draggable onDragStart={() => setDragOrder(o.id)} onDoubleClick={() => { setEditingOrderId(o.id); setActivePage("demand"); }}
                      style={{ padding: "5px 8px", borderRadius: 5, background: C.redDim, cursor: "grab", fontSize: 10, fontFamily: F, color: C.text, fontWeight: 600, borderLeft: `3px solid ${C.red}`, marginBottom: 3, transition: "transform 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                      <span style={{ fontWeight: 800, color: C.red }}>{o.client}</span>
                      <span style={{ color: C.textMuted, marginLeft: 5 }}>#{o.orderNumber}</span>
                    </div>
                  ))}
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
// PAGE 3: DEMANDAS EM ABERTO
// ============================================================
function OpenDemandsPage({ orders, updateOrder, setEditingOrderId, setActivePage }) {
  const today = getToday(); const tomorrow = getTomorrow();
  const [selectedExec, setSelectedExec] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const todayOrders = orders.filter(o => o.productionStart === today && o.status !== "executing" && o.status !== "completed");
  const executingOrders = orders.filter(o => o.status === "executing");
  const tomorrowOrders = orders.filter(o => o.productionStart === tomorrow && o.status !== "executing" && o.status !== "completed");

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
  function deliverOrder(id) {
    setConfirm({ message: "Deseja entregar esta demanda?", onYes: () => { updateOrder(id, { status: "completed" }); setSelectedExec(null); setConfirm(null); }, onNo: () => setConfirm(null) });
  }

  const execOrder = selectedExec ? orders.find(o => o.id === selectedExec) : (executingOrders[0] || null);
  const totalProd = execOrder ? execOrder.items.reduce((s, i) => s + i.productionTime, 0) : 0;
  const doneProd = execOrder ? execOrder.items.filter(i => execOrder.itemsCompleted[i.code]).reduce((s, i) => s + i.productionTime, 0) : 0;

  function DropZone({ title, zone, items, color }) {
    return (
      <div onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = color; }} onDragLeave={e => { e.currentTarget.style.borderColor = C.border; }} onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.border; handleDrop(zone); }}
        style={{ flex: 1, background: C.dark, borderRadius: 10, border: `2px dashed ${C.border}`, padding: 14, minHeight: 170, transition: "border-color 0.2s" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color, marginBottom: 10, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />{title}
          <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginLeft: "auto" }}>{items.length}</span>
        </div>
        {items.map(o => (
          <div key={o.id} draggable onDragStart={() => setDragItem(o.id)} onClick={() => zone === "executing" && setSelectedExec(o.id)}
            onDoubleClick={() => { setEditingOrderId(o.id); setActivePage("demand"); }}
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

  return (
    <div style={{ padding: 24, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ConfirmDialog open={!!confirm} message={confirm?.message || ""} onYes={confirm?.onYes} onNo={confirm?.onNo} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Demandas em Aberto</h1>
        <span style={{ fontSize: 13, color: C.textMuted, fontFamily: F }}>{getDayName(today)} — {fmtDateFull(today)}</span>
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
        <DropZone title="Programado Hoje" zone="today" items={todayOrders} color={C.red} />
        <DropZone title="Em Execução" zone="executing" items={executingOrders} color={C.green} />
        <DropZone title="Programado Amanhã" zone="tomorrow" items={tomorrowOrders} color={C.steel} />
      </div>
      {execOrder && execOrder.status === "executing" && (
        <div style={{ flex: 1, background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            {[["Cliente", execOrder.client, C.text], ["Pedido", "#" + execOrder.orderNumber, C.red], ["Início", fmtDateFull(execOrder.productionStart), C.text], ["Fim", fmtDateFull(execOrder.productionEnd), C.text], ["Entrega", fmtDateFull(execOrder.deliveryDate), C.text], ["Restante", fmtMin(totalProd - doneProd), C.yellow]].map(([l, v, c]) => (
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
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}` }}>
            <Btn variant={allDone(execOrder) ? "success" : undefined} disabled={!allDone(execOrder)} onClick={() => allDone(execOrder) && deliverOrder(execOrder.id)}
              style={{ width: "100%", padding: 14, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.06em", background: allDone(execOrder) ? C.green : C.darkInput, color: allDone(execOrder) ? "#fff" : C.textDim }}>
              Entregar Demanda
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
  const [search, setSearch] = useState(""); const [editIdx, setEditIdx] = useState(null);
  const filtered = registeredItems.filter(i => i.code.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()));

  function saveItem() {
    if (!code || !desc || !time) return alert("Preencha todos os campos.");
    const mins = parseInt(time); if (!mins || mins < 1) return alert("Tempo deve ser positivo.");
    if (editIdx !== null) {
      const originalCode = registeredItems[editIdx].code;
      updateItem(originalCode, { code: code.toUpperCase(), description: desc, productionTime: mins });
      setEditIdx(null);
    } else {
      if (registeredItems.find(i => i.code === code.toUpperCase())) return alert("Código já cadastrado.");
      addItem({ code: code.toUpperCase(), description: desc, productionTime: mins });
    }
    setCode(""); setDesc(""); setTime("");
  }

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 28px", fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Cadastro de Itens</h1>
      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 24, marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 14, marginBottom: 14 }}>
          <Field label="Código"><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex: FLANGE-A1" style={inputStyle} /></Field>
          <Field label="Descrição"><input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição completa" style={inputStyle} /></Field>
          <Field label="Tempo de Produção (min)"><input type="number" min="1" value={time} onChange={e => setTime(e.target.value)} placeholder="Minutos" style={inputStyle} /></Field>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={saveItem}>{editIdx !== null ? "Atualizar" : "Salvar"}</Btn>
          {editIdx !== null && <Btn variant="ghost" onClick={() => { setEditIdx(null); setCode(""); setDesc(""); setTime(""); }}>Cancelar</Btn>}
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
            const ri = registeredItems.indexOf(item);
            return (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 4fr 1.5fr 70px", padding: "11px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: C.red }}>{item.code}</span>
                <span>{item.description}</span>
                <span>{fmtMin(item.productionTime)}</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => { setCode(item.code); setDesc(item.description); setTime(String(item.productionTime)); setEditIdx(ri); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13 }}>✎</button>
                  <button onClick={() => deleteItem(item.code)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 13 }}>✕</button>
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

  const occDays = []; for (let d = 0; d < 14; d++) { const dt = addDays(today, d); const dk = getDayKey(dt); const dw = new Date(dt + "T12:00:00").getDay(); if (dw === 0) continue; const h = dayOverrides[dt] !== undefined ? dayOverrides[dt] : (calendarSettings[dk] ?? 8); if (h === 0) continue; const m = orders.filter(o => o.productionStart === dt).reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.productionTime, 0), 0); occDays.push({ date: dt, occ: Math.round((m / (h * 60)) * 100) }); }
  const avgOcc = occDays.length ? Math.round(occDays.reduce((s, d) => s + d.occ, 0) / occDays.length) : 0;

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
        <KPI label="Tempo Produção" value={fmtMin(totalMin)} color={C.green} icon="⏱" />
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
                <span style={{ color: C.red, fontWeight: 700 }}>{fmtMin(d.minutes)}</span>
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
                <span style={{ color: C.steel, fontWeight: 700 }}>{fmtMin(it.minutes)}</span>
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
      const rows = [["Código", "Descrição", "Tempo (min)", "Tempo"]];
      registeredItems.forEach(i => rows.push([i.code, i.description, i.productionTime, fmtMin(i.productionTime)]));
      return rows.map(r => r.map(esc).join(",")).join("\n");
    }
    if (exportType === "orders") {
      const rows = [["Cliente", "Pedido", "Status", "Entrega", "Início", "Fim", "Itens", "Unidades", "Tempo (min)", "Obs"]];
      data.forEach(o => rows.push([o.client, o.orderNumber, o.status, o.deliveryDate, o.productionStart, o.productionEnd, o.items.length, o.items.reduce((s, i) => s + i.quantity, 0), o.items.reduce((s, i) => s + i.productionTime, 0), o.observations || ""]));
      return rows.map(r => r.map(esc).join(",")).join("\n");
    }
    if (exportType === "order-detail") {
      const rows = [["Cliente", "Pedido", "Status", "Código", "Descrição", "Qtd", "Tempo (min)", "Concluído"]];
      data.forEach(o => o.items.forEach(i => rows.push([o.client, o.orderNumber, o.status, i.code, i.description, i.quantity, i.productionTime, o.itemsCompleted?.[i.code] ? "Sim" : "Não"])));
      return rows.map(r => r.map(esc).join(",")).join("\n");
    }
    // report
    const rows = [["RELATÓRIO DE PRODUÇÃO"], ["Gerado", new Date().toLocaleString("pt-BR")], [], ["Resumo"], ["Total Pedidos", data.length], ["Concluídos", data.filter(o => o.status === "completed").length], ["Em Execução", data.filter(o => o.status === "executing").length], ["Programados", data.filter(o => o.status === "scheduled").length], ["Unidades", data.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0)], ["Tempo Total (min)", data.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.productionTime, 0), 0)]];
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
// MAIN APP
// ============================================================
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users] = useState(defaultUsers);
  const [activePage, setActivePage] = useState("demand");
  const [orders, setOrders] = useState([]);
  const [registeredItems, setRegisteredItems] = useState([]);
  const [clientHistory, setClientHistory] = useState([]);
  const [calendarSettings, setCalendarSettings] = useState(defaultCalSettings);
  const [dayOverrides, setDayOverrides] = useState({});
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  const calendarSettingsRef = useRef(calendarSettings);
  const dayOverridesRef = useRef(dayOverrides);
  useEffect(() => { calendarSettingsRef.current = calendarSettings; }, [calendarSettings]);
  useEffect(() => { dayOverridesRef.current = dayOverrides; }, [dayOverrides]);

  useEffect(() => {
    async function loadData() {
      const [itemsRes, ordersRes, clientsRes, settingsRes] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('client_history').select('name'),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      ]);
      if (itemsRes.data) setRegisteredItems(itemsRes.data.map(i => ({ code: i.code, description: i.description, productionTime: i.production_time })));
      if (ordersRes.data) setOrders(ordersRes.data.map(o => ({ id: o.id, client: o.client, orderNumber: o.order_number, deliveryDate: o.delivery_date, productionStart: o.production_start, productionEnd: o.production_end, status: o.status, observations: o.observations || '', items: o.items || [], itemsCompleted: o.items_completed || {} })));
      if (clientsRes.data) setClientHistory(clientsRes.data.map(c => c.name));
      if (settingsRes.data) { setCalendarSettings(settingsRes.data.calendar_settings); setDayOverrides(settingsRes.data.day_overrides || {}); }
      setLoading(false);
    }
    loadData();
  }, []);

  async function addOrder(order) {
    setOrders(prev => [...prev, order]);
    await supabase.from('orders').insert({ id: order.id, client: order.client, order_number: order.orderNumber, delivery_date: order.deliveryDate, production_start: order.productionStart, production_end: order.productionEnd, status: order.status, observations: order.observations, items: order.items, items_completed: order.itemsCompleted });
  }
  async function updateOrder(id, changes) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
    const db = {};
    if (changes.client !== undefined) db.client = changes.client;
    if (changes.orderNumber !== undefined) db.order_number = changes.orderNumber;
    if (changes.deliveryDate !== undefined) db.delivery_date = changes.deliveryDate;
    if (changes.productionStart !== undefined) db.production_start = changes.productionStart;
    if (changes.productionEnd !== undefined) db.production_end = changes.productionEnd;
    if (changes.status !== undefined) db.status = changes.status;
    if (changes.observations !== undefined) db.observations = changes.observations;
    if (changes.items !== undefined) db.items = changes.items;
    if (changes.itemsCompleted !== undefined) db.items_completed = changes.itemsCompleted;
    await supabase.from('orders').update(db).eq('id', String(id));
  }
  async function addItem(item) {
    setRegisteredItems(prev => [...prev, item]);
    await supabase.from('items').insert({ code: item.code, description: item.description, production_time: item.productionTime });
  }
  async function updateItem(originalCode, newItem) {
    setRegisteredItems(prev => prev.map(i => i.code === originalCode ? newItem : i));
    if (originalCode !== newItem.code) {
      await supabase.from('items').delete().eq('code', originalCode);
      await supabase.from('items').insert({ code: newItem.code, description: newItem.description, production_time: newItem.productionTime });
    } else {
      await supabase.from('items').update({ code: newItem.code, description: newItem.description, production_time: newItem.productionTime }).eq('code', originalCode);
    }
  }
  async function deleteItem(code) {
    setRegisteredItems(prev => prev.filter(i => i.code !== code));
    await supabase.from('items').delete().eq('code', code);
  }
  async function addClient(name) {
    if (clientHistory.includes(name)) return;
    setClientHistory(prev => [...prev, name]);
    await supabase.from('client_history').insert({ name }).then(({ error }) => { if (error && error.code !== '23505') console.error(error); });
  }
  async function saveCalendarSettings(newSettings) {
    setCalendarSettings(newSettings);
    await supabase.from('settings').upsert({ id: 1, calendar_settings: newSettings, day_overrides: dayOverridesRef.current });
  }
  async function saveDayOverrides(newOverrides) {
    setDayOverrides(newOverrides);
    await supabase.from('settings').upsert({ id: 1, calendar_settings: calendarSettingsRef.current, day_overrides: newOverrides });
  }

  function handleLogin(user) { setCurrentUser(user); setActivePage("demand"); }
  function handleLogout() { setCurrentUser(null); setActivePage("demand"); }

  if (!currentUser) {
    return <>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <LoginPage users={users} onLogin={handleLogin} />
    </>;
  }

  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.dark, flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: C.red, fontFamily: "'Barlow Condensed', sans-serif" }}>BVN PCP</div>
        <div style={{ fontSize: 14, color: C.textMuted, fontFamily: "'Barlow', sans-serif" }}>Carregando dados...</div>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", height: "100vh", background: C.dark, fontFamily: F, overflow: "hidden" }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} onLogout={handleLogout} />
        <div style={{ flex: 1, overflow: "auto" }}>
          {activePage === "demand" && <DemandPage orders={orders} addOrder={addOrder} updateOrder={updateOrder} registeredItems={registeredItems} clientHistory={clientHistory} addClient={addClient} editingOrderId={editingOrderId} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} />}
          {activePage === "calendar" && <CalendarPage orders={orders} updateOrder={updateOrder} calendarSettings={calendarSettings} saveCalendarSettings={saveCalendarSettings} dayOverrides={dayOverrides} saveDayOverrides={saveDayOverrides} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} />}
          {activePage === "open" && <OpenDemandsPage orders={orders} updateOrder={updateOrder} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} />}
          {activePage === "items" && <ItemsPage registeredItems={registeredItems} addItem={addItem} updateItem={updateItem} deleteItem={deleteItem} />}
          {activePage === "reports" && currentUser.role === "gestor" && <ReportsPage orders={orders} registeredItems={registeredItems} calendarSettings={calendarSettings} dayOverrides={dayOverrides} />}
          {activePage === "export" && currentUser.role === "gestor" && <ExportPage orders={orders} registeredItems={registeredItems} />}
        </div>
      </div>
    </>
  );
}
