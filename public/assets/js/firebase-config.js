/*!
 * Konfigurasi Google Firebase (Cloud Firestore Realtime Sync)
 * -----------------------------------------------------------
 * Cara 1 (Paling Mudah - Tanpa Edit Kode):
 *   Buka aplikasi web -> klik tombol "Cloud Sync" di kanan atas -> tempel (paste)
 *   firebaseConfig dari Firebase Console Anda -> klik "Hubungkan Sekarang".
 *
 * Cara 2 (Permanen di Kode Sebelum Push ke GitHub):
 *   Isi nilai apiKey, projectId, dll. dari Project Firebase baru Anda di bawah ini.
 *   Jika dibiarkan kosong (""), aplikasi otomatis berjalan 100% lancar dalam mode
 *   Dual-Engine (LocalStorage + Multi-Tab BroadcastChannel Sync) tanpa error.
 */
(function (root) {
  'use strict';

  root.GDSS_FIREBASE_CONFIG = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    collectionName: "gdss_sixt_sessions",
    documentId: "master_room_konoha"
  };
})(typeof window !== "undefined" ? window : globalThis);
