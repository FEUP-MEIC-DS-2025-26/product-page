import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';

const HamburgerIcon = () => (
  <svg 
    className="w-8 h-8 text-[#344E41]"
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 6h16M4 12h16M4 18h16" 
    />
  </svg>
);

export default async function Navbar() {
  const user = await prisma.user.findFirst({
    where: { email: 'diddy@madeinportugal.store' },
    select: { first_name: true, photo_url: true },
  });

  return (
    <nav className="bg-[#DAD7CD] border-y border-[#344E41]/30 px-4 sm:px-6 py-2"> 
      <div className="grid grid-cols-3 items-center w-full">

        {/* 1. Esquerda: Ícone Hamburger */}
        <div className="justify-self-start">
          <button 
            className="p-1 rounded-md hover:bg-black/10"
            aria-label="Toggle menu"
          >
            <HamburgerIcon />
          </button>
        </div>

        {/* 2. Centro: Logo */}
        <div className="justify-self-center">
          <Link 
            href="/" 
            className="text-2xl sm:text-3xl font-bold italic whitespace-nowrap flex items-baseline"
          >
            <span className="text-red-600">made</span>
            <span className="text-yellow-500">in</span>
            <span className="text-lime-600">portugal</span>
            <span className="text-gray-600 text-xl sm:text-2xl font-normal">
              .store
            </span>
          </Link>
        </div>

        {/* 3. Direita: Ícone de Perfil */}
        <div className="justify-self-end">
          <Link href="/profile">
            <Image 
              src={user?.photo_url || '/default-avatar.png'}
              alt={user?.first_name || 'User profile picture'}
              width={40}
              height={40}
              className="rounded-full border border-[#344E41] object-cover aspect-square"
            />
          </Link>
        </div>

      </div>
    </nav>
  );
}
