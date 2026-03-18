// src/components/bento/BentoCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

type BentoCardProps = {
  id: number;
  title: string;
  description: string;
  link: string;
  tech: string[];
  size: string;
  image: string;
};

export function BentoCard({
  id,
  title,
  description,
  link,
  tech,
  size,
  image,
}: BentoCardProps) {
  return (
    <Link href={link} target="_blank" rel="noopener noreferrer">
      <div className={`${size} group relative h-48 md:h-80 lg:h-96 cursor-pointer overflow-hidden rounded-lg border border-zinc-800 hover:border-red-600 transition`}>
        {/* Background Image - Full Size */}
        {image && (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition duration-500 grayscale group-hover:grayscale-0 absolute inset-0"
            priority={false}
          />
        )}

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent group-hover:from-black/80 transition duration-300" />

        {/* Content - Always at bottom, no stacking */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10">
          {/* Tech Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {tech.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded font-bold uppercase tracking-wider"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="text-lg md:text-xl font-black text-white mb-2 line-clamp-2">
            {title}
          </h3>

          {/* Description - Show on hover */}
          <p className="text-xs md:text-sm text-zinc-200 line-clamp-2 mb-3 opacity-0 group-hover:opacity-100 transition duration-300">
            {description}
          </p>

          {/* Link */}
          <div className="flex items-center gap-2 text-white text-sm font-bold group-hover:gap-3 transition">
            Lihat Projek <span>→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}