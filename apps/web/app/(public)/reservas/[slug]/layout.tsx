import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: config } = await supabase
      .from("business_config")
      .select("business_name, business_description, city, primary_color, logo_url")
      .eq("slug", slug)
      .maybeSingle();

    if (config) {
      const title = `${config.business_name || slug} — Reservas online | FILO`;
      const description =
        config.business_description ||
        `Reservá tu cita en ${config.business_name || slug}. Agenda online, recordatorios automáticos y sistema de fidelización.`;

      return {
        title,
        description,
        keywords: [
          "reservas",
          config.business_name || "",
          "barbería",
          "peluquería",
          config.city || "",
          "citas online",
        ],
        openGraph: {
          title,
          description,
          type: "website",
          locale: "es_ES",
          siteName: "FILO",
        },
        twitter: {
          card: "summary",
          title,
          description,
        },
        alternates: {
          canonical: `https://codetix.es/reservas/${slug}`,
        },
        robots: "index, follow",
      };
    }
  } catch {
    // fallback
  }

  return {
    title: `${slug} — Reservas online | FILO`,
    description: "Reservá tu cita online. Sistema de gestión para barberías y peluquerías.",
  };
}

export default function SlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
