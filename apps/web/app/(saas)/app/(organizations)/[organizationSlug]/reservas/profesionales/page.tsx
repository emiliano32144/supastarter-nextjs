"use client";

import { useProfessionals, useCreateProfessional, useUpdateProfessional, useDeleteProfessional } from "@/hooks/use-reservas";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type ProfessionalFormData = {
  name: string;
  email: string;
  phone: string;
  avatar_url: string;
  specialties: string;
  is_active: boolean;
};

const initialFormData: ProfessionalFormData = {
  name: "",
  email: "",
  phone: "",
  avatar_url: "",
  specialties: "",
  is_active: true,
};

export default function ProfesionalesPage() {
  const params = useParams();
  const orgSlug = params.organizationSlug as string;
  
  const { data: response, isLoading, error } = useProfessionals();
  const professionals = response?.data || [];
  
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional();
  const deleteProfessional = useDeleteProfessional();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfessionalFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (professional: any) => {
    setEditingId(professional.id);
    setFormData({
      name: professional.name || "",
      email: professional.email || "",
      phone: professional.phone || "",
      avatar_url: professional.avatar_url || "",
      specialties: professional.specialties || "",
      is_active: professional.is_active ?? true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      const payload = {
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        avatar_url: formData.avatar_url || null,
        specialties: formData.specialties || null,
      };

      if (editingId) {
        await updateProfessional.mutateAsync({ id: editingId, ...payload } as any);
      } else {
        await createProfessional.mutateAsync(payload as any);
      }
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (err: any) {
      setFormError(err.message || "Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este profesional?")) {
      try {
        await deleteProfessional.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || "Error al eliminar");
      }
    }
  };

  const toggleActive = async (professional: any) => {
    try {
      await updateProfessional.mutateAsync({ 
        id: professional.id, 
        is_active: !professional.is_active 
      } as any);
    } catch (err: any) {
      alert(err.message || "Error al actualizar");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">👩‍💼 Profesionales</h1>
          <p className="text-gray-500">Gestiona los profesionales de tu salón</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md font-medium"
        >
          + Nuevo Profesional
        </button>
      </div>

      {/* Sub Navigation */}
      <div className="flex gap-2 border-b pb-4">
        <Link
          href={`/app/${orgSlug}/reservas`}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
        >
          📅 Reservas
        </Link>
        <Link
          href={`/app/${orgSlug}/reservas/servicios`}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
        >
          💇 Servicios
        </Link>
        <Link
          href={`/app/${orgSlug}/reservas/profesionales`}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium"
        >
          👩‍💼 Profesionales
        </Link>
        <Link
          href={`/app/${orgSlug}/reservas/clientes`}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          👥 Clientes
        </Link>
        <Link
          href={`/app/${orgSlug}/reservas/configuracion`}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
        >
          ⚙️ Configuración
        </Link>
        <Link
          href={`/app/${orgSlug}/reservas/fidelizacion`}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
        >
          🏆 Fidelización
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Total Profesionales</div>
          <div className="text-3xl font-bold text-gray-900">{professionals.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Activos</div>
          <div className="text-3xl font-bold text-green-600">
            {professionals.filter((p: any) => p.is_active).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Con Especialidades</div>
          <div className="text-3xl font-bold text-blue-600">
            {professionals.filter((p: any) => p.specialties).length}
          </div>
        </div>
      </div>

      {/* Professionals Grid */}
      {professionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionals.map((professional: any) => (
            <div
              key={professional.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                !professional.is_active ? "opacity-60" : ""
              }`}
            >
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  {professional.avatar_url ? (
                    <img
                      src={professional.avatar_url}
                      alt={professional.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                      {getInitials(professional.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{professional.name}</h3>
                    {professional.email && (
                      <p className="text-gray-500 text-sm">{professional.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleActive(professional)}
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      professional.is_active 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {professional.is_active ? "Activo" : "Inactivo"}
                  </button>
                </div>

                {professional.phone && (
                  <div className="text-sm text-gray-600 mb-2">
                    📞 {professional.phone}
                  </div>
                )}

                {professional.specialties && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">Especialidades:</div>
                    <div className="text-sm text-gray-700">{professional.specialties}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(professional)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(professional.id)}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-4">👩‍💼</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay profesionales todavía</h3>
          <p className="text-gray-500 mb-6">Agrega los profesionales de tu salón</p>
          <button
            onClick={handleCreate}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md font-medium"
          >
            Crear primer profesional
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "✏️ Editar Profesional" : "➕ Nuevo Profesional"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {formError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: María García"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="maria@salon.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Avatar
                  </label>
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidades
                  </label>
                  <textarea
                    value={formData.specialties}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Corte, Tinte, Alisado..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Profesional activo (visible para reservas)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createProfessional.isPending || updateProfessional.isPending}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all font-medium"
                  >
                    {createProfessional.isPending || updateProfessional.isPending ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

