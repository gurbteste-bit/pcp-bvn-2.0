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
// Data LOCAL (antes usava toISOString = UTC: após 21h em Brasília já virava "amanhã")
function localDateStr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function getToday() { return localDateStr(new Date()); }
function getTomorrow() { const d = new Date(); d.setDate(d.getDate() + 1); return localDateStr(d); }
function fmtDateTime(iso) { if (!iso) return ""; const d = new Date(iso); if (isNaN(d)) return ""; return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }
function addDays(s, n) { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }
function getMonday(s) { const d = new Date(s + "T12:00:00"); const day = d.getDay(); d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); return d.toISOString().split("T")[0]; }

// ── Status ──────────────────────────────────────────────────
const STATUS_LABEL = { planning: "Planejamento", scheduled: "Programado", executing: "Em Execução", completed: "Concluído", cancelled: "Cancelado" };
const STATUS_COLOR = { planning: C.orange, scheduled: C.red, executing: C.yellow, completed: C.blue, cancelled: C.textDim };
const isActiveOrder = o => o.status !== "cancelled";

// ── Horas de um dia (calendário + exceções) ─────────────────
function hoursForDay(ds, calendarSettings, dayOverrides) { if (dayOverrides && dayOverrides[ds] !== undefined) return dayOverrides[ds]; return calendarSettings[getDayKey(ds)] ?? 8; }
function orderTotalTime(o) { return (o.items || []).reduce((s, i) => s + (i.productionTime || 0), 0); }
function orderSecondsForDay(o, ds) {
  if (o.productionDays && o.productionDays.length > 0) { const pd = o.productionDays.find(p => p.date === ds); return pd ? pd.minutes : 0; }
  return o.productionStart === ds ? orderTotalTime(o) : 0;
}

// ── Turno / cronômetro em horário de expediente ─────────────
const defaultShift = { start: "07:30", end: "17:30", lunchStart: "12:00", lunchEnd: "13:00", satStart: "07:30", satEnd: "11:30" };
function hmToMin(hm) { const [h, m] = String(hm || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); }
// Janelas de trabalho (em minutos do dia) para uma data
function shiftWindows(ds, shift, isWorkDay) {
  if (!isWorkDay(ds)) return [];
  const dow = new Date(ds + "T12:00:00").getDay();
  if (dow === 0) return [];
  if (dow === 6) return [[hmToMin(shift.satStart), hmToMin(shift.satEnd)]];
  const s = hmToMin(shift.start), e = hmToMin(shift.end), ls = hmToMin(shift.lunchStart), le = hmToMin(shift.lunchEnd);
  if (ls > s && le < e && le > ls) return [[s, ls], [le, e]];
  return [[s, e]];
}
// Segundos dentro do expediente entre dois instantes
function businessSeconds(startISO, endISO, shift, isWorkDay) {
  const a = new Date(startISO), b = new Date(endISO);
  if (isNaN(a) || isNaN(b) || b <= a) return 0;
  let total = 0; let ds = localDateStr(a); const last = localDateStr(b); let guard = 0;
  while (ds <= last && guard < 800) {
    const base = new Date(ds + "T00:00:00").getTime();
    for (const [w0, w1] of shiftWindows(ds, shift, isWorkDay)) {
      const lo = Math.max(a.getTime(), base + w0 * 60000), hi = Math.min(b.getTime(), base + w1 * 60000);
      if (hi > lo) total += (hi - lo) / 1000;
    }
    ds = addDays(ds, 1); guard++;
  }
  return Math.round(total);
}
// Totais de execução de um pedido a partir das sessões { start, end, by, reason }
function execTotals(o, shift, isWorkDay, nowISO) {
  const sessions = o.execSessions || [];
  let business = 0, wall = 0;
  sessions.forEach(s => {
    const end = s.end || nowISO || new Date().toISOString();
    business += businessSeconds(s.start, end, shift, isWorkDay);
    wall += Math.max(0, Math.round((new Date(end) - new Date(s.start)) / 1000));
  });
  const pauses = sessions.filter(s => s.end && s.endType === "pause").length;
  const running = sessions.length > 0 && !sessions[sessions.length - 1].end;
  return { business, wall, pauses, running, sessions: sessions.length };
}

// ── Distribuição da produção por dia ────────────────────────
function normalizeDays(days) {
  const map = {}; (days || []).forEach(d => { if (!d.date) return; map[d.date] = (map[d.date] || 0) + (d.minutes || 0); });
  return Object.entries(map).filter(([, m]) => m > 0).map(([date, minutes]) => ({ date, minutes })).sort((a, b) => a.date.localeCompare(b.date));
}
function effectiveDays(o) { return o.productionDays && o.productionDays.length ? o.productionDays : (o.productionStart ? [{ date: o.productionStart, minutes: orderTotalTime(o) }] : []); }
function daysToChanges(days) { const n = normalizeDays(days); return { productionDays: n, productionStart: n.length ? n[0].date : "", productionEnd: n.length ? n[n.length - 1].date : "" }; }
// Move só a parcela de um dia
function movePortion(o, fromDate, toDate) { return daysToChanges(effectiveDays(o).map(d => d.date === fromDate ? { ...d, date: toDate } : d)); }
// Move o pedido inteiro para um único dia
function moveWhole(o, toDate) { const total = effectiveDays(o).reduce((s, d) => s + d.minutes, 0) || orderTotalTime(o); return daysToChanges([{ date: toDate, minutes: total }]); }
// Desloca a distribuição inteira para começar em toDate, mantendo o formato (em dias úteis)
function shiftDistribution(o, toDate, isWorkDay) {
  const days = normalizeDays(effectiveDays(o)); if (!days.length) return moveWhole(o, toDate);
  const work = []; let d = toDate, guard = 0;
  while (work.length < days.length && guard < 400) { if (isWorkDay(d)) work.push(d); d = addDays(d, 1); guard++; }
  return daysToChanges(days.map((pd, i) => ({ date: work[i] || toDate, minutes: pd.minutes })));
}
function fmtDaysList(days) { return (days || []).map(d => `${fmtDate(d.date)} ${fmtSec(d.minutes)}`).join(", ") || "—"; }

// ── Nomes de clientes ───────────────────────────────────────
function normName(s) { return String(s || "").trim().replace(/\s+/g, " ").toUpperCase(); }
function nameKey(s) { return normName(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9]/g, ""); }
function levenshtein(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
// Clientes parecidos (mesmo nome sem acento/pontuação, um contém o outro, ou até 2 letras de diferença)
function similarClients(name, list) {
  const k = nameKey(name); if (k.length < 2) return [];
  return list.filter(c => {
    const ck = nameKey(c); if (!ck || c === normName(name)) return false;
    if (ck === k) return true;
    const [short, long] = ck.length < k.length ? [ck, k] : [k, ck];
    if (short.length >= 3 && long.startsWith(short)) return true;
    return Math.min(k.length, ck.length) >= 5 && levenshtein(k, ck) <= 2;
  });
}

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
      <p style={{ color: C.text, fontSize: 15, lineHeight: 1.6, margin: "0 0 24px", fontFamily: F, whiteSpace: "pre-line" }}>{message}</p>
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
// MOTIVO — modal com texto obrigatório (cancelar, pausar, trocar entrega, reativar)
// ============================================================
function ReasonModal({ open, title, message, confirmLabel = "Confirmar", confirmColor = C.red, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open]);
  const ok = reason.trim().length >= 3;
  return (
    <Modal open={open} onClose={onCancel} title={title} width={480}>
      {message && <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, margin: "0 0 16px", fontFamily: F, whiteSpace: "pre-line" }}>{message}</p>}
      <Field label="Motivo (obrigatório)">
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} autoFocus placeholder="Explique o motivo..." style={{ ...inputStyle, resize: "vertical" }} />
      </Field>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "10px 24px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 600 }}>Voltar</button>
        <button onClick={() => ok && onConfirm(reason.trim())} disabled={!ok} style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: confirmColor, color: "#fff", cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : 0.45, fontFamily: FH, fontSize: 14, fontWeight: 700 }}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

// ============================================================
// HISTÓRICO DO PEDIDO — eventos (tabela order_events) + marcos antigos
// ============================================================
const EVENT_META = {
  criado:               { label: "Pedido cadastrado", icon: "➕", color: C.steel },
  planejado:            { label: "Planejamento preenchido", icon: "🗂", color: C.orange },
  editado:              { label: "Pedido alterado", icon: "✎", color: C.textMuted },
  itens_alterados:      { label: "Itens alterados", icon: "📦", color: C.textMuted },
  entrega_alterada:     { label: "Data de entrega alterada", icon: "📆", color: C.danger },
  reprogramado:         { label: "Dias de produção alterados", icon: "📅", color: C.blue },
  execucao_iniciada:    { label: "Entrou em execução", icon: "▶", color: C.green },
  execucao_retomada:    { label: "Execução retomada", icon: "▶", color: C.green },
  execucao_pausada:     { label: "Retirado de produção", icon: "⏸", color: C.yellow },
  item_concluido:       { label: "Item de produção marcado", icon: "☑", color: C.textMuted },
  concluido:            { label: "Produção concluída", icon: "✔", color: C.green },
  faltante_adicionado:  { label: "Item faltante registrado", icon: "⚠", color: C.orange },
  faltante_entregue:    { label: "Item faltante entregue", icon: "✓", color: C.green },
  faltante_removido:    { label: "Item faltante removido", icon: "✕", color: C.textMuted },
  localizacao:          { label: "Localização no estoque", icon: "📍", color: C.textMuted },
  faturado:             { label: "Faturado", icon: "🧾", color: C.yellow },
  expedido:             { label: "Expedido", icon: "🚚", color: C.green },
  logistica_editada:    { label: "Logística editada", icon: "✎", color: C.textMuted },
  cancelado:            { label: "Pedido cancelado", icon: "⛔", color: C.danger },
  reativado:            { label: "Pedido reativado", icon: "↺", color: C.orange },
  excluido:             { label: "Pedido excluído", icon: "🗑", color: C.danger },
  cliente_unificado:    { label: "Cliente renomeado/unificado", icon: "👥", color: C.textMuted },
};
// Texto legível dos detalhes de um evento (tela e CSV)
function describeEvent(ev) {
  const d = ev.details || {}; const p = [];
  if (d.reason) p.push(`Motivo: ${d.reason}`);
  if (d.from !== undefined && d.to !== undefined && ev.type === "entrega_alterada") p.push(`${fmtDateFull(d.from)} → ${fmtDateFull(d.to)}`);
  if (d.changes) Object.entries(d.changes).forEach(([k, [a, b]]) => p.push(`${k}: "${a ?? ""}" → "${b ?? ""}"`));
  if (d.daysBefore || d.daysAfter) p.push(`${fmtDaysList(d.daysBefore)} → ${fmtDaysList(d.daysAfter)}${d.mode ? ` (${d.mode})` : ""}`);
  if (d.added && d.added.length) p.push(`Adicionados: ${d.added.join(", ")}`);
  if (d.removed && d.removed.length) p.push(`Removidos: ${d.removed.join(", ")}`);
  if (d.qtyChanged && d.qtyChanged.length) p.push(`Alterados: ${d.qtyChanged.join(", ")}`);
  if (d.items !== undefined && ev.type !== "item_concluido") p.push(`${d.items} itens, ${fmtSec(d.totalTime || 0)}`);
  if (d.days) p.push(`Dias: ${fmtDaysList(d.days)}`);
  if (ev.type === "item_concluido") p.push(`${d.code}: ${d.done ? "Sim" : "Não"}`);
  if (d.code && ev.type.startsWith("faltante")) p.push(`${d.code} × ${d.qty}`);
  if (d.location !== undefined) p.push(`Local: ${d.location || "—"}`);
  if (d.carrier !== undefined) p.push(`Transportadora: ${d.carrier || "—"}`);
  if (d.execBusiness !== undefined) p.push(`Tempo execução: ${fmtSec(d.execBusiness)} (expediente) / ${fmtSec(d.execWall)} (relógio), estimado ${fmtSec(d.estimated || 0)}`);
  if (d.pendingItems && d.pendingItems.length) p.push(`Itens não concluídos: ${d.pendingItems.join(", ")}`);
  if (d.parallel && d.parallel.length) p.push(`Em paralelo com: ${d.parallel.join(", ")}`);
  if (d.status) p.push(`Status: ${STATUS_LABEL[d.status] || d.status}`);
  if (d.fromClient) p.push(`"${d.fromClient}" → "${d.toClient}"`);
  if (d.note) p.push(d.note);
  return p.join(" · ");
}
// Marcos que existem no pedido mas não têm evento (pedidos antigos, antes da v1.5.0)
function legacyMilestones(o, events, logistics) {
  const has = t => events.some(e => e.type === t);
  const out = []; const lg = (logistics || {})[String(o.id)] || {};
  const created = o.createdAtTs || o.createdAt || (/^\d{13}$/.test(String(o.id)) ? new Date(Number(o.id)).toISOString() : null);
  if (created && !has("criado")) out.push({ ts: created, type: "criado", user_name: o.createdBy || "", legacy: true, details: {} });
  if (o.executedAt && !has("execucao_iniciada")) out.push({ ts: o.executedAt, type: "execucao_iniciada", user_name: o.executedBy || "", legacy: true, details: {} });
  if (o.completedAt && !has("concluido")) out.push({ ts: o.completedAt, type: "concluido", user_name: o.completedBy || "", legacy: true, details: {} });
  else if (!o.completedAt && lg.completionDate && !has("concluido")) out.push({ ts: lg.completionDate + "T12:00:00", type: "concluido", legacy: true, dateOnly: true, details: { location: lg.location } });
  if (lg.invoiced && lg.invoiceDate && !has("faturado")) out.push({ ts: lg.invoiceDate + "T12:00:00", type: "faturado", legacy: true, dateOnly: true, details: { carrier: lg.carrier || lg.collectionMethod || lg.collectMethod } });
  if (lg.collected && !has("expedido")) out.push({ ts: (lg.collectedDate || lg.invoiceDate || "") + "T12:00:00", type: "expedido", legacy: true, dateOnly: true, details: {} });
  return out.filter(e => e.ts && !e.ts.startsWith("T"));
}

function OrderHistory({ order, fetchEvents, eventsVersion, logistics, shift, isWorkDay }) {
  const [events, setEvents] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchEvents(order.id).then(r => { if (!alive) return; setEvents(r.events); setErr(r.error); });
    return () => { alive = false; };
  }, [order.id, eventsVersion]);
  if (events === null) return <div style={{ padding: 24, color: C.textDim, fontFamily: F }}>Carregando histórico...</div>;
  const all = [...events, ...legacyMilestones(order, events, logistics)].sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  const t = execTotals(order, shift, isWorkDay);
  const est = orderTotalTime(order);
  return (
    <div>
      {err && <div style={{ padding: "10px 14px", borderRadius: 6, background: C.yellowDim, color: C.yellow, fontSize: 12, fontFamily: F, marginBottom: 14 }}>⚠ {err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {[["Status", STATUS_LABEL[order.status] || order.status, STATUS_COLOR[order.status] || C.text],
          ["Tempo estimado", fmtSec(est), C.text],
          ["Execução (expediente)", t.sessions ? fmtSec(t.business) + (t.running ? " ⏱" : "") : "—", C.green],
          ["Pausas", t.sessions ? String(t.pauses) : "—", C.yellow]].map(([l, v, c]) => (
          <div key={l} style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: C.textDim, fontFamily: FH, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: c, fontFamily: FH }}>{v}</div>
          </div>
        ))}
      </div>
      {all.length === 0 && <div style={{ padding: 24, color: C.textDim, fontFamily: F, textAlign: "center" }}>Nenhum registro.</div>}
      <div style={{ position: "relative", paddingLeft: 26 }}>
        <div style={{ position: "absolute", left: 9, top: 4, bottom: 4, width: 2, background: C.border }} />
        {all.map((ev, i) => {
          const m = EVENT_META[ev.type] || { label: ev.type, icon: "•", color: C.textMuted };
          const desc = describeEvent(ev);
          return (
            <div key={ev.id || `${ev.type}-${i}`} style={{ position: "relative", marginBottom: 14 }}>
              <div style={{ position: "absolute", left: -26, top: 0, width: 20, height: 20, borderRadius: "50%", background: C.darkCard, border: `2px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{m.icon}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: m.color, fontFamily: FH, letterSpacing: "0.02em" }}>{m.label}</span>
                <span style={{ fontSize: 12, color: C.textMuted, fontFamily: F }}>{ev.dateOnly ? fmtDateFull(String(ev.ts).slice(0, 10)) : fmtDateTime(ev.ts)}</span>
                {(ev.user_name || ev.username) && <span style={{ fontSize: 11, color: C.textDim, fontFamily: F }}>por {ev.user_name || ev.username}</span>}
                {ev.legacy && <span style={{ fontSize: 10, color: C.textDim, fontFamily: FH, textTransform: "uppercase" }}>(registro antigo)</span>}
                {ev.pending && <span style={{ fontSize: 10, color: C.yellow, fontFamily: FH, textTransform: "uppercase" }}>(aguardando envio)</span>}
              </div>
              {desc && <div style={{ fontSize: 12, color: C.text, fontFamily: F, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
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
            v1.5.0
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({ activePage, setActivePage, currentUser, onLogout, badges = {} }) {
  const allPages = [
    { id: "demand", icon: "📋", label: "Demanda de Produção", roles: ["gestor", "montador", "vendedor"] },
    { id: "planning", icon: "🗂", label: "Planejamento", roles: ["gestor", "montador", "vendedor"] },
    { id: "calendar", icon: "📅", label: "Calendário", roles: ["gestor", "montador", "vendedor"] },
    { id: "open", icon: "🔄", label: "Demandas em Aberto", roles: ["gestor", "montador", "vendedor"] },
    { id: "logistics", icon: "🚚", label: "Logística", roles: ["gestor", "montador", "vendedor"] },
    { id: "missing", icon: "⚠", label: "Itens Faltantes", roles: ["gestor", "montador"] },
    { id: "items", icon: "📦", label: "Cadastro de Itens", roles: ["gestor", "montador"] },
    { id: "reports", icon: "📊", label: "Relatórios", roles: ["gestor"] },
    { id: "export", icon: "📤", label: "Exportação", roles: ["gestor"] },
    { id: "clients", icon: "🏢", label: "Clientes", roles: ["gestor"] },
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
            {badges[p.id] > 0 && <span style={{ marginLeft: "auto", minWidth: 20, padding: "1px 7px", borderRadius: 10, background: C.orange, color: "#fff", fontSize: 11, fontWeight: 800, fontFamily: FH, textAlign: "center" }}>{badges[p.id]}</span>}
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
function DemandPage({ orders, addOrder, updateOrder, deleteOrder, cancelOrder, currentUser, registeredItems, addItem, clientHistory, addClient, editingOrderId, setEditingOrderId, setActivePage, calendarSettings, dayOverrides, fetchEvents, eventsVersion, logistics, shift, isWorkDay }) {
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
  const [tab, setTab] = useState("dados");
  const [clientModal, setClientModal] = useState(null);   // { name }
  const [itemModal, setItemModal] = useState(null);       // { code, description, time, qty }
  const [reasonModal, setReasonModal] = useState(null);   // { title, message, confirmLabel, color, onConfirm }

  const role = currentUser?.role;
  const canCancel = role === "gestor" || role === "montador";
  const isCancelled = editingOrder?.status === "cancelled";
  const totalItems = demandItems.length;
  const totalUnits = demandItems.reduce((s, i) => s + i.quantity, 0);
  const totalProdTime = demandItems.reduce((s, i) => s + i.productionTime, 0);
  const clientNorm = normName(client);
  const clientRegistered = !!clientNorm && clientHistory.includes(clientNorm);
  const clientUnchangedLegacy = isEditing && editingOrder && client === editingOrder.client;

  function loadFrom(o) {
    setClient(o.client); setOrderNumber(o.orderNumber); setDeliveryDate(o.deliveryDate);
    setProdStart(o.productionStart || ""); setProdEnd(o.productionEnd || "");
    setDemandItems([...(o.items || [])]); setObservations(o.observations || "");
    const pd = o.productionDays || [];
    setProductionDays(pd.length ? [...pd] : []);
    setDistMode(pd.length ? "personalizado" : "equal");
    setMissingItems(o.missingItems ? [...o.missingItems] : []);
  }
  useEffect(() => { if (editingOrder) loadFrom(editingOrder); setTab("dados"); }, [editingOrderId]);

  function resetForm() {
    setEditingOrderId(null); setClient(""); setOrderNumber(""); setDeliveryDate(""); setProdStart(""); setProdEnd(""); setDemandItems([]); setObservations(""); setProductionDays([]); setDistMode("equal"); setMissingItems([]); setTab("dados");
  }

  // ── Clientes ───────────────────────────────────────────────
  const filteredClients = clientHistory.filter(c => c.toLowerCase().includes(client.toLowerCase().trim()) && c !== client).sort();
  async function registerClient(name) {
    const n = await addClient(name);
    setClient(n); setClientModal(null);
  }

  // ── Itens faltantes (peças complementares) ─────────────────
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

  const filteredCodes = registeredItems.filter(i => i.code.toLowerCase().includes(itemCode.toLowerCase()) && i.code !== itemCode);

  // ── Distribuição da produção entre dias ─────────────────────
  function getDayHours(ds) { return hoursForDay(ds, calendarSettings, dayOverrides); }
  function getWorkDaysBetween(start, end) {
    if (!start || !end || end < start) return [];
    const days = []; let d = start; let guard = 0;
    while (d <= end && guard < 400) { if (getDayHours(d) > 0) days.push(d); d = addDays(d, 1); guard++; }
    return days;
  }
  function getOtherOrdersSecondsForDay(ds) {
    return orders.reduce((sum, o) => {
      if ((isEditing && o.id === editingOrderId) || !isActiveOrder(o)) return sum;
      return sum + orderSecondsForDay(o, ds);
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
  // Dias em que (outros pedidos + este) passam da capacidade — só aviso, não bloqueia
  function dayLoadPct(pd) { const h = getDayHours(pd.date); if (!pd.date || h <= 0) return null; return ((getOtherOrdersSecondsForDay(pd.date) + (pd.minutes || 0)) / (h * 3600)) * 100; }
  const overCapacityDays = productionDays.filter(pd => { const p = dayLoadPct(pd); return p !== null && p > 100; });

  function handleProdStartChange(val) {
    if (deliveryDate && val > deliveryDate) {
      setConfirm({ message: "O início de produção passou da previsão de entrega.\nDeseja alterar a previsão de entrega?", onYes: () => { setProdStart(val); setDeliveryDate(val); setConfirm(null); }, onNo: () => setConfirm(null) });
    } else setProdStart(val);
  }
  function handleProdEndChange(val) {
    if (deliveryDate && val > deliveryDate) {
      setConfirm({ message: "O fim de produção passou da previsão de entrega.\nDeseja alterar a previsão de entrega?", onYes: () => { setProdEnd(val); setDeliveryDate(val); setConfirm(null); }, onNo: () => setConfirm(null) });
    } else if (prodStart && val < prodStart) {
      setConfirm({ message: "Você deseja alterar o início da produção?", onYes: () => { setProdEnd(val); setProdStart(val); setConfirm(null); }, onNo: () => setConfirm(null) });
    } else setProdEnd(val);
  }

  // ── Itens de produção ──────────────────────────────────────
  function pushItem(found, qty) {
    const existing = demandItems.find(di => di.code === found.code);
    const unit = found.productionTime;
    if (existing) {
      const nq = existing.quantity + qty;
      const perUnit = existing.adjusted ? existing.productionTime / existing.quantity : unit;
      setDemandItems(demandItems.map(di => di.code === found.code ? { ...di, quantity: nq, productionTime: Math.round(nq * perUnit), _rawTime: undefined } : di));
    } else {
      setDemandItems([...demandItems, { code: found.code, description: found.description, quantity: qty, productionTime: qty * unit, catalogTime: unit }]);
    }
  }
  function addItemToDemand() {
    const code = itemCode.trim().toUpperCase();
    if (!code) return;
    const qty = parseInt(itemQty);
    if (!qty || qty < 1) return alert("Quantidade deve ser um número inteiro positivo.");
    const found = registeredItems.find(i => i.code === code);
    if (!found) { setItemModal({ code, description: "", time: "", qty }); return; }
    pushItem(found, qty);
    setItemCode(""); setItemQty("");
  }
  function confirmNewCatalogItem() {
    const secs = parseTimeStr(itemModal.time);
    if (!itemModal.description.trim()) return alert("Informe a descrição.");
    if (!secs || secs < 1) return alert("Tempo inválido. Use um formato como 15m30s ou 1h23m45s.");
    const item = { code: itemModal.code, description: itemModal.description.trim(), productionTime: secs };
    addItem(item); pushItem(item, itemModal.qty);
    setItemModal(null); setItemCode(""); setItemQty("");
  }
  function removeItem(code) { setDemandItems(demandItems.filter(i => i.code !== code)); }
  // Ajuste de tempo total da linha (o catálogo não muda)
  function updateItemTime(code, raw) {
    const secs = parseTimeStr(raw);
    setDemandItems(demandItems.map(di => {
      if (di.code !== code) return di;
      if (secs === null || secs < 1) return { ...di, _rawTime: raw };
      const cat = registeredItems.find(r => r.code === code);
      const catalogTotal = (di.catalogTime || cat?.productionTime || 0) * di.quantity;
      return { ...di, productionTime: secs, adjusted: secs !== catalogTotal, catalogTime: di.catalogTime || cat?.productionTime, _rawTime: raw };
    }));
  }
  const cleanItems = items => items.map(({ _rawTime, ...rest }) => rest);

  // ── Diferenças para o histórico ────────────────────────────
  function buildEditEvents(o, next) {
    const evs = [];
    const changes = {};
    if (o.client !== next.client) changes["Cliente"] = [o.client, next.client];
    if (o.orderNumber !== next.orderNumber) changes["Pedido"] = [o.orderNumber, next.orderNumber];
    if ((o.observations || "") !== (next.observations || "")) changes["Observações"] = [o.observations, next.observations];
    if (Object.keys(changes).length) evs.push({ type: "editado", details: { changes } });
    const before = Object.fromEntries((o.items || []).map(i => [i.code, i]));
    const after = Object.fromEntries(next.items.map(i => [i.code, i]));
    const added = next.items.filter(i => !before[i.code]).map(i => `${i.code}×${i.quantity} (${fmtSec(i.productionTime)})`);
    const removed = (o.items || []).filter(i => !after[i.code]).map(i => `${i.code}×${i.quantity}`);
    const qtyChanged = next.items.filter(i => before[i.code] && (before[i.code].quantity !== i.quantity || before[i.code].productionTime !== i.productionTime))
      .map(i => `${i.code}: ${before[i.code].quantity}un/${fmtSec(before[i.code].productionTime)} → ${i.quantity}un/${fmtSec(i.productionTime)}`);
    if (added.length || removed.length || qtyChanged.length) evs.push({ type: "itens_alterados", details: { added, removed, qtyChanged, totalTime: orderTotalTime({ items: next.items }), items: next.items.length } });
    const db = JSON.stringify(normalizeDays(effectiveDays(o))), da = JSON.stringify(normalizeDays(next.productionDays));
    if (o.status !== "planning" && db !== da) evs.push({ type: "reprogramado", details: { daysBefore: normalizeDays(effectiveDays(o)), daysAfter: normalizeDays(next.productionDays), mode: "edição do pedido" } });
    const mb = Object.fromEntries((o.missingItems || []).map(m => [m.code, m]));
    const ma = Object.fromEntries(next.missingItems.map(m => [m.code, m]));
    next.missingItems.forEach(m => {
      if (!mb[m.code]) evs.push({ type: "faltante_adicionado", details: { code: m.code, qty: m.qty } });
      else if (m.delivered && !mb[m.code].delivered) evs.push({ type: "faltante_entregue", details: { code: m.code, qty: m.qty } });
    });
    (o.missingItems || []).forEach(m => { if (!ma[m.code]) evs.push({ type: "faltante_removido", details: { code: m.code, qty: m.qty } }); });
    return evs;
  }

  // ── Salvar ────────────────────────────────────────────────
  function confirmOrder() {
    if (!client || !orderNumber || !deliveryDate) return alert("Preencha cliente, pedido e previsão de entrega.");
    if (!clientRegistered && !clientUnchangedLegacy) return alert(`O cliente "${clientNorm}" não está cadastrado. Selecione da lista ou clique em "+ Cadastrar cliente".`);
    const hasItems = demandItems.length > 0;
    const currentStatus = editingOrder?.status;
    if (!hasItems && isEditing && currentStatus !== "planning") return alert("Um pedido que já saiu do Planejamento precisa ter ao menos um item.");
    if (hasItems) {
      if (demandItems.some(i => i._rawTime !== undefined && parseTimeStr(i._rawTime) === null)) return alert("Há um tempo de item inválido. Use um formato como 15m30s ou 1h23m45s.");
      if (!prodStart) return alert("Selecione o início de produção.");
      if (productionDays.length === 0) return alert("Configure a distribuição da produção entre os dias.");
    }
    const finalDays = hasItems ? normalizeDays(productionDays) : [];
    if (hasItems && finalDays.length === 0) return alert("A distribuição da produção está zerada.");
    const finalDistTotal = finalDays.reduce((s, pd) => s + pd.minutes, 0);
    const mismatchWarning = hasItems && finalDistTotal !== totalProdTime ? `\n\nAtenção: o total distribuído (${fmtSec(finalDistTotal)}) é diferente do tempo total dos itens (${fmtSec(totalProdTime)}).` : "";
    const goesToPlanning = !hasItems;
    const deliveryChanged = isEditing && editingOrder && deliveryDate !== editingOrder.deliveryDate;

    const doSave = (deliveryReason) => {
      const items = cleanItems(demandItems);
      const base = { client: clientRegistered ? clientNorm : client, orderNumber: orderNumber.trim(), deliveryDate, observations, missingItems };
      const sched = hasItems ? daysToChanges(finalDays) : { productionDays: [], productionStart: "", productionEnd: "" };
      if (isEditing) {
        const cm = {}; items.forEach(i => cm[i.code] = editingOrder.itemsCompleted?.[i.code] || false);
        const changes = { ...base, ...sched, items, itemsCompleted: cm };
        const evs = buildEditEvents(editingOrder, { ...changes });
        if (deliveryChanged) {
          changes.originalDeliveryDate = editingOrder.originalDeliveryDate || editingOrder.deliveryDate;
          evs.unshift({ type: "entrega_alterada", details: { from: editingOrder.deliveryDate, to: deliveryDate, reason: deliveryReason } });
        }
        if (currentStatus === "planning" && hasItems) {
          changes.status = "scheduled"; changes.plannedAt = new Date().toISOString(); changes.plannedBy = currentUser?.username || "";
          evs.unshift({ type: "planejado", details: { items: items.length, totalTime: orderTotalTime({ items }), days: finalDays } });
        }
        updateOrder(editingOrderId, changes, evs);
      } else {
        const cm = {}; items.forEach(i => cm[i.code] = false);
        const u = currentUser?.username || "";
        addOrder({ id: String(Date.now()), ...base, ...sched, items, itemsCompleted: cm, status: goesToPlanning ? "planning" : "scheduled", ...(goesToPlanning ? {} : { plannedAt: new Date().toISOString(), plannedBy: u }) });
      }
      resetForm(); setConfirm(null); setReasonModal(null);
    };

    const proceed = (deliveryReason) => setConfirm({
      message: (isEditing ? "Deseja salvar as alterações?" : goesToPlanning ? "Pedido sem itens.\nEle entrará na fila de PLANEJAMENTO DE PRODUÇÃO para que o montador defina itens, tempos e dias.\n\nConfirmar?" : "Deseja concluir o pedido?") + mismatchWarning,
      onYes: () => doSave(deliveryReason), onNo: () => setConfirm(null),
    });

    if (deliveryChanged) {
      setReasonModal({
        title: "Alterar data de entrega",
        message: `A previsão de entrega do pedido #${editingOrder.orderNumber} vai mudar:\n${fmtDateFull(editingOrder.deliveryDate)}  →  ${fmtDateFull(deliveryDate)}\n\nConfirma a alteração? Explique o motivo.`,
        confirmLabel: "Confirmar alteração", color: C.danger,
        onConfirm: reason => { setReasonModal(null); proceed(reason); },
      });
    } else proceed();
  }

  function requestDelete() {
    if (!editingOrder) return;
    const statusMsg = editingOrder.status === "completed" ? "\n\nEste pedido já foi CONCLUÍDO — os dados de logística dele também serão apagados." : editingOrder.status === "executing" ? "\n\nEste pedido está EM EXECUÇÃO." : "";
    setConfirm({
      message: `Excluir definitivamente o pedido #${editingOrder.orderNumber} — ${editingOrder.client}?${statusMsg}\n\nO pedido some do sistema. O registro no histórico de eventos é mantido para auditoria.\nEsta ação não pode ser desfeita.`,
      onYes: () => { const id = editingOrderId; setConfirm(null); resetForm(); deleteOrder(id); },
      onNo: () => setConfirm(null),
    });
  }
  function requestCancel() {
    if (!editingOrder) return;
    setReasonModal({
      title: `Cancelar pedido #${editingOrder.orderNumber}`,
      message: `${editingOrder.client} — ${STATUS_LABEL[editingOrder.status]}\n\nO pedido sai do calendário e das filas, mas continua registrado como Cancelado.${editingOrder.status === "executing" ? "\nO cronômetro de execução será encerrado." : ""}`,
      confirmLabel: "Cancelar pedido", color: C.danger,
      onConfirm: reason => { const id = editingOrderId; setReasonModal(null); resetForm(); cancelOrder(id, reason); },
    });
  }

  // Pedido apagado/alterado por outro usuário enquanto estava aberto
  useEffect(() => { if (isEditing && !editingOrder) resetForm(); }, [isEditing, editingOrder]);

  const titleText = !isEditing ? "Demanda de Produção" : editingOrder?.status === "planning" ? "Planejar Demanda" : "Editar Demanda";
  const saveLabel = !isEditing ? (demandItems.length ? "Confirmar Pedido" : "Enviar para Planejamento") : (editingOrder?.status === "planning" && demandItems.length ? "Salvar e Programar" : "Salvar Alterações");
  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} style={{ padding: "9px 18px", borderRadius: "6px 6px 0 0", border: "none", borderBottom: tab === id ? `3px solid ${C.red}` : "3px solid transparent", background: "none", color: tab === id ? C.text : C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</button>
  );

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <ConfirmDialog open={!!confirm} message={confirm?.message || ""} onYes={confirm?.onYes} onNo={confirm?.onNo} />
      <ReasonModal open={!!reasonModal} title={reasonModal?.title} message={reasonModal?.message} confirmLabel={reasonModal?.confirmLabel} confirmColor={reasonModal?.color} onConfirm={r => reasonModal?.onConfirm(r)} onCancel={() => setReasonModal(null)} />

      {/* Cadastrar cliente (com alerta de nomes parecidos) */}
      <Modal open={!!clientModal} onClose={() => setClientModal(null)} title="Cadastrar cliente" width={480}>
        {clientModal && (() => {
          const sim = similarClients(clientModal.name, clientHistory);
          return (
            <div>
              <Field label="Nome do cliente (será salvo em maiúsculas)">
                <input value={clientModal.name} onChange={e => setClientModal({ name: e.target.value })} style={inputStyle} autoFocus />
              </Field>
              <div style={{ fontSize: 12, color: C.textMuted, fontFamily: F, marginBottom: 14 }}>Será cadastrado como: <strong style={{ color: C.text }}>{normName(clientModal.name) || "—"}</strong></div>
              {sim.length > 0 && (
                <div style={{ padding: 14, borderRadius: 8, background: C.yellowDim, border: `1px solid ${C.yellow}40`, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: C.yellow, fontFamily: FH, fontWeight: 800, marginBottom: 8 }}>⚠ JÁ EXISTEM CLIENTES PARECIDOS — É ALGUM DESTES?</div>
                  {sim.map(s => (
                    <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                      <span style={{ color: C.text, fontWeight: 700, fontFamily: F, fontSize: 13 }}>{s}</span>
                      <button onClick={() => { setClient(s); setClientModal(null); }} style={{ padding: "5px 12px", borderRadius: 5, border: "none", background: C.green, color: "#fff", cursor: "pointer", fontFamily: FH, fontSize: 12, fontWeight: 700 }}>Usar este</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <Btn variant="ghost" onClick={() => setClientModal(null)}>Voltar</Btn>
                <Btn onClick={() => normName(clientModal.name) && registerClient(clientModal.name)} disabled={!normName(clientModal.name) || clientHistory.includes(normName(clientModal.name))}>{sim.length ? "Não, cadastrar novo" : "Cadastrar"}</Btn>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Item fora do catálogo: cadastra ali mesmo */}
      <Modal open={!!itemModal} onClose={() => setItemModal(null)} title={`Item "${itemModal?.code || ""}" não cadastrado`} width={460}>
        {itemModal && (
          <div>
            <p style={{ color: C.textMuted, fontSize: 13, fontFamily: F, marginTop: 0 }}>Cadastre o item no catálogo para usá-lo neste e nos próximos pedidos.</p>
            <Field label="Código"><input value={itemModal.code} onChange={e => setItemModal({ ...itemModal, code: e.target.value.toUpperCase() })} style={inputStyle} /></Field>
            <Field label="Descrição"><input value={itemModal.description} onChange={e => setItemModal({ ...itemModal, description: e.target.value })} style={inputStyle} autoFocus /></Field>
            <Field label="Tempo de produção UNITÁRIO"><input value={itemModal.time} onChange={e => setItemModal({ ...itemModal, time: e.target.value })} placeholder="Ex: 15m30s" style={inputStyle} /></Field>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setItemModal(null)}>Voltar</Btn>
              <Btn onClick={confirmNewCatalogItem}>Cadastrar e adicionar</Btn>
            </div>
          </div>
        )}
      </Modal>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isEditing ? 10 : 28, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>{titleText}</h1>
          {isEditing && editingOrder && <div style={{ marginTop: 4, fontSize: 12, fontFamily: FH, fontWeight: 700, color: STATUS_COLOR[editingOrder.status], textTransform: "uppercase", letterSpacing: "0.06em" }}>#{editingOrder.orderNumber} · {STATUS_LABEL[editingOrder.status]}</div>}
        </div>
        {isEditing && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {canCancel && editingOrder && !["cancelled", "completed"].includes(editingOrder.status) && <Btn variant="custom" onClick={requestCancel} style={{ background: C.yellowDim, color: C.yellow, border: `1px solid ${C.yellow}66` }}>⛔ Cancelar Pedido</Btn>}
            {deleteOrder && editingOrder && <Btn variant="danger" onClick={requestDelete} style={{ background: C.dangerDim, color: C.danger, border: `1px solid ${C.danger}66` }}>🗑 Excluir</Btn>}
            <Btn variant="ghost" onClick={resetForm}>← Voltar</Btn>
          </div>
        )}
      </div>

      {isEditing && (
        <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
          {tabBtn("dados", "Dados do Pedido")}{tabBtn("historico", "Histórico")}
        </div>
      )}

      {isEditing && tab === "historico" && editingOrder && (
        <OrderHistory order={editingOrder} fetchEvents={fetchEvents} eventsVersion={eventsVersion} logistics={logistics} shift={shift} isWorkDay={isWorkDay} />
      )}

      {isCancelled && tab === "dados" && (
        <div style={{ padding: "14px 18px", borderRadius: 8, background: C.dangerDim, border: `1px solid ${C.danger}40`, marginBottom: 20, fontFamily: F }}>
          <div style={{ color: C.danger, fontWeight: 800, fontFamily: FH, fontSize: 15, letterSpacing: "0.04em" }}>⛔ PEDIDO CANCELADO</div>
          <div style={{ color: C.text, fontSize: 13, marginTop: 4 }}>Motivo: {editingOrder.cancelReason || "—"}</div>
          <div style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{fmtDateTime(editingOrder.cancelledAt)} {editingOrder.cancelledBy ? `por ${editingOrder.cancelledBy}` : ""} · Para reativar, use a tela Planejamento (gestor).</div>
        </div>
      )}

      {tab === "dados" && !isCancelled && (<>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Field label="Cliente"><div style={{ position: "relative" }}>
          <input value={client} onChange={e => { setClient(e.target.value.toUpperCase()); setShowClientSugg(true); }} onFocus={() => setShowClientSugg(true)} onBlur={() => setTimeout(() => setShowClientSugg(false), 200)} placeholder="Selecione um cliente cadastrado" style={{ ...inputStyle, borderColor: client && !clientRegistered && !clientUnchangedLegacy ? C.yellow : C.border }} />
          {showClientSugg && <SuggestionDropdown items={filteredClients} onSelect={c => { setClient(c); setShowClientSugg(false); }} renderLabel={c => c} />}
          {client && !clientRegistered && !clientUnchangedLegacy && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: C.yellow, fontFamily: F }}>Cliente não cadastrado.</span>
              <button onClick={() => setClientModal({ name: client })} style={{ padding: "3px 10px", borderRadius: 5, border: `1px solid ${C.yellow}66`, background: C.yellowDim, color: C.yellow, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>+ Cadastrar cliente</button>
            </div>
          )}
        </div></Field>
        <Field label="Pedido"><input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="Nº do pedido" style={inputStyle} /></Field>
        <Field label="Previsão de Entrega"><input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={inputStyle} /></Field>
        <Field label="Início de Produção"><input type="date" value={prodStart} onChange={e => handleProdStartChange(e.target.value)} style={inputStyle} /></Field>
        <Field label="Fim de Produção"><input type="date" value={prodEnd} onChange={e => handleProdEndChange(e.target.value)} style={inputStyle} /></Field>
        {!isEditing && (
          <div style={{ alignSelf: "center", fontSize: 12, color: C.textMuted, fontFamily: F, lineHeight: 1.5, padding: "10px 14px", background: C.darkCard, border: `1px dashed ${C.border}`, borderRadius: 8 }}>
            💡 Sem itens? Preencha só cliente, pedido e entrega — o pedido vai para a fila de <strong style={{ color: C.orange }}>Planejamento</strong>.
          </div>
        )}
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
          <div style={{ flex: 1 }}><label style={labelStyle}>Quantidade</label><input type="number" min="1" step="1" value={itemQty} onChange={e => setItemQty(e.target.value)} onKeyDown={e => e.key === "Enter" && addItemToDemand()} placeholder="Qtd" style={inputStyle} /></div>
          <Btn onClick={addItemToDemand} style={{ height: 42 }}>Confirmar</Btn>
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
          <span>Código</span><span>Descrição</span><span>Qtd</span><span>Tempo total (ajustável)</span><span></span>
        </div>
        <div style={{ maxHeight: 260, overflow: "auto" }}>
          {demandItems.length === 0 ? <div style={{ padding: 28, textAlign: "center", color: C.textDim, fontSize: 13, fontFamily: F }}>Nenhum item adicionado</div>
          : demandItems.map((item, idx) => {
            const cat = registeredItems.find(r => r.code === item.code);
            const catTotal = (item.catalogTime || cat?.productionTime || 0) * item.quantity;
            const invalid = item._rawTime !== undefined && parseTimeStr(item._rawTime) === null;
            return (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 3fr 1fr 2fr 36px", padding: "8px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: C.red }}>{item.code}</span>
                <span>{item.description}</span>
                <span>{item.quantity}</span>
                <div>
                  <input value={item._rawTime !== undefined ? item._rawTime : fmtSec(item.productionTime)} onChange={e => updateItemTime(item.code, e.target.value)} style={{ ...inputStyle, padding: "6px 10px", borderColor: invalid ? C.danger : item.adjusted ? C.yellow : C.border }} />
                  {item.adjusted && catTotal > 0 && <div style={{ fontSize: 10, color: C.yellow, fontFamily: F, marginTop: 2 }}>Ajustado · catálogo: {fmtSec(catTotal)}</div>}
                </div>
                <button onClick={() => removeItem(item.code)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
              </div>
            );
          })}
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

            {overCapacityDays.length > 0 && (
              <CapacityBanner>
                <span style={{ fontWeight: 600, textTransform: "none", letterSpacing: 0, marginLeft: 8, fontFamily: F }}>
                  em {overCapacityDays.map(pd => fmtDate(pd.date)).join(", ")} — o pedido pode ser salvo mesmo assim.
                </span>
              </CapacityBanner>
            )}

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
                  {(() => { const p = dayLoadPct(pd); return p !== null && p > 100 ? <span style={{ gridColumn: "1 / -1", fontSize: 11, color: C.danger, fontWeight: 700, fontFamily: FH }}>⚠ Dia com {Math.round(p)}% da capacidade (somando outros pedidos)</span> : null; })()}
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
      <Btn onClick={confirmOrder} variant={!isEditing && !demandItems.length ? "custom" : "primary"} style={{ width: "100%", padding: 14, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.06em", ...(!isEditing && !demandItems.length ? { background: C.orange, color: "#fff" } : {}) }}>
        {saveLabel}
      </Btn>
      </>)}
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
  const [drag, setDrag] = useState(null);           // { id, from, whole }
  const [hoverKey, setHoverKey] = useState(null);
  const clickDetailRef = useRef(0);                  // nº de cliques do último mousedown (2 = duplo-clique + arrastar)

  const startDate = addDays(getMonday(getToday()), weekOffset * 7);
  const daysOfWeek = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const dayLabels = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const shift = { ...defaultShift, ...(calendarSettings.shift || {}) };

  function getWeeks() {
    const weeks = [];
    for (let w = 0; w < 4; w++) { const week = []; for (let d = 0; d < 6; d++) week.push(addDays(startDate, w * 7 + d)); weeks.push(week); }
    return weeks;
  }
  function getHoursForDay(ds) { return hoursForDay(ds, calendarSettings, dayOverrides); }
  const calOrders = orders.filter(o => isActiveOrder(o) && o.status !== "planning");
  function getOrdersForDay(ds) { return calOrders.filter(o => orderSecondsForDay(o, ds) > 0 || (!(o.productionDays || []).length && o.productionStart === ds)); }
  function getDaySeconds(ds) { return getOrdersForDay(ds).reduce((s, o) => s + orderSecondsForDay(o, ds), 0); }
  function getOccupation(ds) { const h = getHoursForDay(ds); if (h === 0) return 0; return Math.round((getDaySeconds(ds) / (h * 3600)) * 100); }
  // Aviso (não bloqueio): carga do dia passou da capacidade configurada
  function isOverCapacity(ds) { const h = getHoursForDay(ds); return h > 0 && getDaySeconds(ds) > h * 3600; }
  function occColor(pct) { if (pct <= 60) return { bg: C.greenDim, text: C.green }; if (pct <= 75) return { bg: C.yellowDim, text: C.yellow }; if (pct <= 90) return { bg: C.orangeDim, text: C.orange }; return { bg: C.dangerDim, text: C.danger }; }

  function handleDrop(ds) {
    if (!drag) return;
    const o = orders.find(x => x.id === drag.id); const d = drag; setDrag(null);
    if (!o) return;
    const before = normalizeDays(effectiveDays(o));
    const ch = d.whole ? moveWhole(o, ds) : (d.from === ds ? null : movePortion(o, d.from, ds));
    if (!ch || JSON.stringify(ch.productionDays) === JSON.stringify(before)) return;
    updateOrder(o.id, ch, { type: "reprogramado", details: { daysBefore: before, daysAfter: ch.productionDays, mode: d.whole ? "calendário — pedido inteiro" : `calendário — parte de ${fmtDate(d.from)}` } });
  }
  const openEdit = id => { setEditingOrderId(id); setActivePage("demand"); };
  const weeks = getWeeks();
  const setShift = (k, v) => saveCalendarSettings({ ...calendarSettings, shift: { ...shift, [k]: v } });
  const shiftHours = (() => { const w = shiftWindows("2026-01-05", shift, () => true); return w.reduce((s, [a, b]) => s + (b - a), 0) / 60; })();

  return (
    <div style={{ padding: 24, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box" }}>
      {drag && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 1500, padding: "8px 18px", borderRadius: 20, background: drag.whole ? C.red : C.darkCard, color: "#fff", border: `1px solid ${drag.whole ? C.red : C.border}`, fontFamily: FH, fontWeight: 800, fontSize: 13, letterSpacing: "0.04em", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", pointerEvents: "none" }}>
          {drag.whole ? "⇶ MOVENDO PEDIDO INTEIRO para um único dia" : `Movendo só a parte de ${fmtDate(drag.from)} — duplo-clique e arraste para mover o pedido inteiro`}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Calendário de Produção</h1>
          <button onClick={() => setShowSettings(true)} title="Configurações" style={{ width: 34, height: 34, borderRadius: 6, border: `1px solid ${C.border}`, background: C.darkCard, color: C.textMuted, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, fontSize: 11, fontFamily: FH, fontWeight: 700, letterSpacing: "0.04em" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.redDim, border: `2px solid ${C.red}` }} /><span style={{ color: C.textMuted }}>Ativo</span></span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.yellowDim, border: `2px solid ${C.yellow}` }} /><span style={{ color: C.textMuted }}>Em execução</span></span>
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
      <div style={{ fontSize: 11, color: C.textDim, fontFamily: F, marginBottom: 10 }}>
        Arrastar = move só a parte daquele dia (divide a produção) · <strong style={{ color: C.textMuted }}>Duplo-clique e arrastar</strong> = move o pedido inteiro para um dia · ✎ = abrir pedido
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
                <div key={di} data-day={ds} onDragOver={e => { e.preventDefault(); e.currentTarget.style.boxShadow = `inset 0 0 0 2px ${drag?.whole ? C.red : C.steel}`; }} onDragLeave={e => { e.currentTarget.style.boxShadow = "none"; }} onDrop={e => { e.preventDefault(); e.currentTarget.style.boxShadow = "none"; handleDrop(ds); }}
                  style={{ background: off ? C.dark : C.darkCard, borderRadius: 8, border: `1px solid ${isToday ? C.red : C.border}`, padding: 8, minHeight: 110, opacity: off ? 0.35 : 1, transition: "all 0.12s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: isToday ? C.red : C.text, fontFamily: FH }}>{fmtDate(ds)}</span>
                      {!off && h > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: oc.bg, color: oc.text, fontFamily: FH }}>{occ}%</span>}
                    </div>
                    <button onClick={() => { setShowDayConfig(ds); setDayConfigHours(getHoursForDay(ds)); }} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 13, padding: 0 }}>⋯</button>
                  </div>
                  {!off && isOverCapacity(ds) && <CapacityBanner compact />}
                  {getOrdersForDay(ds).map(o => {
                    const logiData = (logistics || {})[String(o.id)] || {};
                    const isCollected = o.status === "completed" && logiData.collected;
                    const isCompleted = o.status === "completed" && !logiData.collected;
                    const isExec = o.status === "executing";
                    const cardColor = isCollected ? C.green : isCompleted ? C.blue : isExec ? C.yellow : C.red;
                    const cardBg = isCollected ? C.greenDim : isCompleted ? C.blueDim : isExec ? C.yellowDim : C.redDim;
                    const nDays = effectiveDays(o).length;
                    const key = `${o.id}|${ds}`;
                    const movable = o.status !== "completed";
                    return (
                      <div key={o.id} data-card={key} draggable={movable}
                        onMouseDown={e => { clickDetailRef.current = e.detail; }}
                        onDragStart={e => { const whole = clickDetailRef.current >= 2; setDrag({ id: o.id, from: ds, whole }); try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", key); } catch {} }}
                        onDragEnd={() => setDrag(null)}
                        onMouseEnter={() => setHoverKey(key)} onMouseLeave={() => setHoverKey(k => k === key ? null : k)}
                        title={movable ? "Arraste para mover esta parte · duplo-clique e arraste para mover o pedido inteiro" : "Pedido concluído"}
                        style={{ position: "relative", padding: "5px 22px 5px 8px", borderRadius: 5, background: cardBg, cursor: movable ? "grab" : "default", fontSize: 10, fontFamily: F, color: C.text, fontWeight: 600, borderLeft: `3px solid ${cardColor}`, marginBottom: 3, userSelect: "none" }}>
                        <span style={{ fontWeight: 800, color: cardColor }}>{o.client}</span>
                        <span style={{ color: C.textMuted, marginLeft: 5 }}>#{o.orderNumber}</span>
                        {nDays > 1 && <span style={{ color: C.textMuted, marginLeft: 5, fontWeight: 700 }}>· {fmtSec(orderSecondsForDay(o, ds))}</span>}
                        <button onClick={e => { e.stopPropagation(); openEdit(o.id); }} title="Abrir pedido" data-edit={o.id}
                          style={{ position: "absolute", right: 3, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.text, cursor: "pointer", fontSize: 11, padding: "0 3px", opacity: hoverKey === key ? 1 : 0.25 }}>✎</button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Configurações do Calendário" width={520}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Capacidade (horas produtivas por dia)</div>
        {daysOfWeek.map((k, i) => (
          <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: C.text, fontSize: 14, fontFamily: F, fontWeight: 600 }}>{dayLabels[i]}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="number" min="0" max="24" value={calendarSettings[k]} onChange={e => saveCalendarSettings({ ...calendarSettings, [k]: parseInt(e.target.value) || 0 })} style={{ ...inputStyle, width: 65, textAlign: "center" }} />
              <span style={{ color: C.textMuted, fontSize: 12, fontFamily: F }}>h</span>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${C.border}` }}>
          <span style={{ color: C.text, fontSize: 14, fontFamily: F, fontWeight: 600 }}>Sábado é dia útil?</span>
          <button onClick={() => { const v = !calendarSettings.saturdayEnabled; saveCalendarSettings({ ...calendarSettings, saturdayEnabled: v, sabado: v ? 4 : 0 }); }}
            style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: calendarSettings.saturdayEnabled ? C.green : C.darkInput, color: calendarSettings.saturdayEnabled ? "#fff" : C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 13, fontWeight: 700 }}>
            {calendarSettings.saturdayEnabled ? "Sim" : "Não"}
          </button>
        </div>
        <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Horário do expediente (cronômetro de execução)</div>
          <div style={{ fontSize: 12, color: C.textMuted, fontFamily: F, marginBottom: 12 }}>O tempo de execução conta só dentro destes horários, nos dias úteis do calendário. Dias com 0h não contam.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[["start", "Início"], ["lunchStart", "Almoço início"], ["lunchEnd", "Almoço fim"], ["end", "Fim"]].map(([k, l]) => (
              <Field key={k} label={l} style={{ marginBottom: 8 }}><input type="time" value={shift[k]} onChange={e => setShift(k, e.target.value)} style={inputStyle} /></Field>
            ))}
            <Field label="Sábado início" style={{ marginBottom: 0 }}><input type="time" value={shift.satStart} onChange={e => setShift("satStart", e.target.value)} style={inputStyle} /></Field>
            <Field label="Sábado fim" style={{ marginBottom: 0 }}><input type="time" value={shift.satEnd} onChange={e => setShift("satEnd", e.target.value)} style={inputStyle} /></Field>
          </div>
          {Math.abs(shiftHours - (calendarSettings.segunda ?? 8)) > 0.01 && (
            <div style={{ marginTop: 12, fontSize: 12, color: C.yellow, fontFamily: F }}>⚠ O expediente de seg–sex soma {shiftHours.toLocaleString("pt-BR")}h, mas a capacidade de segunda está em {calendarSettings.segunda}h. Isso é normal se nem todo o expediente é produtivo — só confira se é intencional.</div>
          )}
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

// Tarja de aviso de capacidade — informativa, nunca bloqueia agendamento
function CapacityBanner({ compact = false, children }) {
  return (
    <div style={{ background: C.danger, color: "#fff", fontFamily: FH, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", borderRadius: compact ? 4 : 6, padding: compact ? "2px 6px" : "8px 14px", fontSize: compact ? 9 : 12, marginBottom: compact ? 5 : 12, textAlign: compact ? "center" : "left" }}>
      ⚠ Capacidade máxima atingida{children}
    </div>
  );
}

// ============================================================
// DROP ZONE — extracted to module level to prevent remount on each drag/state change
// ============================================================
function DropZone({ title, zone, items, color, onDragStart, onDrop, onSelect, onEdit, readOnly, renderExtra, selectedId }) {
  return (
    <div data-zone={zone} onDragOver={e => { if (readOnly) return; e.preventDefault(); e.currentTarget.style.borderColor = color; }} onDragLeave={e => { e.currentTarget.style.borderColor = C.border; }} onDrop={e => { if (readOnly) return; e.preventDefault(); e.currentTarget.style.borderColor = C.border; onDrop(zone); }}
      style={{ flex: 1, background: C.dark, borderRadius: 10, border: `2px dashed ${C.border}`, padding: 14, minHeight: 170, maxHeight: 300, overflow: "auto", transition: "border-color 0.2s" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color, marginBottom: 10, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />{title}
        <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginLeft: "auto" }}>{items.length}</span>
      </div>
      {items.map(o => (
        <div key={o.id} data-order={o.id} draggable={!readOnly} onDragStart={() => onDragStart(o.id)} onClick={() => zone === "executing" && onSelect(o.id)}
          onDoubleClick={() => onEdit(o.id)}
          style={{ padding: "10px 14px", borderRadius: 8, background: C.darkCard, border: `1px solid ${selectedId === o.id ? color : C.border}`, cursor: readOnly ? "pointer" : "grab", marginBottom: 6, transition: "transform 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontWeight: 800, color: C.text, fontSize: 13, fontFamily: F }}>{o.client}</div>
            {renderExtra && renderExtra(o)}
          </div>
          <div style={{ color: C.textMuted, fontSize: 11, fontFamily: F, marginTop: 2 }}>#{o.orderNumber} · {fmtSec(orderTotalTime(o))}</div>
        </div>
      ))}
      {items.length === 0 && <div style={{ color: C.textDim, fontSize: 12, textAlign: "center", fontFamily: F, padding: 16 }}>{readOnly ? "Nenhum pedido" : "Arraste pedidos aqui"}</div>}
    </div>
  );
}

// ============================================================
// PAGE 3: DEMANDAS EM ABERTO
// ============================================================
function OpenDemandsPage({ orders, updateOrder, setEditingOrderId, setActivePage, logistics, saveLogistics, currentUser, startExecution, pauseExecution, completeOrder, shift, isWorkDay }) {
  const today = getToday(); const tomorrow = getTomorrow();
  const readOnly = currentUser?.role === "vendedor";
  const [selectedExec, setSelectedExec] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [deliverModal, setDeliverModal] = useState(null); // { orderId, hasMissing, location }
  const [missingCode, setMissingCode] = useState("");
  const [missingQtyInput, setMissingQtyInput] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [pauseReq, setPauseReq] = useState(null);         // { id, target }
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 30000); return () => clearInterval(t); }, []);

  const firstDay = o => { const d = normalizeDays(effectiveDays(o)); return d.length ? d[0].date : ""; };
  const hasDay = (o, day) => effectiveDays(o).some(pd => pd.date === day);
  const scheduled = orders.filter(o => o.status === "scheduled");
  // Hoje = programados para hoje + atrasados (dia de produção já passou e não foi iniciado)
  const todayOrders = scheduled.filter(o => { const f = firstDay(o); return f && f <= today; }).sort((a, b) => firstDay(a).localeCompare(firstDay(b)));
  const executingOrders = orders.filter(o => o.status === "executing");
  const tomorrowOrders = scheduled.filter(o => !todayOrders.includes(o) && hasDay(o, tomorrow));
  const isLate = o => o.status === "scheduled" && firstDay(o) && firstDay(o) < today;

  function scheduleFor(o, target) {
    const day = target === "tomorrow" ? tomorrow : today;
    const f = firstDay(o);
    if (target === "today" && f && f <= today) return {};           // já aparece em Hoje
    if (target === "tomorrow" && f === tomorrow) return {};
    return shiftDistribution(o, day, isWorkDay);
  }
  function handleDrop(zone) {
    if (!dragItem || readOnly) return;
    const o = orders.find(x => x.id === dragItem); setDragItem(null);
    if (!o) return;
    if (zone === "executing") {
      if (o.status === "executing") return;
      const others = executingOrders.filter(x => x.id !== o.id);
      if (others.length) {
        setConfirm({
          message: `Já ${others.length === 1 ? "existe 1 pedido" : `existem ${others.length} pedidos`} em execução (${others.map(x => "#" + x.orderNumber).join(", ")}).\n\nOs cronômetros vão contar em paralelo, e o tempo de cada pedido ficará maior que o real de bancada.\n\nIniciar #${o.orderNumber} mesmo assim?`,
          onYes: () => { setConfirm(null); startExecution(o.id); setSelectedExec(o.id); }, onNo: () => setConfirm(null),
        });
      } else { startExecution(o.id); setSelectedExec(o.id); }
      return;
    }
    if (o.status === "executing") { setPauseReq({ id: o.id, target: zone }); return; }
    const ch = scheduleFor(o, zone);
    if (!Object.keys(ch).length) return;
    updateOrder(o.id, ch, { type: "reprogramado", details: { daysBefore: normalizeDays(effectiveDays(o)), daysAfter: ch.productionDays, mode: `Demandas em Aberto → ${zone === "today" ? "Hoje" : "Amanhã"}` } });
  }
  function confirmPause(reason) {
    const o = orders.find(x => x.id === pauseReq.id); const target = pauseReq.target; setPauseReq(null);
    if (!o) return;
    pauseExecution(o.id, reason, scheduleFor(o, target));
    if (selectedExec === o.id) setSelectedExec(null);
  }
  function toggleItem(orderId, code) {
    if (readOnly) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const done = !order.itemsCompleted[code];
    updateOrder(orderId, { itemsCompleted: { ...order.itemsCompleted, [code]: done } }, { type: "item_concluido", details: { code, done } });
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
    updateOrder(orderId, { missingItems: updated }, { type: "faltante_adicionado", details: { code, qty } });
    setMissingCode(""); setMissingQtyInput("");
  }
  function removeMissingItem(orderId, code) {
    const order = orders.find(o => o.id === orderId); if (!order) return;
    const m = (order.missingItems || []).find(x => x.code === code);
    updateOrder(orderId, { missingItems: (order.missingItems || []).filter(m => m.code !== code) }, { type: "faltante_removido", details: { code, qty: m?.qty } });
  }
  function toggleMissingDelivered(orderId, code) {
    const order = orders.find(o => o.id === orderId); if (!order) return;
    const m = (order.missingItems || []).find(x => x.code === code);
    updateOrder(orderId, { missingItems: (order.missingItems || []).map(m => m.code === code ? { ...m, delivered: !m.delivered } : m) },
      m && !m.delivered ? { type: "faltante_entregue", details: { code, qty: m.qty } } : { type: "faltante_adicionado", details: { code, qty: m?.qty, note: "Marcado de volta como pendente" } });
  }
  function deliverOrder(id) {
    const order = orders.find(o => o.id === id);
    const hasMissing = order && order.items.length > 0 && !order.items.every(i => order.itemsCompleted[i.code]);
    setDeliverModal({ orderId: id, hasMissing, location: "" });
  }
  function confirmDeliver() {
    if (!deliverModal || !deliverModal.location.trim()) return;
    const { orderId, location } = deliverModal;
    completeOrder(orderId, location.trim());
    const existing = (logistics || {})[String(orderId)] || {};
    if (saveLogistics) saveLogistics({ ...(logistics || {}), [String(orderId)]: { ...existing, completionDate: getToday(), location: location.trim() } });
    setSelectedExec(null);
    setDeliverModal(null);
  }

  const execOrder = (selectedExec && executingOrders.find(o => o.id === selectedExec)) || executingOrders[0] || null;
  const totalProd = execOrder ? orderTotalTime(execOrder) : 0;
  const doneProd = execOrder ? execOrder.items.filter(i => execOrder.itemsCompleted[i.code]).reduce((s, i) => s + i.productionTime, 0) : 0;
  const execT = execOrder ? execTotals(execOrder, shift, isWorkDay) : null;

  const editOrder = useCallback((id) => { setEditingOrderId(id); setActivePage("demand"); }, [setEditingOrderId, setActivePage]);
  const timerTag = o => { if (!(o.execSessions || []).length) return <span title="Iniciado antes da v1.5.0 — o cronômetro começa na próxima vez que entrar em execução" style={{ fontSize: 10, fontWeight: 700, fontFamily: FH, color: C.textDim, whiteSpace: "nowrap" }}>sem cronômetro</span>; const t = execTotals(o, shift, isWorkDay); const over = t.business > orderTotalTime(o); return <span title="Tempo de execução (expediente)" style={{ fontSize: 11, fontWeight: 800, fontFamily: FH, color: over ? C.danger : C.green, whiteSpace: "nowrap" }}>⏱ {fmtSec(t.business)}</span>; };
  const lateTag = o => isLate(o) ? <span style={{ fontSize: 9, fontWeight: 800, fontFamily: FH, padding: "2px 6px", borderRadius: 4, background: C.danger, color: "#fff", whiteSpace: "nowrap", height: "fit-content" }}>ATRASADO {fmtDate(firstDay(o))}</span> : null;
  const pausingOrder = pauseReq ? orders.find(x => x.id === pauseReq.id) : null;

  return (
    <div style={{ padding: 24, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box" }}>
      <ConfirmDialog open={!!confirm} message={confirm?.message || ""} onYes={confirm?.onYes} onNo={confirm?.onNo} />
      <ReasonModal open={!!pauseReq} title="Retirar pedido de produção?"
        message={pausingOrder ? `#${pausingOrder.orderNumber} — ${pausingOrder.client}\nO pedido ainda não foi concluído. O cronômetro será pausado e o pedido volta para "${pauseReq.target === "tomorrow" ? "Programado Amanhã" : "Programado Hoje"}".\n\nDeseja retirar este pedido de produção? Explique o motivo.` : ""}
        confirmLabel="Sim, retirar" color={C.yellow} onConfirm={confirmPause} onCancel={() => setPauseReq(null)} />
      <Modal open={!!deliverModal} onClose={() => setDeliverModal(null)} title="Confirmar Entrega" width={440}>
        {deliverModal && (
          <div>
            {deliverModal.hasMissing && (
              <div style={{ padding: "10px 14px", borderRadius: 6, background: C.yellowDim, color: C.yellow, fontSize: 13, fontFamily: F, marginBottom: 16, border: `1px solid ${C.yellow}30` }}>
                ⚠ Alguns itens não foram concluídos. Eles ficarão registrados no histórico do pedido.
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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Demandas em Aberto</h1>
          {readOnly && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: C.darkInput, color: C.textMuted, fontFamily: FH, letterSpacing: "0.06em", textTransform: "uppercase" }}>Somente visualização</span>}
        </div>
        <span style={{ fontSize: 13, color: C.textMuted, fontFamily: F }}>{getDayName(today)} — {fmtDateFull(today)}</span>
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
        <DropZone title="Em Execução" zone="executing" items={executingOrders} color={C.green} onDragStart={setDragItem} onDrop={handleDrop} onSelect={setSelectedExec} onEdit={editOrder} readOnly={readOnly} renderExtra={timerTag} selectedId={execOrder?.id} />
        <DropZone title="Programado Hoje" zone="today" items={todayOrders} color={C.red} onDragStart={setDragItem} onDrop={handleDrop} onSelect={setSelectedExec} onEdit={editOrder} readOnly={readOnly} renderExtra={lateTag} />
        <DropZone title="Programado Amanhã" zone="tomorrow" items={tomorrowOrders} color={C.steel} onDragStart={setDragItem} onDrop={handleDrop} onSelect={setSelectedExec} onEdit={editOrder} readOnly={readOnly} />
      </div>
      {execOrder && execOrder.status === "executing" && (
        <div style={{ flex: 1, minHeight: 0, background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            {[["Cliente", execOrder.client, C.text], ["Pedido", "#" + execOrder.orderNumber, C.red], ["Entrega", fmtDateFull(execOrder.deliveryDate), C.text],
              ["Estimado", fmtSec(totalProd), C.text], ["Restante (itens)", fmtSec(totalProd - doneProd), C.yellow],
              ["Em execução", !execT.sessions ? "sem cronômetro" : fmtSec(execT.business) + (execT.pauses ? ` · ${execT.pauses} pausa${execT.pauses > 1 ? "s" : ""}` : ""), execT.business > totalProd ? C.danger : C.green]].map(([l, v, c]) => (
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
                  <button disabled={readOnly} onClick={() => { if (!execOrder.itemsCompleted[item.code]) toggleItem(execOrder.id, item.code); }} style={{ padding: "5px 14px", borderRadius: 5, border: "none", background: execOrder.itemsCompleted[item.code] ? C.green : C.darkInput, color: execOrder.itemsCompleted[item.code] ? "#fff" : C.textMuted, cursor: readOnly ? "default" : "pointer", fontFamily: FH, fontSize: 12, fontWeight: 700 }}>Sim</button>
                  <button disabled={readOnly} onClick={() => { if (execOrder.itemsCompleted[item.code]) toggleItem(execOrder.id, item.code); }} style={{ padding: "5px 14px", borderRadius: 5, border: "none", background: !execOrder.itemsCompleted[item.code] ? C.dangerDim : C.darkInput, color: !execOrder.itemsCompleted[item.code] ? C.danger : C.textMuted, cursor: readOnly ? "default" : "pointer", fontFamily: FH, fontSize: 12, fontWeight: 700 }}>Não</button>
                </div>
              </div>
            ))}
          </div>

          {!readOnly && (<>
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
            <Btn variant="custom" onClick={() => deliverOrder(execOrder.id)}
              style={{ width: "100%", padding: 14, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.06em", background: allDone(execOrder) ? C.green : C.yellow, color: "#fff" }}>
              {allDone(execOrder) ? "Entregar Demanda" : "⚠ Entregar com Faltantes"}
            </Btn>
          </div>
          </>)}
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

  const filtered = filterByPeriod(orders.filter(isActiveOrder));
  const planningCount = orders.filter(o => o.status === "planning").length;
  const cancelledCount = filterByPeriod(orders.filter(o => o.status === "cancelled")).length;
  const completed = filtered.filter(o => o.status === "completed");
  // Tempos de execução medidos (v1.5.0+: expediente) — só pedidos concluídos com cronômetro
  const timed = completed.filter(o => o.execSeconds !== null && o.execSeconds !== undefined && o.execSeconds > 0);
  const timedEst = timed.reduce((s, o) => s + orderTotalTime(o), 0);
  const timedReal = timed.reduce((s, o) => s + o.execSeconds, 0);
  const timedEff = timedReal ? Math.round((timedEst / timedReal) * 100) : null;
  const timedPauses = timed.reduce((s, o) => s + (o.execSessions || []).filter(x => x.endType === "pause").length, 0);
  const worst = [...timed].map(o => ({ o, dev: o.execSeconds - orderTotalTime(o) })).sort((a, b) => b.dev - a.dev).slice(0, 5);
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
  const occDays = []; for (let d = 0; d < 14; d++) { const dt = addDays(today, d); const dk = getDayKey(dt); const dw = new Date(dt + "T12:00:00").getDay(); if (dw === 0) continue; const h = dayOverrides[dt] !== undefined ? dayOverrides[dt] : (calendarSettings[dk] ?? 8); if (h === 0) continue; const m = orders.filter(isActiveOrder).reduce((s, o) => s + getOrderSecondsForDay(o, dt), 0); occDays.push({ date: dt, occ: Math.round((m / (h * 3600)) * 100) }); }
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
          {[["Planejamento (fila)", planningCount, C.orange], ["Programados", scheduled.length, C.red], ["Em Execução", executing.length, C.yellow], ["Concluídos", completed.length, C.green], ["Atrasados", overdue.length, C.danger], ["Cancelados", cancelledCount, C.textDim]].map(([l, n, c]) => (
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

      {/* Tempo estimado × real */}
      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 22, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Tempo de Execução — Estimado × Real</h3>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: F, marginBottom: 16 }}>Pedidos concluídos com cronômetro (tempo dentro do expediente). {timed.length === 0 ? "Ainda não há pedidos medidos neste período." : ""}</div>
        {timed.length > 0 && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
            {[["Pedidos medidos", timed.length, C.text], ["Estimado", fmtSec(timedEst), C.steel], ["Real", fmtSec(timedReal), C.yellow], ["Eficiência", timedEff + "%", timedEff >= 100 ? C.green : timedEff >= 80 ? C.yellow : C.danger], ["Pausas", timedPauses, C.textMuted]].map(([l, v, c]) => (
              <div key={l} style={{ background: C.dark, borderRadius: 8, border: `1px solid ${C.border}`, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: C.textDim, fontFamily: FH, textTransform: "uppercase", fontWeight: 700 }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: c, fontFamily: FH }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.textDim, fontFamily: F, marginBottom: 8 }}>Eficiência = estimado ÷ real. Acima de 100% = mais rápido que o estimado. Maiores desvios:</div>
          {worst.map(({ o, dev }) => (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "100px 2fr 1fr 1fr 1fr", padding: "7px 0", borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.text, fontFamily: F }}>
              <span style={{ color: C.red, fontWeight: 700 }}>#{o.orderNumber}</span><span>{o.client}</span>
              <span>Est. {fmtSec(orderTotalTime(o))}</span><span>Real {fmtSec(o.execSeconds)}</span>
              <span style={{ color: dev > 0 ? C.danger : C.green, fontWeight: 700 }}>{dev > 0 ? "+" : "−"}{fmtSec(Math.abs(dev))}</span>
            </div>
          ))}
        </>)}
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
function ExportPage({ orders, registeredItems, fetchAllEvents, logistics }) {
  const [exportType, setExportType] = useState("orders");
  const [format, setFormat] = useState("csv");
  const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exportSuccess, setExportSuccess] = useState(null);
  const [events, setEvents] = useState(null);       // histórico carregado sob demanda
  const [eventsErr, setEventsErr] = useState(null);
  useEffect(() => {
    if (exportType !== "history" || events !== null) return;
    fetchAllEvents().then(r => { setEvents(r.events); setEventsErr(r.error ? "Não foi possível carregar o histórico do servidor (a tabela order_events existe?)." : null); });
  }, [exportType]);

  // Separador ";" — padrão do Excel em português (com "," tudo caía numa coluna só)
  const SEP = ";";
  function esc(v) { const s = String(v ?? ""); return (s.includes(SEP) || s.includes('"') || s.includes("\n") || s.includes("\r")) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  const hrs = sec => sec === null || sec === undefined || sec === "" ? "" : (sec / 3600).toFixed(2).replace(".", ",");
  const toCsv = rows => rows.map(r => r.map(esc).join(SEP)).join("\n");
  const localDay = iso => iso ? localDateStr(new Date(iso)) : "";

  function getFiltered() {
    let r = [...orders];
    if (statusFilter !== "all") r = r.filter(o => o.status === statusFilter);
    // Pedidos em planejamento/cancelados não têm dia de produção — usa a entrega como referência
    const refDate = o => o.productionStart || o.deliveryDate || "";
    if (startDate) r = r.filter(o => refDate(o) >= startDate);
    if (endDate) r = r.filter(o => refDate(o) <= endDate);
    return r;
  }

  function getFilteredEvents() {
    let r = events || [];
    if (startDate) r = r.filter(e => localDay(e.ts) >= startDate);
    if (endDate) r = r.filter(e => localDay(e.ts) <= endDate);
    return r;
  }

  function genCSV() {
    const data = exportType === "items" || exportType === "history" ? null : getFiltered();
    if (exportType === "items") {
      const rows = [["Código", "Descrição", "Tempo (seg)", "Tempo"]];
      registeredItems.forEach(i => rows.push([i.code, i.description, i.productionTime, fmtSec(i.productionTime)]));
      return toCsv(rows);
    }
    if (exportType === "history") {
      const rows = [["Data", "Hora", "Data/Hora ISO", "Pedido", "Cliente", "ID Pedido", "Evento", "Código evento", "Usuário", "Motivo", "Detalhes"]];
      getFilteredEvents().forEach(e => {
        const d = new Date(e.ts);
        rows.push([localDay(e.ts), isNaN(d) ? "" : d.toTimeString().slice(0, 8), e.ts, e.order_number, e.client, e.order_id, (EVENT_META[e.type] || {}).label || e.type, e.type, e.user_name || e.username || "", e.details?.reason || "", describeEvent(e)]);
      });
      return toCsv(rows);
    }
    if (exportType === "orders") {
      const rows = [["Cliente", "Pedido", "Status", "Entrega", "Entrega original", "Início prod.", "Fim prod.", "Dias de produção", "Itens", "Unidades", "Tempo estimado (seg)", "Tempo estimado (h)",
        "Cadastrado em", "Cadastrado por", "Planejado em", "Planejado por", "Início execução", "Iniciado por", "Concluído em", "Concluído por",
        "Execução expediente (seg)", "Execução expediente (h)", "Execução relógio (h)", "Pausas", "Eficiência (%)", "Horas cadastro→conclusão", "Faturado em", "Expedido",
        "Cancelado em", "Cancelado por", "Motivo cancelamento", "Itens faltantes pendentes", "Obs"]];
      data.forEach(o => {
        const est = orderTotalTime(o); const lg = (logistics || {})[String(o.id)] || {};
        const pauses = (o.execSessions || []).filter(x => x.endType === "pause").length;
        const created = o.createdAtTs || o.createdAt;
        const leadH = created && o.completedAt ? ((new Date(o.completedAt) - new Date(created)) / 3600000).toFixed(1).replace(".", ",") : "";
        rows.push([o.client, o.orderNumber, STATUS_LABEL[o.status] || o.status, o.deliveryDate, o.originalDeliveryDate || "", o.productionStart, o.productionEnd, fmtDaysList(o.productionDays), o.items.length, o.items.reduce((s, i) => s + i.quantity, 0), est, hrs(est),
          fmtDateTime(created), o.createdBy, fmtDateTime(o.plannedAt), o.plannedBy, fmtDateTime(o.executedAt), o.executedBy, fmtDateTime(o.completedAt), o.completedBy,
          o.execSeconds ?? "", hrs(o.execSeconds), hrs(o.execWallSeconds), (o.execSessions || []).length ? pauses : "", o.execSeconds ? Math.round(est / o.execSeconds * 100) : "", leadH,
          lg.invoiceDate ? fmtDateFull(lg.invoiceDate) : "", lg.collected ? "Sim" : "Não",
          fmtDateTime(o.cancelledAt), o.cancelledBy, o.cancelReason, (o.missingItems || []).filter(m => !m.delivered).map(m => `${m.code}×${m.qty}`).join(", "), o.observations || ""]);
      });
      return toCsv(rows);
    }
    if (exportType === "order-detail") {
      const rows = [["Cliente", "Pedido", "Status", "Código", "Descrição", "Qtd", "Tempo (seg)", "Tempo catálogo unit. (seg)", "Tempo ajustado", "Concluído"]];
      data.forEach(o => o.items.forEach(i => rows.push([o.client, o.orderNumber, STATUS_LABEL[o.status] || o.status, i.code, i.description, i.quantity, i.productionTime, i.catalogTime ?? "", i.adjusted ? "Sim" : "Não", o.itemsCompleted?.[i.code] ? "Sim" : "Não"])));
      return toCsv(rows);
    }
    // report
    const rows = [["RELATÓRIO DE PRODUÇÃO"], ["Gerado", new Date().toLocaleString("pt-BR")], [], ["Resumo"], ["Total Pedidos", data.length], ["Concluídos", data.filter(o => o.status === "completed").length], ["Em Execução", data.filter(o => o.status === "executing").length], ["Programados", data.filter(o => o.status === "scheduled").length], ["Unidades", data.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0)], ["Tempo Total (seg)", data.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.productionTime, 0), 0)], ["Planejamento", data.filter(o => o.status === "planning").length], ["Cancelados", data.filter(o => o.status === "cancelled").length]];
    return toCsv(rows);
  }

  function genJSON() {
    if (exportType === "items") return JSON.stringify(registeredItems, null, 2);
    if (exportType === "history") return JSON.stringify(getFilteredEvents(), null, 2);
    return JSON.stringify(getFiltered().map(o => ({ ...o, totalUnits: o.items.reduce((s, i) => s + i.quantity, 0), totalMinutes: o.items.reduce((s, i) => s + i.productionTime, 0) })), null, 2);
  }

  function doExport() {
    const content = format === "csv" ? "\uFEFF" + genCSV() : genJSON();
    const ext = format === "csv" ? ".csv" : ".json";
    const names = { orders: "pedidos", "order-detail": "pedidos_detalhado", items: "itens", report: "relatorio", history: "historico_eventos" };
    const filename = (names[exportType] || "export") + "_" + getToday() + ext;
    const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8;" : "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setExportSuccess(filename); setTimeout(() => setExportSuccess(null), 4000);
  }

  const preview = format === "csv" ? genCSV() : genJSON();
  const lines = preview.split("\n");
  const count = exportType === "items" ? registeredItems.length : exportType === "history" ? getFilteredEvents().length : getFiltered().length;

  const types = [
    { id: "orders", label: "Pedidos (Resumo)", desc: "Lista resumida com totais", icon: "📋" },
    { id: "order-detail", label: "Pedidos (Detalhado)", desc: "Cada item em linha separada", icon: "📑" },
    { id: "items", label: "Itens Cadastrados", desc: "Catálogo completo", icon: "📦" },
    { id: "report", label: "Relatório", desc: "Resumo gerencial", icon: "📊" },
    { id: "history", label: "Histórico", desc: "Todos os eventos de todos os pedidos", icon: "🕘" },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 28px", fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Exportação de Dados</h1>

      <div style={{ marginBottom: 24 }}>
        <label style={{ ...labelStyle, marginBottom: 10 }}>O que exportar?</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
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
          {exportType !== "items" && exportType !== "history" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
              <Field label="De" style={{ marginBottom: 0 }}><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} /></Field>
              <Field label="Até" style={{ marginBottom: 0 }}><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} /></Field>
              <Field label="Status" style={{ marginBottom: 0 }}><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}><option value="all">Todos</option><option value="scheduled">Programados</option><option value="executing">Em Execução</option><option value="completed">Concluídos</option><option value="planning">Planejamento</option><option value="cancelled">Cancelados</option></select></Field>
            </div>
          )}
          {exportType === "history" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
              <Field label="De (data do evento)" style={{ marginBottom: 0 }}><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} /></Field>
              <Field label="Até" style={{ marginBottom: 0 }}><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} /></Field>
            </div>
          )}
          {exportType === "history" && events === null && <div style={{ fontSize: 12, color: C.textMuted, fontFamily: F }}>Carregando histórico...</div>}
          {exportType === "history" && eventsErr && <div style={{ fontSize: 12, color: C.yellow, fontFamily: F }}>⚠ {eventsErr}</div>}
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
function LogisticsPage({ orders, logistics, saveLogistics, updateOrder, logEvent, readOnly = false }) {
  const orderById = id => orders.find(o => o.id === id) || { id };
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
    const m = (order.missingItems || []).find(x => x.code === code);
    updateOrder(orderId, { missingItems: (order.missingItems || []).map(m => m.code === code ? { ...m, delivered: !m.delivered } : m) }, { type: "faltante_entregue", details: { code, qty: m?.qty } });
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
    updateOrder(addMissingFor.orderId, { missingItems: updated }, { type: "faltante_adicionado", details: { code, qty } });
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
    logEvent(orderById(faturarModal.orderId), "faturado", { carrier: faturarModal.carrier });
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
    logEvent(orderById(localModal.orderId), "localizacao", { location: localModal.location });
    setLocalModal(null);
  }

  // Expedido: confirmação
  function requestExpedir(o) {
    setConfirm({
      message: `Confirmar expedição do pedido #${o.orderNumber} — ${o.client}? O pedido sairá da logística e ficará verde no calendário.`,
      onYes: () => { updateLogi(o.id, { collected: true, collectedDate: today }); logEvent(o, "expedido", {}); setConfirm(null); },
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
    const lg = getLogi(editarModal.orderId); const changes = {};
    if (lg.carrier !== editarModal.carrier) changes["Transportadora"] = [lg.carrier, editarModal.carrier];
    if (lg.location !== editarModal.location) changes["Localização"] = [lg.location, editarModal.location];
    if (lg.invoiceDate !== editarModal.invoiceDate) changes["Data faturamento"] = [fmtDateFull(lg.invoiceDate), fmtDateFull(editarModal.invoiceDate)];
    updateLogi(editarModal.orderId, { carrier: editarModal.carrier, location: editarModal.location, invoiceDate: editarModal.invoiceDate });
    if (Object.keys(changes).length) logEvent(orderById(editarModal.orderId), "logistica_editada", { changes });
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

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Logística</h1>
        {readOnly && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: C.darkInput, color: C.textMuted, fontFamily: FH, letterSpacing: "0.06em", textTransform: "uppercase" }}>Somente visualização</span>}
      </div>

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
                    {readOnly ? <span /> : <button onClick={() => openLocal(o)} title="Editar localização" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13 }}>✎</button>}
                  </div>
                  {/* itens faltantes */}
                  <div style={{ padding: "0 20px 14px 36px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: C.danger, fontFamily: FH, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>
                        Peças Faltantes ({missing.length})
                      </span>
                      {!readOnly && <button onClick={() => setAddMissingFor({ orderId: o.id, code: "", qty: "" })}
                        style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>
                        + Adicionar Peça
                      </button>}
                    </div>
                    {missing.map(m => (
                      <div key={m.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 6, background: C.dark, border: `1px solid ${C.border}`, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: C.red, fontFamily: FH, fontSize: 12, flex: 2 }}>{m.code}</span>
                        <span style={{ color: C.textMuted, fontFamily: F, fontSize: 12, flex: 1 }}>Qtd {m.qty}</span>
                        {!readOnly && <button onClick={() => toggleMissingDelivered(o.id, m.code)}
                          style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${C.green}55`, background: C.greenDim, color: C.green, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                          ✓ Marcar Entregue
                        </button>}
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
                  {readOnly ? <span /> : <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openFaturar(o)}
                      style={{ padding: "5px 14px", borderRadius: 5, border: `1px solid ${C.yellow}55`, background: C.yellowDim, color: C.yellow, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>
                      Faturar
                    </button>
                    <button onClick={() => openLocal(o)} title="Editar localização" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13 }}>✎</button>
                  </div>}
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
                {readOnly ? <span style={{ color: C.textDim, fontSize: 12 }}>Não</span> : <button onClick={() => requestExpedir(o)}
                  style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${C.green}55`, background: C.greenDim, color: C.green, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>
                  Expedido
                </button>}
                {readOnly ? <span /> : <button onClick={() => openEditar(o)}
                  style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>
                  ✎
                </button>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE: PLANEJAMENTO DE PRODUÇÃO (fila de pedidos sem itens + cancelados)
// ============================================================
function PlanningPage({ orders, currentUser, setEditingOrderId, setActivePage, reactivateOrder, deleteOrder, fetchEvents, eventsVersion, logistics, shift, isWorkDay }) {
  const role = currentUser?.role;
  const canPlan = role === "gestor" || role === "montador";
  const isGestor = role === "gestor";
  const today = getToday();
  const [showCancelled, setShowCancelled] = useState(false);
  const [historyFor, setHistoryFor] = useState(null);
  const [reactivateFor, setReactivateFor] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const queue = orders.filter(o => o.status === "planning").sort((a, b) => (a.deliveryDate || "").localeCompare(b.deliveryDate || ""));
  const cancelled = orders.filter(o => o.status === "cancelled").sort((a, b) => String(b.cancelledAt || "").localeCompare(String(a.cancelledAt || "")));
  const daysTo = ds => ds ? Math.round((new Date(ds + "T12:00:00") - new Date(today + "T12:00:00")) / 86400000) : null;
  const open = id => { setEditingOrderId(id); setActivePage("demand"); };
  const H = { padding: "8px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em", display: "grid", alignItems: "center", gap: 8 };
  const R = { padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, display: "grid", alignItems: "center", gap: 8 };
  const QCOLS = "90px 1.6fr 110px 120px 150px 1.4fr 110px";
  const CCOLS = "90px 1.4fr 140px 2fr 190px";
  const hOrder = historyFor ? orders.find(o => o.id === historyFor) : null;

  return (
    <div style={{ padding: 32, maxWidth: 1300, margin: "0 auto" }}>
      <ConfirmDialog open={!!confirm} message={confirm?.message || ""} onYes={confirm?.onYes} onNo={confirm?.onNo} />
      <ReasonModal open={!!reactivateFor} title="Reativar pedido" message={reactivateFor ? `#${reactivateFor.orderNumber} — ${reactivateFor.client}\nO pedido volta para a fila de Planejamento (sem dias de produção definidos).` : ""}
        confirmLabel="Reativar" color={C.orange} onConfirm={r => { reactivateOrder(reactivateFor.id, r); setReactivateFor(null); }} onCancel={() => setReactivateFor(null)} />
      <Modal open={!!hOrder} onClose={() => setHistoryFor(null)} title={hOrder ? `Histórico — #${hOrder.orderNumber} ${hOrder.client}` : ""} width={720}>
        {hOrder && <OrderHistory order={hOrder} fetchEvents={fetchEvents} eventsVersion={eventsVersion} logistics={logistics} shift={shift} isWorkDay={isWorkDay} />}
      </Modal>

      <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Planejamento de Produção</h1>
      <div style={{ fontSize: 13, color: C.textMuted, fontFamily: F, marginBottom: 24 }}>Pedidos que entraram só com cliente, número e entrega. {canPlan ? "Clique em Planejar para definir itens, tempos e dias de produção." : "Aguardando o montador definir itens e dias."}</div>

      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.orange, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em" }}>🗂 Fila de Planejamento</span>
          <span style={{ fontSize: 12, color: C.textMuted, fontFamily: F }}>({queue.length})</span>
        </div>
        <div style={{ ...H, gridTemplateColumns: QCOLS }}><span>Pedido</span><span>Cliente</span><span>Entrega</span><span>Prazo</span><span>Cadastrado</span><span>Observações</span><span /></div>
        {queue.length === 0 && <div style={{ padding: 28, textAlign: "center", color: C.textDim, fontSize: 13, fontFamily: F }}>Nenhum pedido aguardando planejamento.</div>}
        {queue.map(o => {
          const d = daysTo(o.deliveryDate);
          const dc = d === null ? C.textDim : d < 0 ? C.danger : d <= 3 ? C.orange : C.green;
          return (
            <div key={o.id} data-planning={o.id} style={{ ...R, gridTemplateColumns: QCOLS }}>
              <span style={{ fontWeight: 800, color: C.red }}>#{o.orderNumber}</span>
              <span style={{ fontWeight: 700 }}>{o.client}</span>
              <span style={{ color: C.textMuted, fontSize: 12 }}>{fmtDateFull(o.deliveryDate)}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: dc, fontFamily: FH }}>{d === null ? "—" : d < 0 ? `ATRASADO ${-d}d` : d === 0 ? "HOJE" : `${d} dia${d > 1 ? "s" : ""}`}</span>
              <span style={{ color: C.textMuted, fontSize: 12 }}>{fmtDateTime(o.createdAt)}{o.createdBy ? <><br />{o.createdBy}</> : null}</span>
              <span style={{ color: C.textMuted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={o.observations}>{o.observations || "—"}</span>
              <Btn variant={canPlan ? "custom" : "ghost"} onClick={() => open(o.id)} style={canPlan ? { padding: "7px 14px", fontSize: 12, background: C.orange, color: "#fff" } : { padding: "7px 14px", fontSize: 12 }}>{canPlan ? "Planejar" : "Ver"}</Btn>
            </div>
          );
        })}
      </div>

      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <button onClick={() => setShowCancelled(v => !v)} style={{ width: "100%", padding: "14px 20px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: showCancelled ? `1px solid ${C.border}` : "none" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.textMuted, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em" }}>⛔ Pedidos Cancelados</span>
          <span style={{ fontSize: 12, color: C.textMuted, fontFamily: F }}>({cancelled.length})</span>
          <span style={{ marginLeft: "auto", color: C.textMuted }}>{showCancelled ? "▲" : "▼"}</span>
        </button>
        {showCancelled && (<>
          <div style={{ ...H, gridTemplateColumns: CCOLS }}><span>Pedido</span><span>Cliente</span><span>Cancelado</span><span>Motivo</span><span /></div>
          {cancelled.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.textDim, fontSize: 13, fontFamily: F }}>Nenhum pedido cancelado.</div>}
          {cancelled.map(o => (
            <div key={o.id} data-cancelled={o.id} style={{ ...R, gridTemplateColumns: CCOLS }}>
              <span style={{ fontWeight: 800, color: C.textMuted }}>#{o.orderNumber}</span>
              <span style={{ fontWeight: 700 }}>{o.client}</span>
              <span style={{ color: C.textMuted, fontSize: 12 }}>{fmtDateTime(o.cancelledAt)}{o.cancelledBy ? <><br />{o.cancelledBy}</> : null}</span>
              <span style={{ fontSize: 12 }}>{o.cancelReason || "—"}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button onClick={() => setHistoryFor(o.id)} style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.darkInput, color: C.textMuted, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>Histórico</button>
                {isGestor && <button onClick={() => setReactivateFor(o)} style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${C.orange}66`, background: C.orangeDim, color: C.orange, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>Reativar</button>}
                {isGestor && <button onClick={() => setConfirm({ message: `Excluir definitivamente o pedido cancelado #${o.orderNumber} — ${o.client}?\n\nO registro no histórico de eventos é mantido.\nEsta ação não pode ser desfeita.`, onYes: () => { setConfirm(null); deleteOrder(o.id); }, onNo: () => setConfirm(null) })} style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${C.danger}66`, background: C.dangerDim, color: C.danger, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 }}>Excluir</button>}
              </div>
            </div>
          ))}
        </>)}
      </div>
    </div>
  );
}

// ============================================================
// PAGE: CLIENTES (gestor) — cadastro, renomear, unificar duplicados
// ============================================================
function ClientsPage({ clientHistory, orders, addClient, renameClient, deleteClient }) {
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [renameFor, setRenameFor] = useState(null);   // { from, to }
  const [confirm, setConfirm] = useState(null);
  const [distinct, setDistinct] = useState(() => LS.get("pcp_bvn_client_distinct", []));

  const counts = {}; const lastDate = {};
  orders.forEach(o => { counts[o.client] = (counts[o.client] || 0) + 1; if (!lastDate[o.client] || (o.deliveryDate || "") > lastDate[o.client]) lastDate[o.client] = o.deliveryDate; });
  const unregistered = Object.keys(counts).filter(c => !clientHistory.includes(c)).sort();
  const pairKey = (a, b) => [a, b].sort().join("||");
  const pairs = [];
  clientHistory.forEach(a => similarClients(a, clientHistory).forEach(b => { const k = pairKey(a, b); if (a < b && !distinct.includes(k)) pairs.push([a, b, k]); }));
  const list = [...clientHistory].sort().filter(c => c.toLowerCase().includes(search.toLowerCase()));
  const sim = newName ? similarClients(newName, clientHistory) : [];

  function markDistinct(k) { const n = [...distinct, k]; setDistinct(n); LS.set("pcp_bvn_client_distinct", n); }
  function askMerge(from, to) {
    setConfirm({ message: `Unificar "${from}" em "${to}"?\n\n${counts[from] || 0} pedido(s) de "${from}" passarão a ser de "${to}", e "${from}" sai do cadastro.\nFica registrado no histórico de cada pedido.`, onYes: () => { setConfirm(null); renameClient(from, to); }, onNo: () => setConfirm(null) });
  }
  const small = (color) => ({ padding: "5px 10px", borderRadius: 5, border: `1px solid ${color}66`, background: `${color}1f`, color, cursor: "pointer", fontFamily: FH, fontSize: 11, fontWeight: 700 });

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <ConfirmDialog open={!!confirm} message={confirm?.message || ""} onYes={confirm?.onYes} onNo={confirm?.onNo} />
      <Modal open={!!renameFor} onClose={() => setRenameFor(null)} title={`Renomear / unificar "${renameFor?.from || ""}"`} width={480}>
        {renameFor && (() => {
          const target = normName(renameFor.to); const exists = clientHistory.includes(target) && target !== renameFor.from;
          return (
            <div>
              <Field label="Novo nome (ou nome de um cliente existente para unificar)">
                <input value={renameFor.to} onChange={e => setRenameFor({ ...renameFor, to: e.target.value.toUpperCase() })} list="clients-dl" style={inputStyle} autoFocus />
                <datalist id="clients-dl">{clientHistory.filter(c => c !== renameFor.from).map(c => <option key={c} value={c} />)}</datalist>
              </Field>
              <div style={{ fontSize: 12, color: exists ? C.yellow : C.textMuted, fontFamily: F, marginBottom: 16 }}>
                {exists ? `"${target}" já existe — os ${counts[renameFor.from] || 0} pedido(s) serão UNIFICADOS nele.` : `${counts[renameFor.from] || 0} pedido(s) serão renomeados para "${target}".`}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <Btn variant="ghost" onClick={() => setRenameFor(null)}>Voltar</Btn>
                <Btn onClick={() => { if (target && target !== renameFor.from) { renameClient(renameFor.from, target); setRenameFor(null); } }} disabled={!target || target === renameFor.from}>{exists ? "Unificar" : "Renomear"}</Btn>
              </div>
            </div>
          );
        })()}
      </Modal>

      <h1 style={{ margin: "0 0 24px", fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FH, letterSpacing: "0.02em" }}>Clientes</h1>

      {pairs.length > 0 && (
        <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.yellow}40`, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: C.yellowDim }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.yellow, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.06em" }}>⚠ Possíveis duplicados ({pairs.length})</span>
            <div style={{ fontSize: 12, color: C.textMuted, fontFamily: F, marginTop: 2 }}>Nomes parecidos. Se forem a mesma empresa, unifique; se não, marque "São diferentes" para não aparecer mais.</div>
          </div>
          {pairs.map(([a, b, k]) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, padding: "10px 20px", borderBottom: `1px solid ${C.border}`, alignItems: "center", fontFamily: F, fontSize: 13 }}>
              <span><strong style={{ color: C.text }}>{a}</strong> <span style={{ color: C.textDim }}>({counts[a] || 0})</span></span>
              <span><strong style={{ color: C.text }}>{b}</strong> <span style={{ color: C.textDim }}>({counts[b] || 0})</span></span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => askMerge(b, a)} style={small(C.green)}>Manter {a.length > 14 ? a.slice(0, 14) + "…" : a}</button>
                <button onClick={() => askMerge(a, b)} style={small(C.green)}>Manter {b.length > 14 ? b.slice(0, 14) + "…" : b}</button>
                <button onClick={() => markDistinct(k)} style={small(C.steel)}>São diferentes</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {unregistered.length > 0 && (
        <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.orange}40`, padding: "14px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.orange, fontFamily: FH, textTransform: "uppercase", marginBottom: 8 }}>Nomes usados em pedidos mas fora do cadastro</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {unregistered.map(c => (
              <span key={c} style={{ display: "inline-flex", gap: 6, alignItems: "center", padding: "4px 8px", borderRadius: 6, background: C.dark, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, fontFamily: F }}>
                "{c}" ({counts[c]})
                <button onClick={() => normName(c) === c ? addClient(c) : renameClient(c, c)} style={small(C.orange)}>{normName(c) === c ? "Cadastrar" : "Corrigir"}</button>
                <button onClick={() => setRenameFor({ from: c, to: normName(c) })} style={small(C.steel)}>Unificar…</button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}`, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Novo cliente</label>
            <input value={newName} onChange={e => setNewName(e.target.value.toUpperCase())} placeholder="Nome do cliente" style={inputStyle} />
          </div>
          <Btn onClick={() => { if (normName(newName) && !clientHistory.includes(normName(newName))) { addClient(newName); setNewName(""); } }} disabled={!normName(newName) || clientHistory.includes(normName(newName))} style={{ height: 42 }}>{sim.length ? "Cadastrar mesmo assim" : "Cadastrar"}</Btn>
        </div>
        {clientHistory.includes(normName(newName)) && <div style={{ marginTop: 8, fontSize: 12, color: C.danger, fontFamily: F }}>Já cadastrado.</div>}
        {sim.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: C.yellow, fontFamily: F }}>⚠ Parecido com: {sim.join(", ")}</div>}
      </div>

      <div style={{ background: C.darkCard, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.04em" }}>Clientes Cadastrados ({clientHistory.length})</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." style={{ ...inputStyle, width: 220 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 130px 200px", padding: "8px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: FH, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span>Nome</span><span>Pedidos</span><span>Última entrega</span><span></span>
        </div>
        <div style={{ maxHeight: 480, overflow: "auto" }}>
          {list.map(c => (
            <div key={c} data-client={c} style={{ display: "grid", gridTemplateColumns: "2fr 90px 130px 200px", padding: "10px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: F, alignItems: "center" }}>
              <span style={{ fontWeight: 700 }}>{c}</span>
              <span>{counts[c] || 0}</span>
              <span style={{ color: C.textMuted, fontSize: 12 }}>{lastDate[c] ? fmtDateFull(lastDate[c]) : "—"}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setRenameFor({ from: c, to: c })} style={small(C.steel)}>Renomear / Unificar</button>
                {!counts[c] && <button onClick={() => setConfirm({ message: `Excluir o cliente "${c}" do cadastro?`, onYes: () => { setConfirm(null); deleteClient(c); }, onNo: () => setConfirm(null) })} style={small(C.danger)}>Excluir</button>}
              </div>
            </div>
          ))}
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
  orders.filter(isActiveOrder).forEach(o => {
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
    const m = (order.missingItems || []).find(x => x.code === code);
    updateOrder(orderId, { missingItems: (order.missingItems || []).map(m => m.code === code ? { ...m, delivered: true } : m) }, { type: "faltante_entregue", details: { code, qty: m?.qty } });
  }


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
  events:   'pcp_bvn_pending_events', // eventos de histórico ainda não enviados (offline/tabela ausente)
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
  const [eventsVersion, setEventsVersion] = useState(0);
  const [eventsTableMissing, setEventsTableMissing] = useState(false);
  const currentUserRef = useRef(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const shift = useMemo(() => ({ ...defaultShift, ...(calendarSettings.shift || {}) }), [calendarSettings]);
  const isWorkDay = useCallback(ds => hoursForDay(ds, calendarSettings, dayOverrides) > 0, [calendarSettings, dayOverrides]);

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
    return {
      id: o.id, client: o.client, orderNumber: o.order_number, deliveryDate: o.delivery_date, productionStart: o.production_start, productionEnd: o.production_end, status, observations: o.observations || '', items: o.items || [], itemsCompleted: o.items_completed || {}, productionDays: o.production_days || [], missingItems: o.missing_items || [],
      // rastreio (colunas created_by/executed_at/completed_at já existiam de versão antiga — reaproveitadas)
      createdAt: o.created_at || null, createdAtTs: o.created_at_ts || null, createdBy: o.created_by || '',
      plannedAt: o.planned_at || null, plannedBy: o.planned_by || '',
      executedAt: o.executed_at || null, executedBy: o.executed_by || '',
      completedAt: o.completed_at || null, completedBy: o.completed_by || '',
      execSessions: o.exec_sessions || [], execSeconds: o.exec_seconds ?? null, execWallSeconds: o.exec_wall_seconds ?? null,
      cancelReason: o.cancel_reason || '', cancelledAt: o.cancelled_at || null, cancelledBy: o.cancelled_by || '',
      originalDeliveryDate: o.original_delivery_date || null,
    };
  }
  // Campos JS → colunas do Supabase
  const ORDER_DB_FIELDS = {
    client: 'client', orderNumber: 'order_number', deliveryDate: 'delivery_date', productionStart: 'production_start', productionEnd: 'production_end',
    productionDays: 'production_days', status: 'status', observations: 'observations', items: 'items', itemsCompleted: 'items_completed',
    createdBy: 'created_by', plannedAt: 'planned_at', plannedBy: 'planned_by', executedAt: 'executed_at', executedBy: 'executed_by',
    completedAt: 'completed_at', completedBy: 'completed_by', execSessions: 'exec_sessions', execSeconds: 'exec_seconds', execWallSeconds: 'exec_wall_seconds',
    cancelReason: 'cancel_reason', cancelledAt: 'cancelled_at', cancelledBy: 'cancelled_by', originalDeliveryDate: 'original_delivery_date',
  };
  // Colunas criadas pelo script SQL da v1.5.0 — se ainda não existirem, o app grava sem elas em vez de falhar
  const NEW_COLS = ['planned_at', 'planned_by', 'exec_sessions', 'exec_seconds', 'exec_wall_seconds', 'cancel_reason', 'cancelled_at', 'cancelled_by', 'original_delivery_date'];
  const missingColsRef = useRef(false);
  function toDb(changes) {
    const db = {};
    Object.entries(ORDER_DB_FIELDS).forEach(([k, col]) => { if (changes[k] !== undefined) db[col] = changes[k]; });
    if (changes.missingItems !== undefined) {
      db.missing_items = changes.missingItems;
      db.has_complementary = changes.missingItems.length > 0;
      db.complementary_complete = changes.missingItems.length === 0 || changes.missingItems.every(i => i.delivered);
    }
    if (missingColsRef.current) NEW_COLS.forEach(c => delete db[c]);
    return db;
  }
  const isMissingColErr = e => e && (e.code === 'PGRST204' || /column .* does not exist|Could not find the .* column/i.test(e.message || ''));

  // ── Histórico: grava evento (servidor carimba data/hora); offline → fila local ──
  function logEvent(orderLike, type, details = {}) {
    const u = currentUserRef.current;
    const ev = { order_id: String(orderLike.id), order_number: orderLike.orderNumber || '', client: orderLike.client || '', type, details, username: u?.username || '', user_name: u?.name || u?.username || '', client_ts: new Date().toISOString() };
    supabase.from('order_events').insert(ev).then(({ error }) => {
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205' || /order_events/.test(error.message || '')) setEventsTableMissing(true);
        LS.set(LSK.events, [...LS.get(LSK.events, []), ev]);
      }
      setEventsVersion(v => v + 1);
    });
  }
  async function flushPendingEvents() {
    const pending = LS.get(LSK.events, []);
    if (!pending.length) return;
    const { error } = await supabase.from('order_events').insert(pending);
    if (!error) { LS.set(LSK.events, []); setEventsTableMissing(false); setEventsVersion(v => v + 1); }
    else if (error.code === '42P01' || error.code === 'PGRST205') setEventsTableMissing(true);
  }
  async function fetchEvents(orderId) {
    const pending = LS.get(LSK.events, []).filter(e => e.order_id === String(orderId)).map(e => ({ ...e, ts: e.client_ts, pending: true }));
    const { data, error } = await supabase.from('order_events').select('*').eq('order_id', String(orderId)).order('ts', { ascending: true });
    if (error) return { events: pending, error: (error.code === '42P01' || error.code === 'PGRST205') ? "A tabela de histórico ainda não foi criada no Supabase — os eventos estão guardados neste computador e serão enviados depois." : "Não foi possível carregar o histórico do servidor (modo offline)." };
    return { events: [...(data || []), ...pending], error: null };
  }
  async function fetchAllEvents() {
    const all = []; const size = 1000;
    for (let from = 0; from < 200000; from += size) {
      const { data, error } = await supabase.from('order_events').select('*').order('ts', { ascending: true }).range(from, from + size - 1);
      if (error) return { events: all, error };
      all.push(...data); if (data.length < size) break;
    }
    return { events: all, error: null };
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
      // Confere se o script SQL da v1.5.0 já foi aplicado (tabela de histórico + colunas novas)
      const [evProbe, colProbe] = await Promise.all([
        supabase.from('order_events').select('id').limit(1),
        supabase.from('orders').select('exec_sessions,cancel_reason').limit(1),
      ]);
      missingColsRef.current = !!colProbe.error;
      setEventsTableMissing(!!evProbe.error || !!colProbe.error);
      if (!evProbe.error) flushPendingEvents();
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
    
    const u = currentUserRef.current;
    const full = { execSessions: [], ...order, createdBy: u?.username || '', createdAt: new Date().toISOString() };
    setOrders(prev => [...prev, full]);
    const row = { id: String(order.id), ...toDb({ ...full, createdAt: undefined }), missing_items: order.missingItems || [], has_complementary: (order.missingItems || []).length > 0, complementary_complete: (order.missingItems || []).length === 0 };
    let { error } = await supabase.from('orders').insert(row);
    if (error && isMissingColErr(error)) { missingColsRef.current = true; setEventsTableMissing(true); NEW_COLS.forEach(c => delete row[c]); ({ error } = await supabase.from('orders').insert(row)); }
    if (error) { handleSaveError(error, () => setOrders(prev => prev.filter(o => o.id !== order.id)), "Erro ao salvar pedido. Tente novamente."); return; }
    logEvent(full, 'criado', { status: full.status, items: (full.items || []).length, totalTime: orderTotalTime(full), days: full.productionDays || [], deliveryDate: full.deliveryDate });
    if (full.status === 'scheduled') logEvent(full, 'planejado', { items: full.items.length, totalTime: orderTotalTime(full), days: full.productionDays, note: 'Cadastrado já com itens e dias' });
  }
  // events: evento (ou lista) { type, details } gravado no histórico se o update funcionar
  async function updateOrder(id, changes, events) {
    const prev = orders.find(o => o.id === id);
    setOrders(p => p.map(o => o.id === id ? { ...o, ...changes } : o));
    const db = toDb(changes);
    let { error } = Object.keys(db).length ? await supabase.from('orders').update(db).eq('id', String(id)) : { error: null };
    if (error && isMissingColErr(error)) { missingColsRef.current = true; setEventsTableMissing(true); const db2 = toDb(changes); ({ error } = Object.keys(db2).length ? await supabase.from('orders').update(db2).eq('id', String(id)) : { error: null }); }
    if (error) { handleSaveError(error, () => { if (prev) setOrders(p => p.map(o => o.id === id ? prev : o)); }, "Erro ao atualizar pedido. Alteração desfeita."); if (!(offlineModeRef.current || error?.status === 0)) return; }
    const ref = { ...(prev || { id }), ...changes };
    [].concat(events || []).forEach(ev => ev && logEvent(ref, ev.type, ev.details || {}));
  }

  // ── Execução: cronômetro por sessões ─────────────────────────
  function startExecution(id) {
    const o = orders.find(x => x.id === id); if (!o || o.status === 'executing') return;
    const u = currentUserRef.current; const now = new Date().toISOString();
    const sessions = [...(o.execSessions || []), { start: now, by: u?.username || '' }];
    const parallel = orders.filter(x => x.status === 'executing' && x.id !== id).map(x => `#${x.orderNumber}`);
    const first = !(o.execSessions || []).length && !o.executedAt;
    updateOrder(id, { status: 'executing', execSessions: sessions, ...(first ? { executedAt: now, executedBy: u?.username || '' } : {}) },
      { type: first ? 'execucao_iniciada' : 'execucao_retomada', details: { parallel } });
  }
  function closeSession(o, endType, reason) {
    const now = new Date().toISOString(); const u = currentUserRef.current;
    const sessions = [...(o.execSessions || [])];
    if (sessions.length && !sessions[sessions.length - 1].end) sessions[sessions.length - 1] = { ...sessions[sessions.length - 1], end: now, endBy: u?.username || '', endType, ...(reason ? { reason } : {}) };
    return { sessions, now };
  }
  function pauseExecution(id, reason, scheduleChanges = {}) {
    const o = orders.find(x => x.id === id); if (!o) return;
    const { sessions } = closeSession(o, 'pause', reason);
    const t = execTotals({ ...o, execSessions: sessions }, shift, isWorkDay);
    updateOrder(id, { status: 'scheduled', execSessions: sessions, ...scheduleChanges },
      { type: 'execucao_pausada', details: { reason, execBusiness: t.business, execWall: t.wall, estimated: orderTotalTime(o), ...(scheduleChanges.productionDays ? { daysBefore: effectiveDays(o), daysAfter: scheduleChanges.productionDays } : {}) } });
  }
  function completeOrder(id, location) {
    const o = orders.find(x => x.id === id); if (!o) return;
    const u = currentUserRef.current;
    const { sessions, now } = closeSession(o, 'complete');
    const t = execTotals({ ...o, execSessions: sessions }, shift, isWorkDay);
    const pendingItems = o.items.filter(i => !o.itemsCompleted[i.code]).map(i => i.code);
    updateOrder(id, { status: 'completed', execSessions: sessions, completedAt: now, completedBy: u?.username || '', execSeconds: t.business, execWallSeconds: t.wall },
      { type: 'concluido', details: { location, execBusiness: t.business, execWall: t.wall, estimated: orderTotalTime(o), pauses: t.pauses, pendingItems, missing: (o.missingItems || []).filter(m => !m.delivered).map(m => `${m.code}×${m.qty}`) } });
  }
  function cancelOrder(id, reason) {
    const o = orders.find(x => x.id === id); if (!o) return;
    const u = currentUserRef.current;
    const extra = o.status === 'executing' ? { execSessions: closeSession(o, 'cancel', reason).sessions } : {};
    updateOrder(id, { status: 'cancelled', cancelReason: reason, cancelledAt: new Date().toISOString(), cancelledBy: u?.username || '', ...extra },
      { type: 'cancelado', details: { reason, status: o.status } });
    showToast(`Pedido #${o.orderNumber} cancelado.`, "success");
  }
  function reactivateOrder(id, reason) {
    const o = orders.find(x => x.id === id); if (!o) return;
    // Volta para o Planejamento: os dias antigos provavelmente já passaram
    updateOrder(id, { status: 'planning', productionDays: [], productionStart: '', productionEnd: '', cancelReason: '', cancelledAt: null, cancelledBy: '' },
      { type: 'reativado', details: { reason, daysBefore: effectiveDays(o), daysAfter: [] } });
    showToast(`Pedido #${o.orderNumber} reativado — voltou para o Planejamento.`, "success");
  }

  async function deleteOrder(id) {
    const prev = orders.find(o => o.id === id);
    if (!prev) return;
    logEvent(prev, 'excluido', { status: prev.status, items: prev.items.length, totalTime: orderTotalTime(prev), note: prev.cancelReason ? `Estava cancelado: ${prev.cancelReason}` : undefined });
    setOrders(p => p.filter(o => o.id !== id));
    const { error } = await supabase.from('orders').delete().eq('id', String(id));
    if (error) {
      handleSaveError(error, () => setOrders(p => p.some(o => o.id === id) ? p : [...p, prev]), "Erro ao excluir pedido. Exclusão desfeita.");
      return;
    }
    // Remove também o registro de logística órfão
    if (logistics[String(id)]) {
      const { [String(id)]: _removed, ...rest } = logistics;
      saveLogistics(rest);
    }
    showToast(`Pedido #${prev.orderNumber} excluído.`, "success");
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
  // client_history passa a ser o CADASTRO de clientes (nome normalizado: maiúsculo, sem espaços sobrando)
  async function addClient(rawName) {
    const name = normName(rawName);
    if (!name || clientHistory.includes(name)) return name;
    setClientHistory(prev => [...prev, name]);
    const { error } = await supabase.from('client_history').insert({ name });
    if (error && error.code !== '23505') handleSaveError(error, () => setClientHistory(prev => prev.filter(c => c !== name)), "Erro ao cadastrar cliente.");
    return name;
  }
  // Renomeia ou unifica: todos os pedidos de "from" passam para "to"; "from" sai do cadastro
  async function renameClient(from, rawTo) {
    const to = normName(rawTo);
    if (!to || from === to) return;
    const affected = orders.filter(o => o.client === from);
    setOrders(p => p.map(o => o.client === from ? { ...o, client: to } : o));
    setClientHistory(p => { const s = p.filter(c => c !== from); return s.includes(to) ? s : [...s, to]; });
    const r1 = await supabase.from('orders').update({ client: to }).eq('client', from);
    if (r1.error) { handleSaveError(r1.error, () => loadData(), "Erro ao renomear cliente nos pedidos."); return; }
    await supabase.from('client_history').insert({ name: to }).then(() => {});
    await supabase.from('client_history').delete().eq('name', from);
    affected.forEach(o => logEvent({ ...o, client: to }, 'cliente_unificado', { fromClient: from, toClient: to }));
    showToast(`"${from}" → "${to}" (${affected.length} pedido${affected.length === 1 ? "" : "s"}).`, "success");
  }
  async function deleteClient(name) {
    if (orders.some(o => o.client === name)) { showToast("Cliente tem pedidos — use Unificar em vez de excluir."); return; }
    setClientHistory(p => p.filter(c => c !== name));
    const { error } = await supabase.from('client_history').delete().eq('name', name);
    if (error) handleSaveError(error, () => setClientHistory(p => [...p, name]), "Erro ao excluir cliente.");
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
      {eventsTableMissing && !offlineMode && currentUser.role === "gestor" && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1900, background: C.orange, color: "#fff", padding: "7px 20px", fontSize: 12, fontWeight: 700, fontFamily: FH, letterSpacing: "0.03em" }}>
          ⚠ Banco ainda sem as tabelas/colunas da v1.5.0 (histórico, cancelamento, cronômetro). Rode o script supabase_v1.5.0.sql no SQL Editor do Supabase. Até lá, o histórico fica guardado neste computador.
        </div>
      )}
      <div style={{ display: "flex", height: "100vh", background: C.dark, fontFamily: F, overflow: "hidden", paddingTop: offlineMode ? 34 : syncing ? 26 : 0 }}>
        <Sidebar activePage={activePage} setActivePage={p => { if (p !== "demand") setEditingOrderId(null); setActivePage(p); }} currentUser={currentUser} onLogout={handleLogout} badges={{ planning: orders.filter(o => o.status === "planning").length }} />
        <div style={{ flex: 1, overflow: "auto" }}>
          {activePage === "demand" && <DemandPage orders={orders} addOrder={addOrder} updateOrder={updateOrder} deleteOrder={currentUser.role === "gestor" ? deleteOrder : null} cancelOrder={cancelOrder} currentUser={currentUser} addItem={addItem} fetchEvents={fetchEvents} eventsVersion={eventsVersion} logistics={logistics} shift={shift} isWorkDay={isWorkDay} registeredItems={registeredItems} clientHistory={clientHistory} addClient={addClient} editingOrderId={editingOrderId} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} calendarSettings={calendarSettings} dayOverrides={dayOverrides} />}
          {activePage === "calendar" && <CalendarPage orders={orders} updateOrder={updateOrder} calendarSettings={calendarSettings} saveCalendarSettings={saveCalendarSettings} dayOverrides={dayOverrides} saveDayOverrides={saveDayOverrides} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} logistics={logistics} />}
          {activePage === "planning" && <PlanningPage orders={orders} currentUser={currentUser} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} reactivateOrder={reactivateOrder} deleteOrder={deleteOrder} fetchEvents={fetchEvents} eventsVersion={eventsVersion} logistics={logistics} shift={shift} isWorkDay={isWorkDay} />}
          {activePage === "open" && <OpenDemandsPage orders={orders} updateOrder={updateOrder} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} logistics={logistics} saveLogistics={saveLogistics} currentUser={currentUser} startExecution={startExecution} pauseExecution={pauseExecution} completeOrder={completeOrder} shift={shift} isWorkDay={isWorkDay} />}
          {activePage === "logistics" && <LogisticsPage orders={orders} logistics={logistics} saveLogistics={saveLogistics} updateOrder={updateOrder} logEvent={logEvent} readOnly={currentUser.role === "vendedor"} />}
          {activePage === "missing" && (currentUser.role === "gestor" || currentUser.role === "montador") && <MissingItemsPage orders={orders} updateOrder={updateOrder} setEditingOrderId={setEditingOrderId} setActivePage={setActivePage} />}
          {activePage === "items" && (currentUser.role === "gestor" || currentUser.role === "montador") && <ItemsPage registeredItems={registeredItems} addItem={addItem} updateItem={updateItem} deleteItem={deleteItem} />}
          {activePage === "reports" && currentUser.role === "gestor" && <ReportsPage orders={orders} registeredItems={registeredItems} calendarSettings={calendarSettings} dayOverrides={dayOverrides} />}
          {activePage === "export" && currentUser.role === "gestor" && <ExportPage orders={orders} registeredItems={registeredItems} fetchAllEvents={fetchAllEvents} logistics={logistics} />}
          {activePage === "clients" && currentUser.role === "gestor" && <ClientsPage clientHistory={clientHistory} orders={orders} addClient={addClient} renameClient={renameClient} deleteClient={deleteClient} />}
          {activePage === "users" && currentUser.role === "gestor" && <UsersPage users={users} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} currentUser={currentUser} />}
        </div>
      </div>
    </>
  );
}
