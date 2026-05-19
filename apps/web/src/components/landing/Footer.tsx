export default function Footer() {
  return (
    <footer
      className="w-full bg-[#0a0a0a] border-t border-[rgba(255,255,255,0.06)]"
      style={{ padding: '40px 0' }}
    >
      <div
        className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-center gap-6"
        style={{ padding: '0 clamp(24px, 5vw, 80px)' }}
      >
        <a href="/" className="font-inter text-[14px] text-[#888888] hover:text-[#D4AF37] transition-colors duration-300">
          Inicio
        </a>
        <span className="text-[#333333]">·</span>
        <a href="#pricing" className="font-inter text-[14px] text-[#888888] hover:text-[#D4AF37] transition-colors duration-300">
          Precios
        </a>
        <span className="text-[#333333]">·</span>
        <a href="/terminos" className="font-inter text-[14px] text-[#888888] hover:text-[#D4AF37] transition-colors duration-300">
          Términos
        </a>
        <span className="text-[#333333]">·</span>
        <a href="/privacidad" className="font-inter text-[14px] text-[#888888] hover:text-[#D4AF37] transition-colors duration-300">
          Privacidad
        </a>
        <span className="text-[#333333]">·</span>
        <span className="font-inter text-[14px] text-[#666666]">
          © 2025 FILO · filo.com.es
        </span>
      </div>
    </footer>
  );
}
