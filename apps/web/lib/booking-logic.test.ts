import { describe, expect, it } from "vitest";
import {
	computeEndTime,
	isHoldExpired,
	isValidHHMM,
	normalizeTimeToHHMM,
	rangesOverlap,
} from "./booking-logic";

describe("normalizeTimeToHHMM", () => {
	it("recorta a HH:MM cadenas largas de la BD", () => {
		expect(normalizeTimeToHHMM("10:00:00")).toBe("10:00");
		expect(normalizeTimeToHHMM("09:30:00+02")).toBe("09:30");
	});

	it("conserva valores ya en HH:MM", () => {
		expect(normalizeTimeToHHMM("14:45")).toBe("14:45");
	});

	it("devuelve cadena vacía para null/undefined", () => {
		expect(normalizeTimeToHHMM(null)).toBe("");
		expect(normalizeTimeToHHMM(undefined)).toBe("");
	});

	it("recorta espacios", () => {
		expect(normalizeTimeToHHMM("  08:15  ")).toBe("08:15");
	});
});

describe("isValidHHMM", () => {
	it("acepta horas válidas", () => {
		expect(isValidHHMM("00:00")).toBe(true);
		expect(isValidHHMM("9:05")).toBe(true);
		expect(isValidHHMM("23:59")).toBe(true);
	});

	it("rechaza horas inválidas", () => {
		expect(isValidHHMM("24:00")).toBe(false);
		expect(isValidHHMM("12:60")).toBe(false);
		expect(isValidHHMM("12:5")).toBe(false);
		expect(isValidHHMM("abc")).toBe(false);
		expect(isValidHHMM("")).toBe(false);
	});
});

describe("computeEndTime", () => {
	it("suma una duración simple", () => {
		expect(computeEndTime("10:00", 30)).toBe("10:30");
		expect(computeEndTime("10:00", 45)).toBe("10:45");
	});

	it("acarrea a la siguiente hora", () => {
		expect(computeEndTime("10:45", 30)).toBe("11:15");
		expect(computeEndTime("09:50", 20)).toBe("10:10");
	});

	it("envuelve al cruzar medianoche", () => {
		expect(computeEndTime("23:30", 60)).toBe("00:30");
		expect(computeEndTime("23:00", 90)).toBe("00:30");
	});

	it("rellena con cero a la izquierda", () => {
		expect(computeEndTime("08:05", 60)).toBe("09:05");
	});
});

describe("rangesOverlap (semántica '[)')", () => {
	it("detecta solapamiento parcial", () => {
		expect(rangesOverlap("10:00", "11:00", "10:30", "11:30")).toBe(true);
		expect(rangesOverlap("10:30", "11:30", "10:00", "11:00")).toBe(true);
	});

	it("detecta contención completa (un turno corto dentro de otro)", () => {
		// Caso que la antigua lógica de reprogramar NO detectaba.
		expect(rangesOverlap("10:00", "12:00", "10:30", "11:00")).toBe(true);
		expect(rangesOverlap("10:30", "11:00", "10:00", "12:00")).toBe(true);
	});

	it("permite citas consecutivas (fin == inicio)", () => {
		expect(rangesOverlap("10:00", "11:00", "11:00", "12:00")).toBe(false);
		expect(rangesOverlap("11:00", "12:00", "10:00", "11:00")).toBe(false);
	});

	it("no solapa rangos disjuntos", () => {
		expect(rangesOverlap("09:00", "10:00", "11:00", "12:00")).toBe(false);
	});
});

describe("isHoldExpired", () => {
	const now = "2026-05-29T12:00:00.000Z";

	it("true solo si awaiting_confirmation y la ventana ya pasó", () => {
		expect(
			isHoldExpired("awaiting_confirmation", "2026-05-29T11:30:00.000Z", now),
		).toBe(true);
	});

	it("false si el hold aún no expiró", () => {
		expect(
			isHoldExpired("awaiting_confirmation", "2026-05-29T12:30:00.000Z", now),
		).toBe(false);
	});

	it("false para estados que no son holds", () => {
		expect(isHoldExpired("confirmed", "2026-05-29T11:00:00.000Z", now)).toBe(
			false,
		);
		expect(isHoldExpired("pending", null, now)).toBe(false);
	});

	it("false si falta la fecha de expiración", () => {
		expect(isHoldExpired("awaiting_confirmation", null, now)).toBe(false);
	});
});
