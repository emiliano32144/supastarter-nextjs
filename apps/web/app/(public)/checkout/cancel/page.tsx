export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-3xl font-bold mb-4">
          Pago cancelado
        </h1>
        <p className="text-gray-400 mb-8">
          No te preocupés, no se realizó ningún cargo. Podés volver a intentarlo cuando quieras.
        </p>
        <a
          href="/pricing"
          className="inline-block px-8 py-4 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
        >
          Volver a pricing →
        </a>
        <p className="text-gray-600 text-sm mt-6">
          ¿Tenés dudas?{" "}
          <a href="mailto:reservas@codetix.es" className="text-[#D4AF37] underline">
            Escribinos
          </a>
        </p>
      </div>
    </div>
  );
}
