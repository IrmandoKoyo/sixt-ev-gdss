# 🚀 Panduan Lengkap Langkah demi Langkah: Online (`upro.web.id/dssclass`) & Lokal
### (Klik Apa, Buka Apa, dan Apa yang Perlu Diambil dari Firebase / GitHub / Vercel / Cloudflare)

Panduan ini disusun khusus agar Anda dapat meng-online-kan **Prototype Web GDSS Sixt SE** ke subpath **`https://upro.web.id/dssclass`** dengan database *real-time* **Google Firebase Cloud Firestore** yang **100% gratis (Spark Plan, tanpa kartu kredit)**.

---

## BAGIAN 1: Cara Menjalankan Secara Lokal Saat Ini Juga (0 Detik Setup)

Sebelum di-online-kan, sistem di folder `d:\DSS\finalproject` **sudah 100% jadi dan langsung berfungsi**:
1. **Cara Paling Cepat:** Buka folder `d:\DSS\finalproject\public\dssclass\` lalu klik 2x file **`index.html`**.
2. **Cara Server Lokal:** Buka terminal di `d:\DSS\finalproject`, ketik:
   ```powershell
   python -m http.server 8080 --directory public
   ```
   Lalu buka browser ke: **`http://localhost:8080/dssclass/`**
3. **Cek Multi-Tab Real-Time Secara Lokal:** Buka `http://localhost:8080/dssclass/` di **2 tab browser bersebelahan**. Di Tab 1 pilih peran **DM1 (CFO)** lalu ubah 1 angka atau kirim pesan diskusi; lihat **Tab 2 langsung ikut berubah detik itu juga** berkat teknologi `BroadcastChannel`!

---

## BAGIAN 2: Buat Database Baru di Google Firebase (Gratis Tanpa Kartu Kredit)

Agar saat presentasi nanti **3 anggota kelompok bisa membuka `https://upro.web.id/dssclass` dari 3 laptop/HP berbeda** dan angkanya tersinkronisasi *real-time*, ikuti langkah klik demi klik ini:

### Langkah 2.1 — Buat Project Firebase Baru
1. Buka browser dan masuk ke **[https://console.firebase.google.com/](https://console.firebase.google.com/)** (gunakan akun Google Anda).
2. Klik tombol **"Create a project"** (atau **"Add project"** / **"Tambahkan project"**).
3. **Project name:** Ketik **`sixt-ev-gdss`** $\rightarrow$ Klik **Continue**.
4. **Google Analytics:** Matikan (*toggle off*) **"Enable Google Analytics for this project"** (supaya pembuatan project instan tanpa langkah tambahan) $\rightarrow$ Klik **"Create project"**.
5. Tunggu $\pm 15$ detik hingga muncul tulisan *"Your new project is ready"* $\rightarrow$ Klik **Continue**.

### Langkah 2.2 — Aktifkan Database Cloud Firestore
1. Di menu kiri Firebase Console, klik **"Build"** $\rightarrow$ klik **"Firestore Database"**.
2. Klik tombol **"Create database"**.
3. **Location:** Pilih lokasi terdekat, misalnya **`asia-southeast2 (Jakarta)`** atau **`asia-southeast1 (Singapore)`** $\rightarrow$ Klik **Next**.
4. Pilih **"Start in test mode"** (atau **"Start in production mode"** lalu kita atur Rules di langkah berikutnya) $\rightarrow$ Klik **Create**.
5. Setelah database terbuka, klik tab **"Rules"** di bagian atas Firestore, lalu ganti isinya dengan aturan berikut agar aplikasi GDSS bisa membaca/menulis dokumen sesi grup:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /gdss_sessions/{sessionId} {
         allow read, write: if true;
       }
     }
   }
   ```
6. Klik tombol **"Publish"**.

### Langkah 2.3 — Ambil `firebaseConfig` (Untuk Ditempel ke Aplikasi atau Diberikan ke Saya)
1. Klik ikon **Gear (⚙️ Project Overview / Project settings)** di pojok kiri atas sebelah tulisan *Project Overview* $\rightarrow$ pilih **"Project settings"**.
2. Scroll ke paling bawah ke bagian **"Your apps"** $\rightarrow$ klik ikon Web **`</>`** (bulatan ketiga).
3. **App nickname:** Ketik **`sixt-ev-gdss-web`** (jangan centang Firebase Hosting) $\rightarrow$ klik **"Register app"**.
4. Akan muncul kotak kode berisi **`const firebaseConfig = { ... };`** seperti ini:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "sixt-ev-gdss.firebaseapp.com",
     projectId: "sixt-ev-gdss",
     storageBucket: "sixt-ev-gdss.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef123456"
   };
   ```
5. **Cara Memasukkan `firebaseConfig` (Catatan: Project `sixt-ev-gdss` Sudah Terpasang Bawaan):**
   - Konfigurasi Firebase `sixt-ev-gdss` sudah tertanam permanen di `firebase-config.js`, sehingga indikator hijau **`Cloud Firestore Live (sixt-ev-gdss)`** langsung aktif ketika Anda menekan tombol **`Mode Lengkap`** di pojok kanan atas aplikasi.
   - **Cara A (Jika Ingin Mengganti Project Firebase di UI Web Tanpa Koding):** Buka aplikasi web GDSS Anda $\rightarrow$ aktifkan **`Mode Lengkap`** $\rightarrow$ klik kapsul status **`Cloud Firestore Live`** di bar atas $\rightarrow$ *paste* (tempel) blok `firebaseConfig` baru ke dalam kotak $\rightarrow$ klik **`Hubungkan ke Cloud Firestore`**.
   - **Cara B (Permanen di Kode):** Tempel nilai `apiKey`, `authDomain`, `projectId`, dll. ke dalam file:
     `d:\DSS\finalproject\public\dssclass\assets\js\firebase-config.js`
     lalu jalankan `node scripts/sync-public.js` (atau **cukup kirimkan isi `firebaseConfig` itu ke chat ini, nanti saya yang pasangkan otomatis ke kode Anda!**).

---

## BAGIAN 3: Push Project `d:\DSS\finalproject` ke Akun GitHub Utama Anda (`IrmandoKoyo`)

Tetap gunakan akun GitHub utama Anda (**`IrmandoKoyo`**) supaya portofolio GitHub Anda semakin lengkap:

1. Buka **[https://github.com/new](https://github.com/new)**.
2. **Repository name:** Ketik **`sixt-ev-gdss`**.
3. Pilih **Public** (atau Private), **JANGAN** centang *Add a README file* $\rightarrow$ klik **"Create repository"**.
4. Buka PowerShell di komputer Anda, lalu jalankan perintah ini satu per satu:
   ```powershell
   cd d:\DSS\finalproject
   git init
   git add .
   git commit -m "feat: complete Sixt SE EV GDSS prototype (Linear BWM 2016 + CoCoSo 2019)"
   git branch -M main
   git remote add origin https://github.com/IrmandoKoyo/sixt-ev-gdss.git
   git push -u origin main
   ```

---

## BAGIAN 4: Deploy Aplikasi ke Vercel atau Cloudflare Pages

Karena domain utama Anda **`upro.web.id`** saat ini dikelola oleh proyek **`upro-hub` di Vercel** (yang meneruskan `/davizclass`, `/frontendclass`, `/sadclass` melalui `vercel.json`), Anda bisa men-deploy repo `sixt-ev-gdss` ke **Vercel** atau **Cloudflare Pages** (keduanya 100% gratis tanpa metode pembayaran!):

### Opsi A — Deploy di Vercel (Paling Seragam dengan `/davizclass` & `/sadclass`)
1. Buka **[https://vercel.com/new](https://vercel.com/new)**.
2. Cari repositori **`sixt-ev-gdss`** yang baru Anda push $\rightarrow$ klik **"Import"**.
3. Pada bagian konfigurasi:
   - **Project Name:** `sixt-ev-gdss`
   - **Framework Preset:** `Other`
   - **Output Directory:** Ketik **`public`** (atau biarkan default karena `vercel.json` di dalam folder sudah mengatur semuanya).
4. Klik **"Deploy"**.
5. Dalam $\pm 20$ detik, Anda akan mendapatkan URL live: **`https://sixt-ev-gdss.vercel.app`** (dan **`https://sixt-ev-gdss.vercel.app/dssclass`**).

### Opsi B — Deploy di Cloudflare Pages (Gratis Tanpa Kartu Kredit)
1. Buka **[https://dash.cloudflare.com/](https://dash.cloudflare.com/)** (boleh di akun Cloudflare yang sudah ada.
2. Di menu kiri klik **"Compute (Workers)"** $\rightarrow$ **"Workers & Pages"** $\rightarrow$ klik tombol **"Create"** $\rightarrow$ pilih tab **"Pages"** $\rightarrow$ **"Connect to Git"**.
3. Pilih repositori **`sixt-ev-gdss`** $\rightarrow$ klik **"Begin setup"**.
4. Isi pengaturan:
   - **Project name:** `sixt-ev-gdss`
   - **Build command:** *(kosongkan)*
   - **Build output directory:** Ketik **`public`**
5. Klik **"Save and Deploy"**. Anda akan mendapat URL **`https://sixt-ev-gdss.pages.dev/dssclass`**.

---

## BAGIAN 5: Hubungkan ke `https://upro.web.id/dssclass` (di Repo `D:\Antigrafity\upro.web.id`)

Langkah terakhir agar alamat **`https://upro.web.id/dssclass`** langsung membuka aplikasi GDSS Anda (persis seperti `upro.web.id/davizclass` dan `upro.web.id/sadclass`):

1. Kami sudah menyiapkan file konfigurasi siap pakai di:
   - `d:\DSS\finalproject\deploy-configs\upro-hub-vercel.json`
   - `d:\DSS\finalproject\deploy-configs\upro-hub-card-snippet.tsx`
2. Salin isi `d:\DSS\finalproject\deploy-configs\upro-hub-vercel.json` ke **`D:\Antigrafity\upro.web.id\vercel.json`** (jika Anda memakai Cloudflare Pages, ganti `https://sixt-ev-gdss.vercel.app` menjadi `https://sixt-ev-gdss.pages.dev`).
3. Tambahkan juga kartu proyek dari `upro-hub-card-snippet.tsx` ke **`D:\Antigrafity\upro.web.id\src\App.tsx`** agar di halaman depan `https://upro.web.id` muncul kartu portofolio **Sixt SE EV Fleet GDSS (`upro.web.id/dssclass`)**.
4. Push perubahan `D:\Antigrafity\upro.web.id` ke GitHub:
   ```powershell
   cd D:\Antigrafity\upro.web.id
   git add vercel.json src/App.tsx
   git commit -m "feat: add /dssclass route and portfolio card for Sixt SE EV GDSS"
   git push
   ```
5. Selesai! Dalam 30 detik, **`https://upro.web.id/dssclass`** langsung aktif dan siap didemokan di depan dosen!

---

## 💡 Ringkasan: Apa yang Bisa Anda Berikan ke Saya Sekarang Jika Ingin Saya Pasangkan Otomatis?
1. **Objek `firebaseConfig`** dari Firebase Console (Langkah 2.3) $\rightarrow$ berikan ke saya agar saya tanam permanen di `firebase-config.js`.
2. **URL hasil deploy Vercel/Cloudflare** (misal `https://sixt-ev-gdss.vercel.app` atau `.pages.dev`) jika namanya berbeda dari `sixt-ev-gdss`.
