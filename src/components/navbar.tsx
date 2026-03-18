"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderCode, Mail, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:block fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-6 px-6 py-3 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-md shadow-2xl hover:border-zinc-700 transition-colors">
          <Link
            href="/"
            className={`p-2 rounded-lg transition-colors ${
              isActive("/") && pathname === "/"
                ? "text-red-600 bg-red-600/10"
                : "text-zinc-400 hover:text-red-600"
            }`}
            title="Home"
          >
            <Home size={20} />
          </Link>
          <Link
            href="/#projects"
            className="text-zinc-400 hover:text-red-600 transition-colors p-2 rounded-lg"
            title="Projects"
          >
            <FolderCode size={20} />
          </Link>
          <div className="h-4 w-[1px] bg-zinc-700" />
          <Link
            href="mailto:samaul1245sh@gmail.com"
            className="bg-red-600 p-2 rounded-full hover:bg-red-700 transition-colors"
            title="Email"
          >
            <Mail size={18} className="text-white" />
          </Link>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="flex justify-between items-center px-4 py-4">
          <Link href="/" className="text-base font-black text-white">
            PROJECT.78
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="mailto:samaul1245sh@gmail.com"
              className="bg-red-600 p-2 rounded-full hover:bg-red-700 transition-colors"
            >
              <Mail size={18} className="text-white" />
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-red-600 transition-colors p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="bg-black/95 border-t border-zinc-800 px-4 py-4 space-y-3">
            <Link
              href="/"
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                pathname === "/"
                  ? "text-red-600 bg-red-600/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Home size={20} /> Home
            </Link>
            <Link
              href="/#projects"
              className="flex items-center gap-3 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors p-3 rounded-lg"
              onClick={() => setIsOpen(false)}
            >
              <FolderCode size={20} /> Projects
            </Link>
          </div>
        )}
      </nav>

      {/* Spacer untuk mobile navbar */}
      <div className="md:hidden h-20" />
    </>
  );
};

export default Navbar;