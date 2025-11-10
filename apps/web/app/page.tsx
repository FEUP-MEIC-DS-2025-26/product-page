import ProductDetail from '@/components/ProductDetail';
import Recommendations from '@/components/Recommendations';
import Reviews from '@/components/Reviews';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#DAD7CD]">
      <div className="max-w-[1600px] mx-auto px-8 sm:px-12 md:px-16 lg:px-20 xl:px-32 py-8">
        {/* Product Detail - Main Product */}
        <ProductDetail />

        {/* Reviews component */}
        <Reviews />

        {/* Recommendations component */}
        <Recommendations />
      </div>
    </main>
  );
}