import Image from 'next/image';
import { BentoCard } from '@/components/bento/BentoCard';
import { getProjects } from '@/lib/projectsStore';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const projects = await getProjects().catch((error) => {
    console.error('Failed to load projects:', error);
    return null;
  });

  return (
    <main className="min-h-screen p-6 md:p-24 max-w-7xl mx-auto bg-black text-white">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between mb-20 gap-10">
        <div className="flex-1">
          <h2 className="text-red-600 font-bold tracking-widest uppercase mb-2">Project.78</h2>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-none">
            I build web apps <br />
            <span className="text-red-600">that feel sharp.</span>
          </h1>
          <p className="text-zinc-400 max-w-md mb-8">
            Saya SamSuL HidayaT, mahasiswa Teknik Informatika yang membangun website full-stack, dashboard admin, dan interface modern yang cepat dipakai.
          </p>
          <div className="flex gap-4 flex-wrap">
            <a
              href="mailto:samaul1245sh@gmail.com"
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-8 py-3 rounded-md font-bold transition"
            >
              CONTACT ME
            </a>
            <a
              href="/cv-samsul-hidayat.pdf"
              download
              className="border border-zinc-700 hover:bg-zinc-800 active:scale-95 text-white px-8 py-3 rounded-md font-bold transition"
            >
              DOWNLOAD CV
            </a>
          </div>
        </div>

        {/* Portrait */}
        <div className="relative flex-1 flex justify-center items-center">
          <div className="absolute w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-red-600 rounded-full filter blur-[80px] opacity-20" />
          <div className="relative w-[280px] h-[350px] md:w-[400px] md:h-[500px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <Image
              src="/me.png"
              alt="Portrait"
              fill
              className="object-cover grayscale hover:grayscale-0 transition duration-500"
            />
          </div>
        </div>
      </section>

      <section id="projects" className="scroll-mt-24">
        {/* Section Title */}
        <div className="mb-8">
          <h2 className="text-red-600 font-bold tracking-widest uppercase text-sm mb-1">Selected Work</h2>
          <h3 className="text-3xl md:text-4xl font-black">PROJECTS</h3>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {projects === null ? (
            <div className="col-span-full text-center py-12 text-zinc-500">
              Projects failed to load. Please try again later.
            </div>
          ) : projects.length === 0 ? (
            <div className="col-span-full text-center py-12 text-zinc-500">
              No projects yet
            </div>
          ) : (
            projects.map((project) => (
              <BentoCard key={project.id} {...project} />
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-600 text-sm">
        <p className="font-bold tracking-widest uppercase">Project.78 © {new Date().getFullYear()}</p>
        <div className="flex gap-6">
          <a href="https://github.com/samsulhidayat123" className="hover:text-white transition">GitHub</a>
          <a href="mailto:samaul1245sh@gmail.com" className="hover:text-white transition">Email</a>
        </div>
      </footer>
    </main>
  );
}
