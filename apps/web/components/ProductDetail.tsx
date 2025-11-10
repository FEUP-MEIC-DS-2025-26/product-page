import Image from 'next/image';
import { prisma } from '@/lib/prisma';

export default async function ProductDetail() {
  const product = await prisma.product.findFirst({
    where: {
      id: 3 // Get the specific product that has reviews
    },
    include: { 
      photos: true,
      reviews: true,
    },
  });

  if (!product) {
    return (
      <div className="bg-[#DAD7CD] rounded-2xl p-6">
        <p className="text-[#588157] text-lg">Nenhum produto encontrado. Execute: npx prisma db seed</p>
      </div>
    );
  }

  // Debug logs
  console.log('Product ID:', product.id);
  console.log('Product Reviews:', product.reviews);
  console.log('Review Count:', product.reviews.length);

  // get accurate review count from the DB (avoids stale/empty includes)
  const reviewCount = await prisma.review.count({
    where: { product_id: product.id },
  });
  const mainPhoto = product.photos.find(p => p.is_main) || product.photos[0];
  const specifications = product.specifications as any;
  
  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1;
      const isFilled = score >= starNumber;
      const isHalfFilled = score >= starNumber - 0.5 && score < starNumber;

      if (isHalfFilled) {
        return (
          <svg
            key={i}
            className="w-9 h-9 sm:w-10 sm:h-10 stroke-black stroke-2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`half-${i}`}>
                <stop offset="50%" stopColor="#000000" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#half-${i})`}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        );
      }

      return (
        <svg
          key={i}
          className={`w-9 h-9 sm:w-10 sm:h-10 ${
            isFilled ? 'fill-black' : 'fill-none'
          } stroke-black stroke-2`}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      );
    });
  };

  return (
    <div className="space-y-8">
      {/* Main Product Card */}
      <div className="bg-[#DAD7CD] rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 lg:gap-8">
          
          {/* Left: Product Image */}
          <div className="rounded-2xl flex items-center justify-center">
            <div className="rounded-2xl bg-[#274836] p-4 w-[260px] sm:w-[300px] lg:w-[350px] h-[260px] sm:h-[300px] lg:h-[350px] flex items-center justify-center">
              <div className="bg-white rounded-md w-full h-full flex items-center justify-center overflow-hidden">
                {/* use Next/Image for deterministic server/client markup */}
                <Image
                  src={mainPhoto?.photo_url || '/placeholder-product.png'}
                  alt={mainPhoto?.alt_text || product.title}
                  width={300}
                  height={300}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Title and Wishlist */}
              <div className="flex justify-between items-start mb-0.5">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#344E41] leading-tight">
                  {product.title}
                </h1>
                <button 
                  className="p-2 hover:scale-110 active:scale-95 hover:fill-[#344E41] transition-all flex-shrink-0 group"
                  aria-label="Add to wishlist"
                >
                  <svg 
                    className="w-10 h-10 sm:w-12 sm:h-12 group-hover:fill-[#344E41] transition-all" 
                    fill="none" 
                    stroke="#344E41" 
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                    />
                  </svg>
                </button>
              </div>

              {/* Storytelling */}
              {product.storytelling && (
                <p className="text-base sm:text-lg font-semibold text-black mb-3">
                  {product.storytelling}
                </p>
              )}

              {/* Description */}
              {product.description && (
                <p className="text-sm sm:text-base text-black mb-4 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Rating with count */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => {
                    const starNumber = i + 1;
                    const isFilled = product.avg_score >= starNumber;
                    const isHalfFilled = product.avg_score >= starNumber - 0.5 && product.avg_score < starNumber;

                    return (
                      <svg
                        key={i}
                        className={`w-9 h-9 sm:w-10 sm:h-10 ${
                          isFilled ? 'fill-[#3A5A40]' : 'fill-none'
                        } stroke-[#3A5A40] stroke-2`}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    );
                  })}
                </div>
                <span className="text-base sm:text-lg font-medium text-[#3A5A40]">
                  {reviewCount === 0
                    ? 'Sem avaliações'
                    : `(${reviewCount} avaliaç${reviewCount > 1 ? 'ões' : 'ão'})`}
                </span>
              </div>
            </div>

            {/* Practise and Actions */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4">
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black whitespace-nowrap flex items-center">
                {Number(product.price).toFixed(2)} €
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <button className="flex-1 bg-[#344E41] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-[#A3B18A] hover:text-black transition-colors flex items-center justify-center gap-3 shadow-md">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Comprar
                </button>

                <button className="flex-1 bg-[#588157] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-[#A3B18A] hover:text-black transition-colors flex items-center justify-center gap-3 shadow-md">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="hidden sm:inline">Falar com o Vendedor</span>
                  <span className="sm:hidden">Vendedor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div> 
      <div className="h-px bg-[#344E41]/30 my-6" />

      {/* Additional Information Sections */}
      <div className="space-y-1">
        {specifications && Array.isArray(specifications) && specifications.map((spec: any, index: number) => (
          <div key={index} className="bg-[#DAD7CD] rounded-2xl p-6 sm:p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#344E41] mb-4">{spec.title}</h2>
            <div className="text-black text-lg sm:text-xl leading-relaxed whitespace-pre-line">
              {spec.description}
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-[#344E41]/30 my-6" />
    </div>
  );
}