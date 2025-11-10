import { prisma } from '@/lib/prisma';

export default async function Reviews() {
  const reviews = await prisma.review.findMany({
    include: {
      user: {
        select: {
          first_name: true,
          last_name: true,
          photo_url: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-6 h-6 sm:w-8 sm:h-8 ${
          i < score ? 'fill-[#344E41]' : 'fill-none'
        } stroke-[#344E41] stroke-2`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-PT', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-black">Avaliações:</h2>
        <button className="flex items-center gap-2 px-4 py-2 border-2 border-[#344E41] rounded-xl hover:bg-[#A3B18A] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-semibold">Mais recentes</span>
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-[#B8C9A8] rounded-2xl p-6 shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Left side: User info and review */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#344E41] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>

                  {/* User Name */}
                  <span className="font-bold text-lg sm:text-xl text-black">
                    {review.user.first_name} {review.user.last_name}
                  </span>

                  {/* Stars - Desktop */}
                  <div className="hidden sm:flex gap-1">
                    {renderStars(review.score)}
                  </div>
                </div>

                {/* Stars - Mobile */}
                <div className="flex gap-1 mb-3 sm:hidden">
                  {renderStars(review.score)}
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-black text-base sm:text-lg leading-relaxed pl-0 sm:pl-15">
                    {review.comment}
                  </p>
                )}
              </div>

              {/* Right side: Date and actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                <span className="text-sm sm:text-base text-[#344E41] font-medium">
                  {formatDate(review.created_at)}
                </span>
                
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/30 rounded-lg transition-colors" aria-label="Like">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="#344E41" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-white/30 rounded-lg transition-colors" aria-label="Dislike">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="#344E41" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* See More Button */}
      <div className="text-center pt-4">
        <button className="text-[#344E41] hover:text-[#588157] font-bold text-lg underline hover:no-underline transition-all">
          Ver mais
        </button>
      </div>
    </div>
  );
}