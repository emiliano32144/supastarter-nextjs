"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type BusinessConfig = {
  id?: string;
  business_name: string;
  business_description: string;
  slug: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  opening_time: string;
  closing_time: string;
  working_days: string[];
  instagram_url: string;
  facebook_url: string;
  website_url: string;
  min_advance_hours: number;
  max_advance_days: number;
  slot_duration: number;
};

const defaultConfig: BusinessConfig = {
  business_name: "",
  business_description: "",
  slug: "",
  logo_url: "",
  primary_color: "#3B82F6",
  secondary_color: "#1E40AF",
  phone: "",
  email: "",
  address: "",
  city: "",
  opening_time: "09:00",
  closing_time: "19:00",
  working_days: ["1", "2", "3", "4", "5", "6"],
  instagram_url: "",
  facebook_url: "",
  website_url: "",
  min_advance_hours: 2,
  max_advance_days: 30,
  slot_duration: 30,
};

const colorPresets = [
  { name: "Azul", primary: "#3B82F6", secondary: "#1E40AF" },
  { name: "Rosa", primary: "#EC4899", secondary: "#BE185D" },
  { name: "Morado", primary: "#8B5CF6", secondary: "#6D28D9" },
  { name: "Verde", primary: "#10B981", secondary: "#047857" },
  { name: "Naranja", primary: "#F59E0B", secondary: "#D97706" },
  { name: "Rojo", primary: "#EF4444", secondary: "#DC2626" },
  { name: "Cyan", primary: "#06B6D4", secondary: "#0891B2" },
  { name: "Negro", primary: "#1F2937", secondary: "#111827" },
];

const dayNames = [
  { value: "0", label: "Dom" },
  { value: "1", label: "Lun" },
  { value: "2", label: "Mar" },
  { value: "3", label: "Mié" },
  { value: "4", label: "Jue" },
  { value: "5", label: "Vie" },
  { value: "6", label: "Sáb" },
];

export default function ConfiguracionPage() {
  const params = useParams();
  const orgSlug = params.organizationSlug as string;
  const { activeOrganization } = useActiveOrganization();
  const [config, setConfig] = useState<BusinessConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Cargar configuración existente
  useEffect(() => {
    async function loadConfig() {
      if (!activeOrganization?.id) return;
      
      try {
        const res = await fetch(`/api/business-config/${activeOrganization.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setConfig({ ...defaultConfig, ...data.config });
          } else {
            // Si no existe, usar el nombre de la organización
            setConfig({
              ...defaultConfig,
              business_name: activeOrganization.name || "Mi Salón",
              slug: activeOrganization.slug || "",
            });
          }
        }
      } catch (err) {
        console.error("Error loading config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [activeOrganization]);

  // Actualizar URL de preview
  useEffect(() => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const slug = config.slug || activeOrganization?.id || "";
    setPreviewUrl(`${baseUrl}/reservas/${slug}`);
  }, [config.slug, activeOrganization]);

  const handleSave = async () => {
    if (!activeOrganization?.id) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch(`/api/business-config/${activeOrganization.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }
      
      setMessage({ type: "success", text: "¡Configuración guardada correctamente!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    const slug = config.business_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setConfig({ ...config, slug });
  };

  const toggleDay = (day: string) => {
    const days = config.working_days.includes(day)
      ? config.working_days.filter((d) => d !== day)
      : [...config.working_days, day];
    setConfig({ ...config, working_days: days });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">⚙️ Configuración del Negocio</h1>
          <p className="text-gray-500">Personaliza cómo ven tus clientes la página de reservas</p>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex gap-2 border-b pb-4">
        <Link href={`/app/${orgSlug}/reservas`} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
          📅 Reservas
        </Link>
        <Link href={`/app/${orgSlug}/reservas/servicios`} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
          💇 Servicios
        </Link>
        <Link href={`/app/${orgSlug}/reservas/profesionales`} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
          👩‍💼 Profesionales
        </Link>
        <Link href={`/app/${orgSlug}/reservas/clientes`} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors whitespace-nowrap">
          👥 Clientes
        </Link>
        <Link href={`/app/${orgSlug}/reservas/fidelizacion`} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
          🏆 Fidelización
        </Link>
        <Link href={`/app/${orgSlug}/reservas/configuracion`} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
          ⚙️ Configuración
        </Link>
        <Link href={`/app/${orgSlug}/reservas/fidelizacion`} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
          🏆 Fidelización
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Preview URL */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="text-sm text-blue-700 font-medium mb-1">🔗 URL de tu página de reservas:</div>
        <div className="flex items-center gap-2">
          <code className="bg-white px-3 py-2 rounded-lg border text-sm flex-1 overflow-x-auto">
            {previewUrl}
          </code>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Ver página →
          </a>
        </div>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        
        {/* Información Básica */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">📋 Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del negocio *
              </label>
              <input
                type="text"
                value={config.business_name}
                onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Peluquería María"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL personalizada (slug)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.slug}
                  onChange={(e) => setConfig({ ...config, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="peluqueria-maria"
                />
                <button
                  type="button"
                  onClick={generateSlug}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Auto
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={config.business_description}
                onChange={(e) => setConfig({ ...config, business_description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción corta de tu negocio..."
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del logo
              </label>
              <input
                type="url"
                value={config.logo_url || ""}
                onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://ejemplo.com/logo.png"
              />
              {config.logo_url && (
                <div className="mt-2">
                  <img src={config.logo_url} alt="Logo preview" className="h-16 object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colores */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">🎨 Colores</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Elige un tema
              </label>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setConfig({ ...config, primary_color: preset.primary, secondary_color: preset.secondary })}
                    className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${
                      config.primary_color === preset.primary ? "ring-2 ring-offset-2 ring-gray-400 scale-105" : ""
                    }`}
                    style={{ backgroundColor: preset.primary }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color principal</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color secundario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.secondary_color}
                    onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.secondary_color}
                    onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="p-4 rounded-xl border-2" style={{ borderColor: config.primary_color }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: config.primary_color }}>
                  {config.business_name?.charAt(0) || "M"}
                </div>
                <div>
                  <div className="font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {config.business_name || "Mi Salón"}
                  </div>
                  <div className="text-sm text-gray-500">Reserva online</div>
                </div>
              </div>
              <button
                type="button"
                className="w-full py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: config.primary_color }}
              >
                Reservar ahora
              </button>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">📞 Contacto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={config.phone || ""}
                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+34 600 000 000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={config.email || ""}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="hola@misalon.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={config.address || ""}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Calle Principal 123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input
                type="text"
                value={config.city || ""}
                onChange={(e) => setConfig({ ...config, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Barcelona"
              />
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">🕐 Horarios</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de apertura</label>
                <input
                  type="time"
                  value={config.opening_time}
                  onChange={(e) => setConfig({ ...config, opening_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de cierre</label>
                <input
                  type="time"
                  value={config.closing_time}
                  onChange={(e) => setConfig({ ...config, closing_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Días de trabajo</label>
              <div className="flex flex-wrap gap-2">
                {dayNames.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      config.working_days.includes(day.value)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">📱 Redes Sociales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <input
                type="url"
                value={config.instagram_url || ""}
                onChange={(e) => setConfig({ ...config, instagram_url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://instagram.com/misalon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
              <input
                type="url"
                value={config.facebook_url || ""}
                onChange={(e) => setConfig({ ...config, facebook_url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://facebook.com/misalon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
              <input
                type="url"
                value={config.website_url || ""}
                onChange={(e) => setConfig({ ...config, website_url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://misalon.com"
              />
            </div>
          </div>
        </div>

        {/* Configuración de Reservas */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">📅 Configuración de Reservas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Antelación mínima (horas)
              </label>
              <input
                type="number"
                value={config.min_advance_hours}
                onChange={(e) => setConfig({ ...config, min_advance_hours: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Horas antes para poder reservar</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días máximos de antelación
              </label>
              <input
                type="number"
                value={config.max_advance_days}
                onChange={(e) => setConfig({ ...config, max_advance_days: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">Hasta cuántos días se puede reservar</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración del slot (minutos)
              </label>
              <select
                value={config.slot_duration}
                onChange={(e) => setConfig({ ...config, slot_duration: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Intervalo entre horarios disponibles</p>
            </div>
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all font-medium shadow-lg hover:shadow-xl"
        >
          {saving ? "Guardando..." : "💾 Guardar configuración"}
        </button>
      </div>
    </div>
  );
}

