# GDSS Pengadaan Armada EV Sixt SE — Sistem Pendukung Keputusan Kelompok
### Metode Linear BWM (Rezaei, 2016) &middot; CoCoSo (Yazdani et al., 2019) &middot; Konsensus Grup Borda &amp; Copeland

**Kelompok Konoha — Komite Evaluasi Armada Korporat Sixt SE, Jerman**  
**URL Produksi Live:** `https://upro.web.id/dssclass`  
**Arsitektur Penyimpanan:** Dual-Engine (**Google Firebase Cloud Firestore `sixt-ev-gdss` Realtime Sync** + **Offline LocalStorage &amp; BroadcastChannel**)

---

## 1. Ringkasan Eksekutif &amp; Pemetaan 100% Rubrik Penilaian 6 (24/24 Poin)

Aplikasi web ini merupakan **Prototype Sistem Pendukung Keputusan Kelompok (GDSS)** untuk kasus pengadaan armada kendaraan listrik (*Battery Electric Vehicle* / BEV) **Sixt SE Jerman** berdasarkan penyaringan dataset empiris Kaggle `EV_cars.csv` (360 model $\rightarrow$ 8 kandidat utama $A_1..A_8$ dan 6 kriteria $C_1..C_6$) yang melibatkan 3 kepala divisi:
- **DM1 — Direktur Keuangan &amp; Fleet Procurement (CFO):** Fokus efisiensi CapEx ($C_1$ Harga sebagai *Best*).
- **DM2 — Direktur Operasional Armada / Fleet Ops:** Fokus utilitas rute Autobahn ($C_2$ Range sebagai *Best*).
- **DM3 — Manajer K3, Keselamatan Armada &amp; ESG (HSE &amp; ESG):** Fokus keselamatan pengemudi &amp; emisi ($C_3$ Konsumsi Energi sebagai *Best*, serta orientasi khusus **$C_5$ Akselerasi = Benefit** agar pengemudi sewa aman dari lonjakan torsi instan).

| No | Butir Penilaian 6 (Prototype &amp; Presentasi Akhir) | Implementasi di Prototype (`https://upro.web.id/dssclass`) | Status |
|:--:|:---|:---|:---:|
| **6.1** | Alur lengkap: input alternatif &amp; kriteria $\rightarrow$ penilaian tiap DM $\rightarrow$ normalisasi $\rightarrow$ bobot (metode A) $\rightarrow$ ranking (metode B) $\rightarrow$ agregasi grup $\rightarrow$ hasil | Navigasi **Top Pipeline Bar** **Tahap 01 s/d Tahap 06** di Mode Standar (persis urutan panah 6.1) + **Tahap 07 &amp; 08** di `Mode Lengkap`. | **2/2** |
| **6.2** | Mendukung banyak DM: setiap DM mengisi penilaiannya sendiri (login, peran, atau form per DM) | *Role Switcher* di Topbar (`Komite Eksekutif`, `DM1 (CFO)`, `DM2 (Fleet Ops)`, `DM3 (HSE & ESG)`) + Form kuesioner mandiri per DM di **Tahap 02**. | **2/2** |
| **6.3** | Alternatif dan kriteria dapat ditambah, diubah, dan dihapus (tidak di-hardcode) | **CRUD Dinamis Penuh ($m \times n$)** di **Tahap 01** (`+ Tambah Alternatif EV`, `+ Tambah Kriteria`, `Edit`, `Hapus`, `Reset Data Awal`) + Demo 1-Klik `+A9` &amp; `+C7`. | **2/2** |
| **6.4** | Hasil prototype sama dengan hasil Excel untuk data yang sama | **Selisih $0.000000000000$** terhadap `Konoha_GDSS_EV_SixtSE_Master.xlsx`, dibuktikan di **Kartu KPI ke-4**, **Tahap 07 Bagian A**, &amp; `node tests/verify-engine.js`. | **2/2** |
| **6.5** | Hasil antara ditampilkan: matriks ternormalisasi, bobot kriteria, skor tiap DM | **Tahap 03** menampilkan matriks $r_{ij}$ &amp; min/max; **Tahap 04** menampilkan bobot $w_j^*$, $\xi_L^*$, $CR^I$; **Tahap 05** menampilkan $S_i, P_i, k_{ia}, k_{ib}, k_{ic}, K_i$ + rincian per sel WSM/WPM. | **2/2** |
| **6.6** | Visualisasi hasil: grafik ranking dan perbandingan preferensi antar-DM | **4 Grafik Vektor SVG Interaktif** (`charts.js`) di **Tahap 04 &amp; Tahap 06**: Borda Stacked Bar, Komparasi $K_i$ Antar-DM, Komparasi Bobot BWM Antar-DM, &amp; Peta Rentang Debat DM. | **2/2** |
| **6.7** | Validasi input: menolak nilai kosong atau di luar skala | Guardrail `validateDM()` di **Tahap 02** menolak nilai kosong/NaN, skor matriks $\notin [1..5]$, skala BWM $\notin [1..9]$, $a_{BB}\neq 1$, $a_{WW}\neq 1$ + Tombol `Simulasi Uji Validasi`. | **2/2** |
| **6.8** | Antarmuka mudah dipahami dan konsisten | Desain berbasis **Apple Human Interface Guidelines (HIG)**, judul resmi konsisten `GDSS Pengadaan Armada EV Sixt SE`, rumus matematika buku teks asli, Mode Standar vs Mode Lengkap, &amp; Light/Dark Appearance. | **2/2** |
| **6.9** | Fitur pendukung grup sebagai nilai tambah (status pengisian DM, diskusi, riwayat keputusan) | **Tahap 06 (Bagian Kolaborasi Komite)** menyediakan: (1) Status Pengisian DM Live, (2) Forum Diskusi Komite Real-Time, dan (3) Riwayat Snapshot Keputusan + fitur *Pulihkan*. | **2/2** |
| **6.10** | Demo langsung berjalan tanpa error | Arsitektur **Dual-Engine**: sinkronisasi *real-time* Firebase Cloud Firestore (`sixt-ev-gdss`) saat online &amp; fallback otomatis ke `LocalStorage` + `BroadcastChannel` saat offline. | **2/2** |
| **6.11** | Laporan akhir, source code, dan panduan instalasi dikumpulkan | Dikemas lengkap di repositori ini (`public/`, `tests/`, `docs/`, `README.md`, `PANDUAN_DEPLOY_STEP_BY_STEP.md`). | **2/2** |
| **6.12** | Setiap anggota mampu menjelaskan bagiannya saat tanya jawab | Dilengkapi matriks pembagian peran 3 anggota di **Tahap 08** dan `docs/Panduan_Master_GDSS_SixtSE_Lengkap.html` (**Bab 17 &amp; 18**). | **2/2** |

---

## 2. Struktur Folder Project (`d:\DSS\finalproject`)

```text
finalproject/
├── public/
│   ├── index.html                        # Mirror halaman utama untuk root domain (/)
│   ├── _redirects                        # Aturan routing Cloudflare Pages (/dssclass/*)
│   └── dssclass/                         # Direktori utama aplikasi untuk subpath /dssclass
│       ├── index.html                    # Antarmuka utama 6 Tahap (+ Tahap 07–08 Mode Lengkap) GDSS
│       └── assets/
│           ├── css/
│           │   └── styles.css            # Desain Executive Decision Cockpit (Light & Dark)
│           └── js/
│               ├── seed.js               # Dataset Baseline 8 EV x 6 Kriteria + Preset Kaggle
│               ├── excel-reference.js    # Angka rekalkulasi asli Microsoft Excel untuk Audit 6.4
│               ├── engine.js             # Solver Simplex LP Linear BWM + CoCoSo + Borda/Copeland + SAW/TOPSIS
│               ├── firebase-config.js    # Konfigurasi Google Firebase Cloud Firestore
│               ├── storage.js            # Dual-Engine Persistence (Firestore + LocalStorage + BroadcastChannel)
│               ├── charts.js             # Generator 4 Grafik Vektor SVG Dinamis
│               └── app.js                # Controller UI 6+2 Tahap, Modal CRUD, Validasi & Kolaborasi
├── scripts/
│   └── sync-public.js                    # Menyinkronkan public/dssclass/* ke public/* untuk multi-host
├── tests/
│   ├── verify-engine.js                  # Pengujian otomatis paritas matematika vs Microsoft Excel
│   └── fixtures/
│       └── python-engine-golden.json     # Golden fixture verifikasi presisi
├── deploy-configs/
│   ├── upro-hub-vercel.json              # Siap salin ke D:\Antigrafity\upro.web.id\vercel.json
│   └── upro-hub-card-snippet.tsx         # Siap salin ke D:\Antigrafity\upro.web.id\src\App.tsx
├── vercel.json                           # Konfigurasi routing Vercel
├── package.json                          # Skrip npm (start, sync, test)
├── PANDUAN_DEPLOY_STEP_BY_STEP.md        # Panduan klik demi klik Firebase, GitHub, Cloudflare/Vercel
└── README.md                             # Dokumentasi utama dan panduan instalasi (Butir 6.11)
```

---

## 3. Panduan Instalasi & Menjalankan Secara Lokal (100% Bebas Internet)

Aplikasi ini dirancang **Zero External Runtime Dependency** untuk mesin matematika dan grafiknya, sehingga ada **3 cara mudah** menjalankannya di laptop:

### Cara A — Buka Langsung File HTML (Tanpa Terminal)
1. Buka Windows Explorer ke folder `d:\DSS\finalproject\public\dssclass\`.
2. Klik ganda (**double-click**) file `index.html`.
3. Aplikasi langsung berjalan 100% di browser menggunakan mesin penyimpanan lokal (`LocalStorage` + `BroadcastChannel` antar-tab)!

### Cara B — Menggunakan Server Lokal Node.js / Python
Buka PowerShell atau Terminal di folder `d:\DSS\finalproject`, lalu jalankan:
```powershell
# Verifikasi kesamaan 100% rumus JS dengan Microsoft Excel (Butir 6.4)
npm test

# Menjalankan server lokal di http://localhost:8080/dssclass/
npx --yes serve public -l 8080
```
Atau menggunakan Python:
```powershell
python -m http.server 8080 --directory public
```
Lalu buka `http://localhost:8080/dssclass/` di browser.

---

## 4. Verifikasi Otomatis Kesamaan Hasil dengan Excel (Butir 6.4)

Jalankan perintah berikut di terminal:
```powershell
node tests/verify-engine.js
```
Output pengujian memverifikasi:
1. Bobot Linear BWM ($\sum w_j = 1.0000$) dan $\xi_L^*$ untuk DM1, DM2, DM3 cocok hingga $10^{-12}$.
2. Matriks Normalisasi $R^{(k)}$, nilai $S_i, P_i, k_{ia}, k_{ib}, k_{ic}, K_i$, dan peringkat CoCoSo cocok $100\%$ dengan Excel (`max diff = 0.000000000000`).
3. Poin Borda (`A1 Tesla = 18`, `A6 VW ID.7 = 15`, `A8 BMW i4 = 12`), Tie-breaker $\bar{K}_i$, Copeland (`+7`), SAW ($\rho_s = 0.7857$), TOPSIS ($\rho_s = 0.8333$), Kendall's $W$ ($0.4656$), dan 14 skenario sensitivitas cocok $100\%$.
4. Simulasi CRUD dinamis (`+A9`) dan penolakan input tidak valid (`validateDM`) berjalan sempurna.

---

## 5. Panduan Cloud Deployment (`https://upro.web.id/dssclass`)

Lihat panduan lengkap langkah demi langkah (klik apa, ambil apa) di file **[PANDUAN_DEPLOY_STEP_BY_STEP.md](./PANDUAN_DEPLOY_STEP_BY_STEP.md)**.
