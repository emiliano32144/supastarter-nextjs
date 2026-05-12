/**
 * Rate limit en memoria por proceso (útil en dev y instancias warm de Vercel).
 * En varias réplicas el límite no es global: para producción estricta usar Upstash Redis u otro store compartido.
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 5000;

export function isRateLimited(
	key: string,
	maxRequests: number,
	windowMs: number,
): boolean {
	const now = Date.now();
	const prev = buckets.get(key) ?? [];
	const recent = prev.filter((t) => now - t < windowMs);
	if (recent.length >= maxRequests) {
		return true;
	}
	recent.push(now);
	buckets.set(key, recent);

	if (buckets.size > MAX_KEYS) {
		for (const [k, times] of buckets) {
			const kept = times.filter((t) => now - t < windowMs);
			if (kept.length === 0) buckets.delete(k);
			else buckets.set(k, kept);
		}
	}
	return false;
}

export function getClientIpForRateLimit(request: Request): string {
	const h = new Headers(request.headers);
	const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
	if (fwd) return fwd;
	const real = h.get("x-real-ip")?.trim();
	if (real) return real;
	return "unknown";
}
