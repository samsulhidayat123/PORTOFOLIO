// Contoh ringkas layout grid di Tailwind
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 max-w-6xl mx-auto">
  {/* Kotak Besar - Proyek Utama */}
  <div className="md:col-span-2 md:row-span-2 bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
    <h2 className="text-2xl font-bold">VOID PROTOCOL</h2>
    <p className="text-zinc-400">Steganography Chat System</p>
  </div>

  {/* Kotak Kecil - Tech Stack */}
  <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
    <h3 className="font-semibold">Tech Stack</h3>
    <div className="flex gap-2 mt-2">
       <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs">Next.js</span>
       <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md text-xs">Flask</span>
    </div>
  </div>

  {/* Kotak Sedang - Socials */}
  <div className="md:col-span-2 bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex items-center justify-between">
    <span>Follow my journey</span>
    <a href="#" className="p-3 bg-white text-black rounded-full text-sm font-bold">GitHub</a>
  </div>
</div>