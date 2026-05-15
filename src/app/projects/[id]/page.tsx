import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getProjectById } from '@/lib/projectsStore';

type ProjectDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    notFound();
  }

  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white md:px-24">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/#projects"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Projects
        </Link>

        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
              {project.image && (
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                  priority
                />
              )}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-red-500">
              Project Detail
            </p>
            <h1 className="mb-5 text-4xl font-black leading-tight md:text-6xl">
              {project.title}
            </h1>
            <p className="mb-8 text-base leading-relaxed text-zinc-300 md:text-lg">
              {project.description}
            </p>

            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-red-700"
            >
              Open Project
              <ExternalLink size={16} />
            </a>
          </div>
        </section>

        <section className="mt-16 grid gap-8 border-t border-zinc-800 pt-10 md:grid-cols-3">
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-500">
              Overview
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              Project ini ditampilkan sebagai karya portofolio dengan fokus pada hasil akhir, teknologi yang digunakan, dan akses langsung ke URL project.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-500">
              Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.tech.length > 0 ? (
                project.tech.map((tech) => (
                  <span
                    key={tech}
                    className="rounded bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-300"
                  >
                    {tech}
                  </span>
                ))
              ) : (
                <span className="text-sm text-zinc-500">No tech stack listed</span>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-500">
              Project URL
            </h2>
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-zinc-300 transition hover:text-white"
            >
              {project.link}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
