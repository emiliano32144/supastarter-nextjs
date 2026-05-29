/**
 * Lógica pura de reservas (sin dependencias de red ni de BD).
 *
 * Extraída de los endpoints de book/reprogramar/slots para poder testearla de
 * forma aislada y mantener un único criterio de verdad sobre cómo se calculan
 * los horarios, qué se considera solapamiento y cuándo un hold ha expirado.
 */

/** Normaliza un valor de tiempo (p. ej. "10:00:00+02") a "HH:MM". */
export function normalizeTimeToHHMM(value: string | null | undefined): string {
	if (value == null) {
		return "";
	}
	const s = String(value).trim();
	return s.length >= 5 ? s.slice(0, 5) : s;
}

const HHMM_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** True si la cadena es una hora válida en formato HH:MM (00:00–23:59). */
export function isValidHHMM(time: string): boolean {
	return HHMM_RE.test(time);
}

/**
 * Calcula la hora de fin sumando `durationMinutes` a una hora de inicio "HH:MM".
 * Usa aritmética modular sobre minutos (el valor es solo una hora, sin fecha),
 * de modo que cruzar medianoche envuelve a 24h. Equivalente al cálculo basado
 * en Date de los endpoints para cualquier duración de cita normal, pero sin la
 * fragilidad de depender de la fecha/DST del día en que se ejecuta.
 */
export function computeEndTime(
	startHHMM: string,
	durationMinutes: number,
): string {
	const [h, m] = startHHMM.split(":").map(Number);
	const total = h * 60 + m + durationMinutes;
	const endH = Math.floor(total / 60) % 24;
	const endM = total % 60;
	return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

/**
 * Determina si dos rangos horarios se solapan con semántica '[)' (inicio
 * incluido, fin excluido): permite citas consecutivas (una termina 10:00 y la
 * otra empieza 10:00) sin conflicto. Cubre también la contención completa de un
 * rango dentro de otro. Las horas en "HH:MM" con cero a la izquierda comparan
 * correctamente como cadenas. Mismo criterio que la query de book/reprogramar
 * y que el constraint EXCLUDE de la BD.
 */
export function rangesOverlap(
	aStart: string,
	aEnd: string,
	bStart: string,
	bEnd: string,
): boolean {
	return aStart < bEnd && aEnd > bStart;
}

/**
 * True si una reserva es un hold de confirmación expirado: solo aplica a
 * `awaiting_confirmation` cuya ventana (`confirmation_expires_at`) ya pasó.
 * Estos holds deben tratarse como hueco libre en el calendario porque el
 * endpoint de book los cancela en su próxima ejecución.
 */
export function isHoldExpired(
	status: string,
	expiresAtIso: string | null | undefined,
	nowIso: string,
): boolean {
	if (status !== "awaiting_confirmation") {
		return false;
	}
	if (!expiresAtIso) {
		return false;
	}
	return new Date(expiresAtIso).getTime() < new Date(nowIso).getTime();
}
