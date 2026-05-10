// ═══════════════════════════════════════════════════════════════
// AUTO-SAAS BUILDER - Module Router
// Blueprint: ReservasPro (reservas)
// Generated: 2025-12-08T12:08:07.576Z
// ═══════════════════════════════════════════════════════════════

// Import procedures from ./procedures
import * as procedures from "./procedures";

export const reservasRouter = {
	bookings: {
		list: procedures.listBookings,
		get: procedures.getBookings,
		create: procedures.createBookings,
		update: procedures.updateBookings,
		delete: procedures.deleteBookings,
	},
	services: {
		list: procedures.listServices,
		get: procedures.getServices,
		create: procedures.createServices,
		update: procedures.updateServices,
		delete: procedures.deleteServices,
	},
	professionals: {
		list: procedures.listProfessionals,
		get: procedures.getProfessionals,
		create: procedures.createProfessionals,
		update: procedures.updateProfessionals,
		delete: procedures.deleteProfessionals,
	},
	working_hours: {
		list: procedures.listWorkingHours,
		get: procedures.getWorkingHours,
		create: procedures.createWorkingHours,
		update: procedures.updateWorkingHours,
		delete: procedures.deleteWorkingHours,
	},
	clients: {
		list: procedures.listClients,
		get: procedures.getClients,
		create: procedures.createClients,
		update: procedures.updateClients,
		delete: procedures.deleteClients,
	},
	blocked_slots: {
		list: procedures.listBlockedSlots,
		create: procedures.createBlockedSlot,
		delete: procedures.deleteBlockedSlot,
	},
};
