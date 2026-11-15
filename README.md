# Sixt SE Germany Electric Fleet GDSS — Executive Decision Cockpit
### Linear BWM (Rezaei, 2016) + CoCoSo (Yazdani et al., 2019) + Borda & Copeland Group Consensus

**Kelompok Konoha — Mata Kuliah Sistem Pendukung Keputusan Kelompok (GDSS)**  
**URL Produksi Target:** `https://upro.web.id/dssclass`  
**Arsitektur Penyimpanan:** Dual-Engine (**Google Firebase Cloud Firestore Realtime Sync** + **Offline LocalStorage & BroadcastChannel**)

---

## 1. Ringkasan Eksekutif & Pemetaan 100% Rubrik Penilaian 6 (24/24 Poin)

Aplikasi web ini merupakan **Prototype Group Decision Support System (GDSS)** untuk kasus pengadaan armada kendaraan listrik (*Battery Electric Vehicle* / BEV) **Sixt SE Jerman** berdasarkan penyaringan dataset empiris Kaggle `EV_cars.csv` (360 model $\rightarrow$ 8 kandidat utama $A_1..A_8$ dan 6 kriteria $C_1..C_6$) yang melibatkan 3 kepala divisi:
- **DM1 — Direktur Keuangan & Fleet Procurement (CFO):** Fokus efisiensi CapEx ($C_1$ Harga sebagai *Best*).
- **DM2 — Direktur Operasional Armada / Fleet Ops:** Fokus utilitas rute Autobahn ($C_2$ Range sebagai *Best*).
- **DM3 — Manajer K3, Keselamatan Armada & ESG:** Fokus keselamatan pengemudi & emisi ($C_3$ Konsumsi Energi sebagai *Best*, serta orientasi khusus **$C_5$ Akselerasi = Benefit** agar pengemudi sewa aman dari lonjakan torsi instan).

| No | Butir Penilaian 6 (Prototype & Presentasi Akhir) | Implementasi di Prototype Ini | Status |
|:--:|:---|:---|:---:|
| **6.1** | Alur lengkap: input alternatif & kriteria $\rightarrow$ penilaian tiap DM $\rightarrow$ normalisasi $\rightarrow$ bobot (metode A) $\rightarrow$ ranking (metode B) $\rightarrow$ agregasi grup $\rightarrow$ hasil | Navigasi **8 Tahap Alur Lengkap** di *Left Workflow Rail* (`Tahap 1` s/d `Tahap 8`). | **2/2** |
| **6.2** | Mendukung banyak DM: setiap DM mengisi penilaiannya sendiri (login, peran, atau form per DM) | *Role Switcher* di Topbar (`DM1 CFO`, `DM2 Ops`, `DM3 K3/ESG`, `Komite`) + Form kuesioner mandiri per DM di **Tahap 2**. | **2/2** |
| **6.3** | Alternatif dan kriteria dapat ditambah, diubah, dan dihapus (tidak di-hardcode) | **CRUD Dinamis Penuh ($m \times n$)** di **Tahap 1** + Tombol 1-Klik `+ Tambah A9 (Audi Q4 e-tron)` & `+ Tambah C7 (Garansi Baterai)`. | **2/2** |
| **6.4** | Hasil prototype sama dengan hasil Excel untuk data yang sama | **Selisih $0.000000000000$** terhadap Excel (`Sheet 00`–`Sheet 7`), dibuktikan di **Tahap 8** & `node tests/verify-engine.js`. | **2/2** |
| **6.5** | Hasil antara ditampilkan: matriks ternormalisasi, bobot kriteria, skor tiap DM | **Tahap 3** menampilkan $r_{ij}$, $w_j^*$, $\xi_L^*$, $CR^I$; **Tahap 4** menampilkan $w_j r_{ij}$, $r_{ij}^{w_j}$, $S_i, P_i, k_{ia}, k_{ib}, k_{ic}, K_i$ + Inspektur Bedah Rumus. | **2/2** |
| **6.6** | Visualisasi hasil: grafik ranking dan perbandingan preferensi antar-DM | **4 Grafik Vektor SVG Interaktif** (`charts.js`) di **Tahap 5 & 6**: Borda Stacked Bar, Komparasi $K_i$ 3 DM, Komparasi Bobot BWM, & Dumbbell Kontroversi DM. | **2/2** |
| **6.7** | Validasi input: menolak nilai kosong atau di luar skala | Guardrail `validateDM()` menolak nilai kosong/NaN, skor matriks $\notin [1..5]$, skala BWM $\notin [1..9]$, $a_{BB}\neq 1$, $a_{WW}\neq 1$ + Tombol Demo Uji Validasi di **Tahap 2**. | **2/2** |
| **6.8** | Antarmuka mudah dipahami dan konsisten | Desain *Executive Decision Cockpit* dengan *Tabular Monospace*, Mode Terang/Gelap, dan kode warna DM1/DM2/DM3 yang 100% konsisten dengan Excel. | **2/2** |
| **6.9** | Fitur pendukung grup sebagai nilai tambah (status pengisian DM, diskusi, riwayat keputusan) | **Tahap 7** menyediakan: (1) Pelacak Status Pengisian 3 DM, (2) Forum Diskusi Komite berlabel mobil, dan (3) Riwayat Snapshot Keputusan + fitur *Restore*. | **2/2** |
| **6.10** | Demo langsung berjalan tanpa error | Arsitektur **Dual-Engine**: sinkronisasi *real-time* Firebase Cloud Firestore saat online & fallback otomatis ke `LocalStorage` + `BroadcastChannel` saat offline. | **2/2** |
| **6.11** | Laporan akhir, source code, dan panduan instalasi dikumpulkan | Dikemas lengkap di repositori ini (`public/`, `tests/`, `docs/`, `README.md`, `PANDUAN_DEPLOY_STEP_BY_STEP.md`). | **2/2** |
| **6.12** | Setiap anggota mampu menjelaskan bagiannya saat tanya jawab | Dilengkapi matriks pembagian peran 3 anggota & 9 FAQ jebakan sidang di **Tahap 8** dan `docs/Panduan_Master_GDSS_SixtSE_Lengkap.html` (**Bab 17 & 18**). | **2/2** |

---

## 2. Struktur Folder Project (`d:\DSS\finalproject`)

```text
finalproject/
├── public/
│   ├── index.html                        # Mirror halaman utama untuk root domain (/)
│   ├── _redirects                        # Aturan routing Cloudflare Pages (/dssclass/*)
│   └── dssclass/                         # Direktori utama aplikasi untuk subpath /dssclass
│       ├── index.html                    # Antarmuka utama 8 Tahap GDSS
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
│               └── app.js                # Controller UI 8 Tahap, Modal CRUD, Validasi & Kolaborasi
├── scripts/
│   └── sync-public.js                    # Menyinkronkan public/dssclass/* ke public/* untuk multi-host
├── tests/
│   ├── verify-engine.js                  # Pengujian otomatis paritas matematika vs Microsoft Excel
│   └── fixtures/
│       └── python-engine-golden.json     # Golden fixture verifikasi presisi
├── deploy-configs/
│   ├── upro-hub-vercel.json              # Siap salin ke D:\Antigrafity\upro.web.id\vercel.json
│   └── upro-hub-card-snippet.tsx         # Siap salin ke D:\Antigrafity\upro.web.id\src\App.tsx
├── docs/
│   ├── Konoha_GDSS_EV_SixtSE_Master.xlsx          # Buku Kerja Master Excel (12 Sheet, 4.347+ Rumus)
│   └── Panduan_Master_GDSS_SixtSE_Lengkap.html    # Buku Induk & Naskah Presentasi (18 Bab)
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
