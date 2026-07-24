# WorshipFlow AI 🎵 
### "Architecting Divine Harmony with Precision"

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/samsiahaan/worship-flow)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Hono.js](https://img.shields.io/badge/Hono.js-Framework-orange?logo=hono)](https://hono.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**WorshipFlow AI** adalah platform manajemen pelayanan musik (Worship Team) modern yang menggabungkan kecerdasan buatan dengan desain antarmuka "Sanctuary Modern". Sistem ini dirancang untuk mempermudah Worship Leader dan Musisi dalam merencanakan setlist, mengatur urutan ibadah secara presisi, hingga menyediakan pusat latihan mandiri bagi musisi.

---

## ✨ Fitur Utama

### 1. 🤖 AI Setlist Generator (Reactive Intelligence)
Algoritma generator lagu yang responsif terhadap parameter input (Energy, Tempo, Language Ratio). 
- **Real-time Reactive:** Output lagu berubah secara instan saat slider digeser tanpa refresh halaman.
- **Smart Logic:** Menyeimbangkan transisi kunci nada dan tempo antar lagu secara otomatis.

### 2. 📋 Service Run Sheet (Time Management)
Fitur manajemen waktu menit-demi-menit untuk seluruh tim pelayanan.
- **Service Segments:** Mengatur durasi doa, pujian, hingga khotbah.
- **Total Duration Sync:** Kalkulasi otomatis total waktu ibadah agar tetap *on schedule*.

### 3. 🎸 Practice Center & Chord Transposer
Pusat latihan mandiri untuk musisi dengan fitur profesional.
- **Musical Key Transposer:** Mengubah nada dasar lagu secara instan (C to Ab) dengan render format *monospaced* yang rapi.
- **Smart Fetch Metadata:** Integrasi otomatis dengan **Spotify Web API** untuk *audio preview* dan **LrcLib** untuk lirik.
- **ChordPro Support:** Penempatan chord yang presisi di atas lirik dengan skema warna "High Contrast".

### 4. 📊 Dashboard & Smart Analytics
Pusat komando pelayanan dengan wawasan mendalam.
- **Song Fatigue Warning:** Mendeteksi lagu yang terlalu sering dibawakan agar variasi lagu tetap terjaga.
- **Upcoming Service Countdown:** Pengingat waktu ibadah terdekat dengan shortcut akses cepat.
- **Smart Insights:** Tip berbasis AI mengenai tema mingguan (misal: Hari Raya Gerejawi).

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (Sanctuary Modern Aesthetic)
- **Components:** Shadcn UI & Framer Motion
- **Icons:** Lucide React

### Backend & Database
- **Server:** Hono.js (Node.js Server)
- **Database:** PostgreSQL (Vercel Postgres / Neon)
- **ORM:** Drizzle ORM
- **Deployment:** Vercel

### Integrasi Eksternal
- **Spotify Web API:** Metadata & Audio Previews
- **LrcLib & Lyrics.ovh:** Lyrics Fetching

---

## 🚀 Memulai (Local Development)

### 1. Clone Repository
```bash
git clone [https://github.com/samsiahaan/portosamy.git](https://github.com/samsiahaan/portosamy.git)
```
```bash
cd worship-flow
```
