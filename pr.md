# Review Masalah Website Portofolio

Tanggal review: 2026-05-15

## Ringkasan

Website berhasil build dan lint tanpa error, tetapi masih ada beberapa masalah penting di sisi keamanan admin/API, konsistensi data, UX, dan konfigurasi produksi. Prioritas paling mendesak adalah mengunci endpoint admin/API, memperbaiki mekanisme autentikasi, dan merapikan konfigurasi gambar eksternal.

## Temuan Prioritas Tinggi - Selesai

### 1. Endpoint CRUD project tidak dilindungi autentikasi

- Lokasi: `src/app/api/projects/route.ts:152`, `src/app/api/projects/route.ts:181`, `src/app/api/projects/route.ts:226`
- Masalah: endpoint `POST`, `PUT`, dan `DELETE` bisa dipanggil langsung tanpa validasi login/admin. Middleware hanya melindungi halaman `/admin/dashboard`, bukan API.
- Dampak: siapa pun yang tahu endpoint dapat menambah, mengubah, atau menghapus project.
- Rekomendasi: buat helper validasi admin token/session di API route, lalu tolak request mutasi dengan status `401/403` jika tidak valid.
- Status: selesai. `POST`, `PUT`, dan `DELETE` sekarang memanggil `verifyAdminRequest()` dan mengembalikan `401` jika token admin tidak valid.

### 2. Login admin memakai fallback password default

- Lokasi: `src/app/api/auth/login/route.ts:4`
- Masalah: jika `ADMIN_PASSWORD` tidak tersedia, aplikasi otomatis memakai `admin123`.
- Dampak: deployment yang lupa mengisi environment variable langsung punya password admin yang mudah ditebak.
- Rekomendasi: hapus fallback `admin123`; jika `ADMIN_PASSWORD` kosong, return error konfigurasi server dan jangan izinkan login.
- Status: selesai. Fallback `admin123` dihapus; login sekarang gagal dengan error konfigurasi server jika `ADMIN_PASSWORD` belum diset.

### 3. Cookie admin statis dan middleware hanya mengecek keberadaan cookie

- Lokasi: `src/app/api/auth/login/route.ts:13`, `src/middleware.ts:9`
- Masalah: cookie selalu berisi string statis `authenticated`, sementara middleware hanya mengecek apakah cookie ada.
- Dampak: user bisa membuat cookie `admin-token` sendiri dan melewati proteksi halaman dashboard.
- Rekomendasi: gunakan token yang ditandatangani, session id server-side, atau JWT dengan secret kuat; middleware harus memverifikasi isi token, bukan hanya keberadaannya.
- Status: selesai. Cookie admin sekarang berisi token HMAC-signed dengan masa berlaku, dan middleware memverifikasi signature serta expiry token.

### 4. Tidak ada rate limiting untuk login dan upload

- Lokasi: `src/app/api/auth/login/route.ts:6`, `src/app/api/upload/route.ts:4`
- Masalah: endpoint login dan upload bisa dipukul berulang-ulang tanpa pembatasan.
- Dampak: login rentan brute force, upload rentan abuse biaya/kuota ImgBB.
- Rekomendasi: tambahkan rate limiting berbasis IP/session, logging percobaan gagal, dan lockout sementara untuk login.
- Status: selesai. Login dibatasi 5 percobaan per 15 menit per IP, upload dibatasi 20 percobaan per jam per IP, dan upload sekarang juga wajib token admin valid.

### Catatan Implementasi Prioritas Tinggi

- File baru: `src/lib/adminAuth.ts`, `src/lib/rateLimit.ts`, `src/app/api/auth/logout/route.ts`
- File diubah: `src/app/api/auth/login/route.ts`, `src/middleware.ts`, `src/app/api/projects/route.ts`, `src/app/api/upload/route.ts`, `src/app/admin/dashboard/page.tsx`
- Environment: pastikan `ADMIN_PASSWORD` selalu tersedia. Opsional, tambahkan `ADMIN_AUTH_SECRET` agar secret signing token terpisah dari password admin.

## Temuan Prioritas Sedang - Selesai

### 5. Semua domain HTTPS diizinkan untuk `next/image`

- Lokasi: `next.config.ts:14`
- Masalah: `hostname: '**'` mengizinkan gambar dari semua domain HTTPS.
- Dampak: permukaan risiko dan biaya optimasi gambar jadi terlalu luas; konfigurasi produksi sulit diaudit.
- Rekomendasi: batasi ke domain yang benar-benar dipakai, misalnya domain ImgBB/CDN tertentu dan asset internal.
- Status: selesai. `next/image` sekarang hanya mengizinkan gambar remote dari `i.ibb.co` dan `localhost:3000` untuk development.

### 6. API project belum punya validasi input yang ketat

- Lokasi: `src/app/api/projects/route.ts:154`, `src/app/api/projects/route.ts:183`
- Masalah: request body langsung dipercaya untuk `title`, `description`, `link`, `tech`, `size`, dan `image`.
- Dampak: data invalid bisa masuk database/file JSON, layout bisa rusak, dan link/gambar berpotensi mengarah ke tujuan yang tidak diinginkan.
- Rekomendasi: validasi schema dengan Zod atau validator sejenis; whitelist nilai `size`, validasi URL, batasi panjang teks, dan pastikan `tech` berupa array string.
- Status: selesai. API sekarang memvalidasi payload project, membatasi panjang field, whitelist `size`, validasi URL `link`, validasi path/host gambar, dan memastikan `tech` berupa array string.

### 7. Data lokal ditulis dari API runtime

- Lokasi: `src/app/api/projects/route.ts:21`, `src/app/api/projects/route.ts:45`, `src/app/api/projects/route.ts:94`
- Masalah: API menulis ulang `data/projects.json` dari runtime aplikasi.
- Dampak: di platform serverless atau environment read-only, data bisa gagal tersimpan atau hilang saat redeploy; concurrent request juga bisa menimpa data.
- Rekomendasi: pilih satu sumber data utama. Untuk produksi, gunakan database sebagai source of truth dan jadikan file JSON hanya seed/migration manual.
- Status: selesai. Saat `DATABASE_URL` tersedia, CRUD project sekarang hanya memakai database dan tidak menulis ulang `data/projects.json`. File JSON tetap menjadi fallback jika database tidak dikonfigurasi, dan seed awal ketika database kosong.

### 8. Pembuatan tabel dilakukan dari request aplikasi

- Lokasi: `src/app/api/projects/route.ts:107`, `src/app/api/projects/route.ts:114`
- Masalah: `CREATE TABLE IF NOT EXISTS` berjalan dari request API.
- Dampak: lifecycle schema bercampur dengan request user, sulit diaudit, dan bisa memperlambat request awal.
- Rekomendasi: pindahkan ke migration script terpisah yang dijalankan saat deploy/setup.
- Status: selesai. Pembuatan tabel dipindahkan ke `scripts/init-db.mjs` dan bisa dijalankan lewat `npm.cmd run db:init`.

### 9. Upload gambar bergantung ke layanan eksternal tanpa fallback

- Lokasi: `src/app/api/upload/route.ts:23`, `src/app/api/upload/route.ts:37`
- Masalah: upload hanya berhasil jika `IMGBB_API_KEY` tersedia dan ImgBB sedang normal.
- Dampak: admin tidak bisa membuat project bergambar saat layanan eksternal bermasalah.
- Rekomendasi: tampilkan pesan konfigurasi yang lebih spesifik di dashboard, dan pertimbangkan fallback storage seperti S3/R2/Supabase Storage.
- Status: selesai. Upload sekarang punya fallback lokal untuk development atau saat `UPLOAD_STORAGE=local`, validasi tipe file lebih ketat, dan error storage dibuat lebih spesifik jika ImgBB/fallback tidak tersedia.

### Catatan Implementasi Prioritas Sedang

- File baru: `scripts/init-db.mjs`
- File diubah: `next.config.ts`, `package.json`, `src/app/api/projects/route.ts`, `src/app/api/upload/route.ts`
- Command baru: `npm.cmd run db:init`
- Environment opsional: `UPLOAD_STORAGE=local` untuk fallback upload lokal; production tetap disarankan memakai storage eksternal yang stabil.

## Temuan UX dan Konten - Selesai

### 10. Project yang diupload dari admin tidak selalu muncul di dashboard

- Lokasi: `src/app/admin/dashboard/page.tsx:157`, `src/app/admin/dashboard/page.tsx:169`, `src/app/api/projects/route.ts:152`, `src/app/api/projects/route.ts:164`
- Masalah: setelah admin mengupload/menambahkan project, project bisa tidak muncul di dashboard. Alur saat ini hanya menambahkan project ke state lokal jika response `POST /api/projects` sukses, tetapi tidak melakukan refresh ulang dari sumber data setelah create. Jika API gagal menyimpan ke database/file lokal, response tidak sesuai, atau terjadi perbedaan data antara database dan `data/projects.json`, dashboard bisa terlihat tidak sinkron.
- Dampak: admin merasa project sudah berhasil dibuat, tetapi daftar dashboard tidak menampilkan data baru atau data hilang setelah refresh.
- Rekomendasi: setelah create/update/delete sukses, panggil ulang `fetchProjects()` dari server sebagai source of truth. Tambahkan juga pesan error yang menampilkan alasan API sebenarnya, logging response create, dan pastikan hanya ada satu sumber data utama agar dashboard tidak membaca data yang berbeda dari tempat penyimpanan.
- Status: selesai. Dashboard sekarang memanggil ulang data project dari server setelah create, update, dan delete.

### 11. Tombol utama hero belum punya aksi

- Lokasi: `src/app/page.tsx:59`, `src/app/page.tsx:62`
- Masalah: tombol `CONTACT ME` dan `DOWNLOAD CV` hanya button tanpa handler/link.
- Dampak: user mengira tombol bisa dipakai, tetapi tidak terjadi apa-apa.
- Rekomendasi: ubah menjadi link `mailto:`/halaman kontak dan link file CV di `public`.
- Status: selesai. `CONTACT ME` sekarang membuka email, dan `DOWNLOAD CV` mengunduh `public/cv-samsul-hidayat.txt`.

### 12. Link sosial masih placeholder

- Lokasi: `src/app/page.tsx:109`, `src/app/page.tsx:110`
- Masalah: LinkedIn dan Twitter masih memakai `href="#"`.
- Dampak: navigasi tidak berguna dan terasa belum selesai.
- Rekomendasi: isi URL asli atau sembunyikan link yang belum tersedia.
- Status: selesai. Link placeholder di footer dihapus; footer sekarang hanya menampilkan GitHub dan Email yang valid.

### 13. Navigasi Projects mengarah ke anchor yang tidak ada

- Lokasi: `src/components/navbar.tsx:33`, `src/components/navbar.tsx:88`, target section di `src/app/page.tsx:82`
- Masalah: navbar memakai `/#projects`, tetapi section project tidak memiliki `id="projects"`.
- Dampak: klik Projects tidak scroll tepat ke daftar project.
- Rekomendasi: tambahkan `id="projects"` pada wrapper section project.
- Status: selesai. Section project sekarang memiliki `id="projects"` dan `scroll-mt-24`.

### 14. Public page menyembunyikan error fetch project

- Lokasi: `src/app/page.tsx:22`, `src/app/page.tsx:32`
- Masalah: saat fetch gagal, halaman hanya berhenti loading dan akhirnya bisa terlihat seperti tidak ada project.
- Dampak: pengunjung tidak tahu apakah project memang kosong atau data gagal dimuat.
- Rekomendasi: simpan state error dan tampilkan pesan fallback yang jelas.
- Status: selesai. Halaman utama sekarang server-render data project dan menampilkan pesan error jelas jika load data gagal.

### Catatan Implementasi UX dan Konten

- File baru: `public/cv-samsul-hidayat.txt`
- File diubah: `src/app/page.tsx`, `src/app/admin/dashboard/page.tsx`

## Temuan Maintainability - Selesai

### 15. Project dirender client-side sehingga konten project kurang SEO-friendly

- Lokasi: `src/app/page.tsx:1`, `src/app/page.tsx:22`
- Masalah: halaman utama menjadi client component dan project baru muncul setelah fetch di browser.
- Dampak: konten project tidak tersedia di HTML awal, kurang ideal untuk SEO dan performa first content.
- Rekomendasi: ambil data project di server component atau lewat function server-side, lalu sisakan interaksi kecil di client component bila diperlukan.
- Status: selesai. Halaman utama sekarang server component dan membaca project dari helper server-side `getProjects()`.

### 16. File konstanta project kosong/tidak dipakai

- Lokasi: `src/constants/projects.ts`
- Masalah: file ada tetapi kosong, sementara data sebenarnya berada di `data/projects.json` dan API.
- Dampak: membingungkan saat maintenance karena terlihat seperti sumber data lain.
- Rekomendasi: hapus file kosong atau jadikan tempat type/constant yang benar-benar dipakai.
- Status: selesai. File kosong `src/constants/projects.ts` dihapus.

### 17. Script lint masih memakai command deprecated

- Lokasi: `package.json:8`
- Masalah: `next lint` masih berjalan, tetapi output build menyebut command ini deprecated dan akan dihapus di Next.js 16.
- Dampak: upgrade Next berikutnya bisa mematahkan workflow lint.
- Rekomendasi: migrasikan ke ESLint CLI sesuai saran Next.js.
- Status: selesai. Script `lint` sekarang memakai `eslint .` dengan konfigurasi flat config di `eslint.config.mjs`.

### Catatan Implementasi Maintainability

- File baru: `src/lib/projectsStore.ts`, `eslint.config.mjs`
- File diubah: `package.json`, `src/app/api/projects/route.ts`, `src/app/page.tsx`, `src/components/bento/BentoCard.tsx`, `src/app/admin/login/page.tsx`, `src/app/api/auth/login/route.ts`
- File dihapus: `src/constants/projects.ts`

## Verifikasi

- `npm.cmd run db:init`: berhasil; tabel `projects` siap di database.
- `npm.cmd run lint`: berhasil tanpa warning.
- `npm.cmd run build`: berhasil.
