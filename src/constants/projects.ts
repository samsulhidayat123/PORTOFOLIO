export type Project = {
  id: number;
  title: string;
  description: string;
  link: string;
  tech: string[];
  size: string;
  image: string;
};

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "VOID PROTOCOL",
    description: "Web-based room chat dengan steganografi gambar untuk menyembunyikan pesan.",
    link: "https://github.com/yourusername/void-protocol",
    tech: ["Python", "Flask", "Steganography"],
    size: "md:col-span-2 md:row-span-2",
    image: "/images/void-protocol.jpg",
  },
  {
    id: 2,
    title: "ORI-LINK",
    description: "Personal bio-link platform built with Next.js and Tailwind.",
    link: "https://ori-link.vercel.app",
    tech: ["Next.js", "Tailwind"],
    size: "md:col-span-1",
    image: "/images/ori-link.png",
  },
  {
    id: 3,
    title: "Project.78",
    description: "Personal branding & Tech Enthusiast portal.",
    link: "#",
    tech: ["Branding", "Design"],
    size: "md:col-span-1",
    image: "/images/project78.jpg",
  },
  {
    id: 4,
    title: "Destruction Brand",
    description: "Streetwear fashion brand dengan estetika brutalist.",
    link: "#",
    tech: ["Fashion", "Design"],
    size: "md:col-span-2",
    image: "/images/destruction.jpg",
  },
];