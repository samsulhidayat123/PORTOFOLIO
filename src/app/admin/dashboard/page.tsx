// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Edit2, Plus, LogOut, Upload, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Notice } from '@/components/ui/Notice';

type Project = {
  id: number;
  title: string;
  description: string;
  link: string;
  tech: string[];
  size: string;
  image: string;
};

type NoticeState = {
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
  message: string;
};

export default function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<Omit<Project, 'id'>>({
    title: '',
    description: '',
    link: '',
    tech: [],
    size: 'md:col-span-1',
    image: '',
  });

  // Load projects
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error(data.error || 'Invalid project response');
      }

      setProjects(data);
      setNotice(null);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setNotice({
        type: 'error',
        title: 'Gagal memuat',
        message: 'Gagal memuat project. Cek koneksi database atau file data lokal.',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProjects = async () => {
    const res = await fetch('/api/projects', { cache: 'no-store' });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Failed to refresh projects');
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error(data.error || 'Invalid project response');
    }

    setProjects(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, image: data.path });
        setUploadPreview(data.path);
        setNotice({
          type: 'success',
          title: 'Upload berhasil',
          message: 'Gambar project sudah siap dipakai.',
        });
      } else {
        const data = await res.json().catch(() => null);
        setNotice({
          type: 'error',
          title: 'Upload gagal',
          message: data?.error || 'Upload gambar gagal',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setNotice({
        type: 'error',
        title: 'Upload gagal',
        message: 'Upload gambar gagal',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    
    if (!formData.image) {
      setNotice({
        type: 'warning',
        title: 'Gambar belum ada',
        message: 'Upload gambar project dulu bro.',
      });
      return;
    }

    try {
      if (editingId) {
        // Update
        const res = await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...formData }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || 'Failed to update project');
        }

        await refreshProjects();
        setEditingId(null);
        setNotice({
          type: 'success',
          title: 'Project diupdate',
          message: 'Perubahan project sudah tersimpan.',
        });
      } else {
        // Create
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || 'Failed to create project');
        }

        await refreshProjects();
        setNotice({
          type: 'success',
          title: 'Project dibuat',
          message: 'Project baru sudah masuk ke dashboard.',
        });
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save project:', error);
      setNotice({
        type: 'error',
        title: 'Gagal menyimpan',
        message: 'Project gagal disimpan. Coba lagi atau cek konfigurasi database.',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/projects?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to delete project');
      }

      await refreshProjects();
      setNotice({
        type: 'success',
        title: 'Project dihapus',
        message: `"${deleteTarget.title}" sudah dihapus dari dashboard.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      setNotice({
        type: 'error',
        title: 'Gagal menghapus',
        message: 'Project gagal dihapus.',
      });
    }
  };

  const handleEdit = (project: Project) => {
    setFormData({
      title: project.title,
      description: project.description,
      link: project.link,
      tech: project.tech,
      size: project.size,
      image: project.image,
    });
    setUploadPreview(project.image);
    setEditingId(project.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      link: '',
      tech: [],
      size: 'md:col-span-1',
      image: '',
    });
    setUploadPreview('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    router.push('/admin/login');
  };

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black mb-2">ADMIN PANEL</h1>
            <p className="text-zinc-500">Kelola Projects mu</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-md transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {notice && (
          <Notice
            type={notice.type}
            title={notice.title}
            message={notice.message}
            className="mb-8"
          />
        )}

        {/* Add Project Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-6 py-3 rounded-md font-bold mb-8 transition"
          >
            <Plus size={20} />
            Add Project
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-widest">
              {editingId ? 'Edit Project' : 'New Project'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold mb-4 uppercase">Project Image</label>
                
                {!uploadPreview ? (
                  <label className="block border-2 border-dashed border-zinc-700 hover:border-red-600 rounded-lg p-8 text-center cursor-pointer transition bg-black/50">
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={32} className="text-zinc-600" />
                      <span className="text-sm font-medium">Click to upload or drag and drop</span>
                      <span className="text-xs text-zinc-600">PNG, JPG, GIF up to 5MB</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative w-full">
                    <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                      <Image
                        src={uploadPreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <label className="block border border-zinc-700 hover:border-red-600 rounded-lg p-4 text-center cursor-pointer transition bg-black/50">
                      <span className="text-sm text-zinc-400 hover:text-white">Change Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {uploading && (
                  <Notice
                    type="info"
                    title="Uploading"
                    message="Gambar sedang diupload, tunggu sebentar."
                    className="mt-4"
                  />
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-red-600 h-24 resize-none"
                  required
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">Project URL (bebas)</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://demo-atau-link-project.com"
                  className="w-full bg-black border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={formData.tech.join(', ')}
                  onChange={(e) => setFormData({ ...formData, tech: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="React, Tailwind, Next.js"
                  className="w-full bg-black border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">Grid Size</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-red-600"
                >
                  <option value="md:col-span-1">Small (1x1)</option>
                  <option value="md:col-span-2">Medium (2x1)</option>
                  <option value="md:col-span-2 md:row-span-2">Large (2x2)</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded transition uppercase tracking-widest"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded transition uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects List */}
        <div>
          <h2 className="text-2xl font-black mb-6 uppercase tracking-widest">Projects ({projects.length})</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No projects yet. Create one to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition">
                  <div className="flex justify-between items-start gap-4">
                    {/* Image Thumbnail */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
                      {project.image && (
                        <Image
                          src={project.image}
                          alt={project.title}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.tech.map((t) => (
                          <span key={t} className="bg-red-600/20 text-red-400 text-xs px-2 py-1 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(project)}
                        className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(project)}
                        className="bg-red-600 hover:bg-red-700 p-2 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-md border border-red-600/60 bg-red-950/40 p-2 text-red-400">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest">Hapus Project?</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Project &quot;{deleteTarget.title}&quot; akan dihapus dari dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-md bg-zinc-800 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-zinc-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-md bg-red-600 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
