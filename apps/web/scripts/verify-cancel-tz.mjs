/**
 * Verificación matemática BUG-1: cita 10:00 en Europe/Madrid debe ser 08:00 UTC en mayo (CEST).
 * Ejecutar: node scripts/verify-cancel-tz.mjs (desde apps/web)
 */
import { fromZonedTime } from "date-fns-tz";

const tz = "Europe/Madrid";
const dateStr = "2026-05-14";
const localWall = `${dateStr}T10:00:00`;
const instant = fromZonedTime(localWall, tz);
const iso = instant.toISOString();

// CEST mayo 2026: UTC+2 → 10:00 Madrid = 08:00Z
const expected = "2026-05-14T08:00:00.000Z";
if (iso !== expected) {
	console.error("FAIL: esperado", expected, "obtenido", iso);
	process.exit(1);
}
console.log("OK fromZonedTime:", localWall, tz, "→", iso);

// Simular "ahora" 23h antes de la cita en UTC (fee 24h)
const now = new Date("2026-05-13T09:00:00.000Z"); // ~23h antes de 08:00Z del día siguiente... adjust
const hoursUntil = (instant.getTime() - now.getTime()) / (1000 * 60 * 60);
console.log("hoursUntil (now 2026-05-13T09Z → cita):", hoursUntil.toFixed(2), "h (fee 24h →", hoursUntil < 24 && hoursUntil > 0 ? "fee" : "no fee", ")");

const now2 = new Date("2026-05-12T08:00:00.000Z");
const h2 = (instant.getTime() - now2.getTime()) / (1000 * 60 * 60);
console.log("hoursUntil (48h antes aprox):", h2.toFixed(2), "h →", h2 < 24 ? "fee" : "sin fee");

console.log("BUG-1 verificación: passed");
