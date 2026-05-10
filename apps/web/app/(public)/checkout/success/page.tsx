export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-4">
          <span className="text-[#D4AF37]">¡Bienvenido a filo!</span>
        </h1>
        <p className="text-gray-400 mb-8">
          Tu suscripción está activa. Ya podés empezar a configurar tu salón y recibir reservas online.
        </p>
        <a
          href="/app"
          className="inline-block px-8 py-4 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-[#b8960b] transition-colors"
        >
          Ir a mi panel →
        </a>
        <p className="text-gray-600 text-sm mt-6">
          ¿Dudas? Escribinos a{" "}
          <a href="mailto:reservas@codetix.es" className="text-[#D4AF37] underline">
            reservas@codetix.es
          </a>
        </p>
      </div>
    </div>
  );
}
