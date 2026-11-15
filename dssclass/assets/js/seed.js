/* Data baseline = data yang sama persis dengan Konoha_GDSS_EV_SixtSE_Master.xlsx (Sheet 2 & Sheet 3).
   File ini dibangkitkan otomatis; ubah data lewat aplikasi, bukan di sini. */
(function (root) {
  var SEED = {
    "schema": "sixt-ev-gdss/v1",
    "meta": {
      "title": "Pemilihan Armada Mobil Listrik Sixt SE",
      "problem": "Komite 3 kepala divisi Sixt SE memilih model mobil listrik (EV) untuk armada sewa korporat di Jerman.",
      "organisation": "Sixt SE — Pullach, Jerman",
      "team": "Kelompok Konoha",
      "lambda": 0.5,
      "scaleMin": 1,
      "scaleMax": 5,
      "bwmMax": 9,
      "facilitatorPinHash": "0fb72c23",
      "createdAt": "2026-11-15T08:00:00.000Z",
      "updatedAt": "2026-11-15T08:00:00.000Z",
      "baseline": "excel-master-v1"
    },
    "criteria": [
      {
        "id": "c1",
        "code": "C1",
        "name": "Harga Pengadaan Unit",
        "short": "Harga",
        "unit": "€",
        "defaultType": "Cost",
        "description": "Harga beli ritel on-the-road pasar Jerman per unit kendaraan listrik komersial sebelum insentif korporat.",
        "source": "Ecer (2021, RSER); Ziemba (2021, Energies); Masukan utama DM1 (CFO)."
      },
      {
        "id": "c2",
        "code": "C2",
        "name": "Jarak Tempuh Sekali Cas",
        "short": "Range",
        "unit": "km",
        "defaultType": "Benefit",
        "description": "Jarak jelajah operasional nyata (real-world range) dari kondisi baterai 100% penuh hingga habis.",
        "source": "Ecer (2021, RSER); Ziemba (2021, Energies); Masukan utama DM2 (Fleet Ops)."
      },
      {
        "id": "c3",
        "code": "C3",
        "name": "Konsumsi Energi Listrik",
        "short": "Konsumsi",
        "unit": "Wh/km",
        "defaultType": "Cost",
        "description": "Rata-rata energi listrik (Watt-hour) yang dihabiskan kendaraan untuk menempuh jarak 1 kilometer.",
        "source": "Ecer (2021, RSER); Ziemba (2021, Energies); Masukan utama DM3 (K3 & ESG) serta DM1 (CFO)."
      },
      {
        "id": "c4",
        "code": "C4",
        "name": "Kecepatan Pengisian Cepat DC",
        "short": "Fast Charge",
        "unit": "km/jam",
        "defaultType": "Benefit",
        "description": "Tambahan jarak tempuh (km) yang diperoleh per jam pengisian cepat arus searah (DC Fast Charging).",
        "source": "Ziemba (2021, Energies); Masukan operasional DM2 (Sixt Charge)."
      },
      {
        "id": "c5",
        "code": "C5",
        "name": "Durasi Akselerasi 0–100 km/jam",
        "short": "Akselerasi",
        "unit": "detik",
        "defaultType": "Cost",
        "description": "Waktu dalam detik yang dibutuhkan mobil dari posisi diam (0 km/jam) untuk mencapai kecepatan 100 km/jam.",
        "source": "Ecer (2021); Ziemba (2021); Konflik orientasi nyata antar-departemen dalam GDSS."
      },
      {
        "id": "c6",
        "code": "C6",
        "name": "Kesiapan Purnajual & Bengkel Armada",
        "short": "Purnajual",
        "unit": "Likert 1–5",
        "defaultType": "Benefit",
        "description": "Penilaian kualitatif atas ketersediaan jaringan bengkel resmi di Jerman, garansi korporat, harga suku cadang, dan rekam jejak K3/daur ulang baterai.",
        "source": "Wątróbski et al. (2017, Sustainability); Ecer & Pamucar (2020)."
      }
    ],
    "alternatives": [
      {
        "id": "a1",
        "code": "A1",
        "name": "Tesla Model 3",
        "segment": "Sedan Eksekutif Efisien",
        "raw": {
          "c1": 46220.0,
          "c2": 420.0,
          "c3": 137.0,
          "c4": 700.0,
          "c5": 6.1,
          "c6": null
        },
        "source": "https://ev-database.org/car/1991/Tesla-Model-3"
      },
      {
        "id": "a2",
        "code": "A2",
        "name": "BYD DOLPHIN 60.4 kWh",
        "segment": "Compact Hatchback Ekonomis",
        "raw": {
          "c1": 35990.0,
          "c2": 340.0,
          "c3": 178.0,
          "c4": 340.0,
          "c5": 7.0,
          "c6": null
        },
        "source": "https://ev-database.org/car/1919/BYD-DOLPHIN-604-kWh"
      },
      {
        "id": "a3",
        "code": "A3",
        "name": "MG MG4 Electric 64 kWh",
        "segment": "Compact Hatchback Menengah",
        "raw": {
          "c1": 39990.0,
          "c2": 360.0,
          "c3": 171.0,
          "c4": 630.0,
          "c5": 7.9,
          "c6": null
        },
        "source": "https://ev-database.org/car/1708/MG-MG4-Electric-64-kWh"
      },
      {
        "id": "a4",
        "code": "A4",
        "name": "Hyundai IONIQ 6 Long Range AWD",
        "segment": "Streamliner Sedan Ultra-Fast",
        "raw": {
          "c1": 61100.0,
          "c2": 440.0,
          "c3": 168.0,
          "c4": 1150.0,
          "c5": 5.1,
          "c6": null
        },
        "source": "https://ev-database.org/car/1719/Hyundai-IONIQ-6-Long-Range-AWD"
      },
      {
        "id": "a5",
        "code": "A5",
        "name": "Kia EV6 Long Range 2WD",
        "segment": "Crossover SUV Operasional",
        "raw": {
          "c1": 51990.0,
          "c2": 410.0,
          "c3": 180.0,
          "c4": 1070.0,
          "c5": 7.3,
          "c6": null
        },
        "source": "https://ev-database.org/car/1481/Kia-EV6-Long-Range-2WD"
      },
      {
        "id": "a6",
        "code": "A6",
        "name": "Volkswagen ID.7 Pro",
        "segment": "Fastback Tourer Korporat DE",
        "raw": {
          "c1": 56995.0,
          "c2": 475.0,
          "c3": 162.0,
          "c4": 710.0,
          "c5": 6.5,
          "c6": null
        },
        "source": "https://ev-database.org/car/1839/Volkswagen-ID7-Pro"
      },
      {
        "id": "a7",
        "code": "A7",
        "name": "Volvo EX30 Single Motor ER",
        "segment": "Compact SUV Standar K3 Eropa",
        "raw": {
          "c1": 41790.0,
          "c2": 370.0,
          "c3": 173.0,
          "c4": 550.0,
          "c5": 5.3,
          "c6": null
        },
        "source": "https://ev-database.org/car/1910/Volvo-EX30-Single-Motor-ER"
      },
      {
        "id": "a8",
        "code": "A8",
        "name": "BMW i4 eDrive40",
        "segment": "Gran Coupe Jarak Jauh Munich",
        "raw": {
          "c1": 59200.0,
          "c2": 515.0,
          "c3": 157.0,
          "c4": 800.0,
          "c5": 5.7,
          "c6": null
        },
        "source": "https://ev-database.org/car/1252/BMW-i4-eDrive40"
      }
    ],
    "dms": {
      "dm1": {
        "id": "dm1",
        "code": "DM1",
        "short": "CFO",
        "name": "Direktur Keuangan & Fleet Procurement",
        "color": "#1D4ED8",
        "order": 1,
        "pinHash": "d4aa0d23",
        "focus": "Efisiensi modal pembelian unit (C1), penghematan biaya listrik bulanan (C3), & garansi hemat TCO (C6).",
        "types": {
          "c1": "Cost",
          "c2": "Benefit",
          "c3": "Cost",
          "c4": "Benefit",
          "c5": "Cost",
          "c6": "Benefit"
        },
        "bwm": {
          "best": "c1",
          "worst": "c5",
          "aB": {
            "c1": 1,
            "c2": 3,
            "c3": 2,
            "c4": 5,
            "c5": 8,
            "c6": 3
          },
          "aW": {
            "c1": 8,
            "c2": 4,
            "c3": 5,
            "c4": 2,
            "c5": 1,
            "c6": 4
          }
        },
        "scores": {
          "a1": {
            "c1": 4,
            "c2": 3,
            "c3": 1,
            "c4": 3,
            "c5": 3,
            "c6": 3
          },
          "a2": {
            "c1": 1,
            "c2": 1,
            "c3": 4,
            "c4": 1,
            "c5": 4,
            "c6": 4
          },
          "a3": {
            "c1": 2,
            "c2": 2,
            "c3": 3,
            "c4": 3,
            "c5": 5,
            "c6": 3
          },
          "a4": {
            "c1": 5,
            "c2": 4,
            "c3": 3,
            "c4": 5,
            "c5": 1,
            "c6": 4
          },
          "a5": {
            "c1": 4,
            "c2": 3,
            "c3": 5,
            "c4": 5,
            "c5": 4,
            "c6": 5
          },
          "a6": {
            "c1": 5,
            "c2": 4,
            "c3": 2,
            "c4": 3,
            "c5": 3,
            "c6": 3
          },
          "a7": {
            "c1": 2,
            "c2": 2,
            "c3": 4,
            "c4": 2,
            "c5": 2,
            "c6": 3
          },
          "a8": {
            "c1": 5,
            "c2": 5,
            "c3": 2,
            "c4": 4,
            "c5": 2,
            "c6": 2
          }
        },
        "rules": {
          "c1": {
            "mode": "le",
            "bounds": [
              37000,
              42500,
              46000,
              54000
            ],
            "labels": [
              "Sangat Murah",
              "Murah",
              "Sedang",
              "Mahal",
              "Sangat Mahal"
            ]
          },
          "c2": {
            "mode": "lt",
            "bounds": [
              350,
              390,
              430,
              480
            ],
            "labels": [
              "Pendek",
              "Cukup",
              "Menengah",
              "Jauh",
              "Sangat Jauh"
            ]
          },
          "c3": {
            "mode": "le",
            "bounds": [
              150,
              163,
              172,
              179
            ],
            "labels": [
              "Sangat Irit",
              "Irit",
              "Sedang",
              "Agak Boros",
              "Sangat Boros"
            ]
          },
          "c4": {
            "mode": "lt",
            "bounds": [
              450,
              600,
              750,
              1000
            ],
            "labels": [
              "Lambat",
              "Cukup",
              "Cepat",
              "Sangat Cepat",
              "Ultra Cepat"
            ]
          },
          "c5": {
            "mode": "le",
            "bounds": [
              5.2,
              6.0,
              6.8,
              7.5
            ],
            "labels": [
              "Sangat Gesit",
              "Gesit",
              "Normal",
              "Agak Lambat",
              "Lambat"
            ]
          }
        },
        "status": "submitted",
        "submittedAt": "2026-11-15T08:00:00.000Z",
        "updatedAt": "2026-11-15T08:00:00.000Z"
      },
      "dm2": {
        "id": "dm2",
        "code": "DM2",
        "short": "Fleet Ops",
        "name": "Manajer Operasional Armada & Sixt Charge",
        "color": "#0D9488",
        "order": 2,
        "pinHash": "fbec86cf",
        "focus": "Daya jelajah jalan bebas hambatan Autobahn (C2), cas kilat minim waktu tunggu (C4), & jaringan bengkel Jerman (C6).",
        "types": {
          "c1": "Cost",
          "c2": "Benefit",
          "c3": "Cost",
          "c4": "Benefit",
          "c5": "Cost",
          "c6": "Benefit"
        },
        "bwm": {
          "best": "c2",
          "worst": "c1",
          "aB": {
            "c1": 7,
            "c2": 1,
            "c3": 4,
            "c4": 2,
            "c5": 5,
            "c6": 3
          },
          "aW": {
            "c1": 1,
            "c2": 7,
            "c3": 3,
            "c4": 6,
            "c5": 2,
            "c6": 4
          }
        },
        "scores": {
          "a1": {
            "c1": 2,
            "c2": 3,
            "c3": 1,
            "c4": 3,
            "c5": 3,
            "c6": 4
          },
          "a2": {
            "c1": 1,
            "c2": 1,
            "c3": 4,
            "c4": 1,
            "c5": 4,
            "c6": 2
          },
          "a3": {
            "c1": 1,
            "c2": 1,
            "c3": 3,
            "c4": 2,
            "c5": 5,
            "c6": 2
          },
          "a4": {
            "c1": 5,
            "c2": 3,
            "c3": 3,
            "c4": 5,
            "c5": 1,
            "c6": 5
          },
          "a5": {
            "c1": 3,
            "c2": 2,
            "c3": 4,
            "c4": 4,
            "c5": 4,
            "c6": 4
          },
          "a6": {
            "c1": 4,
            "c2": 4,
            "c3": 2,
            "c4": 3,
            "c5": 3,
            "c6": 5
          },
          "a7": {
            "c1": 1,
            "c2": 2,
            "c3": 3,
            "c4": 2,
            "c5": 2,
            "c6": 3
          },
          "a8": {
            "c1": 5,
            "c2": 5,
            "c3": 2,
            "c4": 3,
            "c5": 2,
            "c6": 5
          }
        },
        "rules": {
          "c1": {
            "mode": "le",
            "bounds": [
              45000,
              50000,
              55000,
              58500
            ],
            "labels": [
              "Murah",
              "Terjangkau",
              "Wajar",
              "Tinggi",
              "Mahal"
            ]
          },
          "c2": {
            "mode": "lt",
            "bounds": [
              370,
              415,
              450,
              500
            ],
            "labels": [
              "Kurang",
              "Standar Kota",
              "Cukup Antarkota",
              "Jauh",
              "Raja Autobahn"
            ]
          },
          "c3": {
            "mode": "le",
            "bounds": [
              155,
              165,
              174,
              181
            ],
            "labels": [
              "Irit",
              "Cukup Irit",
              "Normal Tol",
              "Agak Boros",
              "Boros"
            ]
          },
          "c4": {
            "mode": "lt",
            "bounds": [
              500,
              680,
              850,
              1100
            ],
            "labels": [
              "Lambat",
              "Menengah",
              "Cepat",
              "Sangat Cepat",
              "Kilat 800V"
            ]
          },
          "c5": {
            "mode": "le",
            "bounds": [
              5.2,
              5.8,
              6.8,
              7.5
            ],
            "labels": [
              "Sangat Gesit",
              "Gesit Tol",
              "Cukup",
              "Agak Lamban",
              "Lamban"
            ]
          }
        },
        "status": "submitted",
        "submittedAt": "2026-11-15T08:00:00.000Z",
        "updatedAt": "2026-11-15T08:00:00.000Z"
      },
      "dm3": {
        "id": "dm3",
        "code": "DM3",
        "short": "HSE & ESG",
        "name": "Manajer K3 Keselamatan & Keberlanjutan ESG",
        "color": "#7C3AED",
        "order": 3,
        "pinHash": "8364fbe3",
        "focus": "Efisiensi energi rendah karbon (C3), keselamatan tarikan kalem (C5 sebagai BENEFIT!), & rekam jejak K3 Eropa (C6).",
        "types": {
          "c1": "Cost",
          "c2": "Benefit",
          "c3": "Cost",
          "c4": "Benefit",
          "c5": "Benefit",
          "c6": "Benefit"
        },
        "bwm": {
          "best": "c3",
          "worst": "c4",
          "aB": {
            "c1": 4,
            "c2": 3,
            "c3": 1,
            "c4": 7,
            "c5": 2,
            "c6": 2
          },
          "aW": {
            "c1": 3,
            "c2": 4,
            "c3": 7,
            "c4": 1,
            "c5": 5,
            "c6": 5
          }
        },
        "scores": {
          "a1": {
            "c1": 2,
            "c2": 3,
            "c3": 1,
            "c4": 3,
            "c5": 3,
            "c6": 4
          },
          "a2": {
            "c1": 1,
            "c2": 1,
            "c3": 5,
            "c4": 1,
            "c5": 4,
            "c6": 2
          },
          "a3": {
            "c1": 1,
            "c2": 2,
            "c3": 4,
            "c4": 3,
            "c5": 5,
            "c6": 3
          },
          "a4": {
            "c1": 5,
            "c2": 3,
            "c3": 3,
            "c4": 5,
            "c5": 1,
            "c6": 4
          },
          "a5": {
            "c1": 3,
            "c2": 3,
            "c3": 5,
            "c4": 5,
            "c5": 4,
            "c6": 3
          },
          "a6": {
            "c1": 4,
            "c2": 4,
            "c3": 3,
            "c4": 3,
            "c5": 3,
            "c6": 4
          },
          "a7": {
            "c1": 2,
            "c2": 2,
            "c3": 4,
            "c4": 2,
            "c5": 1,
            "c6": 5
          },
          "a8": {
            "c1": 5,
            "c2": 5,
            "c3": 2,
            "c4": 4,
            "c5": 2,
            "c6": 5
          }
        },
        "rules": {
          "c1": {
            "mode": "le",
            "bounds": [
              40000,
              47000,
              54000,
              59000
            ],
            "labels": [
              "Ekonomis",
              "Terjangkau",
              "Menengah",
              "Tinggi",
              "Mahal"
            ]
          },
          "c2": {
            "mode": "lt",
            "bounds": [
              355,
              400,
              445,
              490
            ],
            "labels": [
              "Pendek",
              "Menengah",
              "Cukup Jauh",
              "Jauh",
              "Sangat Jauh"
            ]
          },
          "c3": {
            "mode": "le",
            "bounds": [
              145,
              160,
              170,
              176
            ],
            "labels": [
              "Ultra Hijau",
              "Rendah Emisi",
              "Standar ESG",
              "Tinggi",
              "Boros Emisi"
            ]
          },
          "c4": {
            "mode": "lt",
            "bounds": [
              400,
              580,
              750,
              1050
            ],
            "labels": [
              "Lambat",
              "Cukup",
              "Baik",
              "Cepat",
              "Sangat Cepat"
            ]
          },
          "c5": {
            "mode": "le",
            "bounds": [
              5.3,
              5.9,
              6.7,
              7.5
            ],
            "labels": [
              "Terlalu Liar/Berisiko",
              "Agak Agresif",
              "Seimbang",
              "Kalem & Aman",
              "Sangat Kalem/Aman"
            ]
          }
        },
        "status": "submitted",
        "submittedAt": "2026-11-15T08:00:00.000Z",
        "updatedAt": "2026-11-15T08:00:00.000Z"
      }
    },
    "discussion": [
      {
        "id": "m_seed1",
        "by": "dm3",
        "ts": "2026-11-15T08:05:00.000Z",
        "altId": "a8",
        "text": "Untuk C5 Akselerasi saya pakai orientasi BENEFIT: tarikan yang terlalu cepat (≤5,3 detik) berisiko bagi sopir staf biasa."
      },
      {
        "id": "m_seed2",
        "by": "dm2",
        "ts": "2026-11-15T08:07:00.000Z",
        "altId": "a8",
        "text": "BMW i4 tetap pilihan saya untuk rute Autobahn: range 515 km dan jaringan bengkel BMW ada di semua kota besar."
      },
      {
        "id": "m_seed3",
        "by": "dm1",
        "ts": "2026-11-15T08:09:00.000Z",
        "altId": "a1",
        "text": "Tesla Model 3 paling seimbang: konsumsi 137 Wh/km menekan biaya listrik bulanan armada."
      }
    ],
    "history": []
  };
  root.GDSS_SEED = SEED;
  if (typeof module !== "undefined" && module.exports) { module.exports = SEED; }
})(typeof window !== "undefined" ? window : globalThis);
