import Link from 'next/link';

export default function Footer() {
  return (
     <footer className="mt-auto w-full bg-[#DAD7CD] border-t border-[#344E41]/30 px-6 py-12 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        
          {/* Coluna 1: Sobre */}
          <div className="flex flex-col gap-3">
            <strong className="font-bold text-[#3A5A40] uppercase tracking-wide">
              Sobre Nós
            </strong>
            <Link href="/about" className="text-[#344E41] hover:text-[#3A5A40]">
              A nossa história
            </Link>
            <Link href="/contact" className="text-[#344E41] hover:text-[#3A5A40]">
              Contactos
            </Link>
            <Link href="/careers" className="text-[#344E41] hover:text-[#3A5A40]">
              Carreiras
            </Link>
          </div>

          {/* Coluna 2: Apoio */}
          <div className="flex flex-col gap-3">
            <strong className="font-bold text-[#3A5A40] uppercase tracking-wide">
              Apoio ao Cliente
            </strong>
            <Link href="/faq" className="text-[#344E41] hover:text-[#3A5A40]">
              FAQ
            </Link>
            <Link href="/shipping" className="text-[#344E41] hover:text-[#3A5A40]">
              Envios e Devoluções
            </Link>
            <Link href="/policy" className="text-[#344E41] hover:text-[#3A5A40]">
              Política de Privacidade
            </Link>
          </div>

          {/* Coluna 3: Vender */}
          <div className="flex flex-col gap-3">
            <strong className="font-bold text-[#3A5A40] uppercase tracking-wide">
              Vender
            </strong>
            <Link href="/sell" className="text-[#344E41] hover:text-[#3A5A40]">
              Como Vender
            </Link>
            <Link href="/seller-portal" className="text-[#344E41] hover:text-[#3A5A40]">
              Portal do Vendedor
            </Link>
          </div>

          {/* Coluna 4: Redes Sociais */}
          <div className="flex flex-col gap-3">
            <strong className="font-bold text-[#3A5A40] uppercase tracking-wide">
              Siga-nos
            </strong>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-[#344E41] hover:text-[#3A5A40]">
              Instagram
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-[#344E41] hover:text-[#3A5A40]">
              Facebook
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-[#344E41] hover:text-[#3A5A40]">
              Pinterest
            </a>
          </div>
        </div>

        {/* Linha de Copyright */}
        <div className="text-center text-[#3A5A40] text-sm border-t border-[#344E41]/30 pt-8 mt-8">          © {new Date().getFullYear()} madeinportugal.store. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}