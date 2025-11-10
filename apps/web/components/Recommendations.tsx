import React from 'react';
import { PrismaClient } from '@prisma/client';

// Reuse Prisma Client in development to avoid too many instances
const globalAny: any = global;
const prisma: PrismaClient = globalAny.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalAny.prisma = prisma;

export default async function Recommendations() {
  // Fetch three products with photos
  const products = await prisma.product.findMany({
    include: { photos: true },
    orderBy: { created_at: 'desc' },
    take: 3,
  });

  const formatAvg = (n?: number) =>
    typeof n === 'number' ? n.toFixed(1).replace('.', ',') : '0,0';

  // Helper to format price with comma and euro after (e.g. 12,99 €)
  const formatPrice = (price: any) =>
    Number(price).toFixed(2).replace('.', ',') + ' €';

  return (
    <section className="mt-8 border-t border-[#344E41]/30 pt-7 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center text-xl sm:text-2xl font-semibold text-[#344E41] mb-6">
          Os clientes que compraram este produto também compraram:
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 place-items-center">
          {products.map((p) => {
            const mainPhoto =
              p.photos && p.photos.length
                ? p.photos.find((ph: any) => ph.is_main) || p.photos[0]
                : null;

            return (
              <a
                key={p.id}
                href={`/product/${p.id}`}
                className="flex flex-col items-center max-w-xs w-full transition-transform hover:scale-105"
              >
                {/* outer narrow dark-green frame */}
                <div className="rounded-2xl border-12 sm:border-16 border-[#274836] w-full aspect-square flex items-center justify-center p-0">
                  {/* inner white square image area */}
                  <div className="bg-white rounded-md w-full h-full flex items-center justify-center overflow-hidden">
                    {mainPhoto ? (
                      <img
                        src={mainPhoto.photo_url}
                        alt={mainPhoto.alt_text || p.title}
                        className="object-contain w-full h-full p-2"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 text-center">
                        Sem imagem
                      </div>
                    )}
                  </div>
                </div>
                {/* larger title/name */}
                <h3 className="mt-4 text-xl sm:text-2xl font-semibold text-[#344E41] text-center">
                  {p.title}
                </h3>

                {/* stars according to avg_score (full / half / empty) */}
                <div className="flex items-center space-x-2 mt-3">
                  {(() => {
                    const avg = Number(p.avg_score ?? 0);
                    const safeAvg = Math.max(0, Math.min(5, avg));
                    const full = Math.floor(safeAvg);
                    const frac = safeAvg - full;
                    const hasHalf = frac >= 0.5;
                    const empty = 5 - full - (hasHalf ? 1 : 0);
                    const halfId = `half-clip-${p.id}`;

                    return (
                      <>
                        {/* full stars */}
                        {Array.from({ length: full }).map((_, i) => (
                          <svg
                            key={`full-${i}`}
                            className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                            viewBox="0 0 24 24"
                            aria-hidden
                            fill="#3A5A40"
                            stroke="#3A5A40"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}

                        {/* half star */}
                        {hasHalf && (
                          <svg
                            key="half"
                            className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <defs>
                              <clipPath id={halfId}>
                                <rect x="0" y="0" width="50%" height="100%" />
                              </clipPath>
                            </defs>
                            <path
                              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                              fill="#3A5A40"
                              clipPath={`url(#${halfId})`}
                            />
                            <path
                              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                              fill="none"
                              stroke="#3A5A40"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}

                        {/* empty stars */}
                        {Array.from({ length: empty }).map((_, i) => (
                          <svg
                            key={`empty-${i}`}
                            className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#3A5A40"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}

                        {/* numeric avg (larger & bold) */}
                        <span className="ml-2 text-sm sm:text-base font-bold text-[#344E41]">
                          {formatAvg(p.avg_score)}
                        </span>
                      </>
                    );
                  })()}
                </div>

                {/* larger price */}
                <p className="text-lg sm:text-xl text-[#344E41] mt-3 font-semibold">
                  {formatPrice(p.price)}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
