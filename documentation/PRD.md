# Product Requirements Document (PRD)

**Nama Produk:** KafeKita POS
**Versi:** 1.0
**Platform:** Web Application (React) - Optimized for Desktop & Mobile Browser
**Tujuan:** Menyediakan sistem kasir mandiri, offline-first, dan mudah digunakan untuk pemilik kafe UMKM dengan fitur manajemen stok otomatis dan dukungan hardware printer bluetooth.

## 1. Fitur Utama

### A. Point of Sales (POS)
*   **Grid Menu Visual:** Tampilan produk berbasis kartu dengan gambar, nama, dan harga.
*   **Pencarian & Filter:** Pencarian real-time berdasarkan nama dan filter kategori (Kopi, Makanan, Snack, dll).
*   **Keranjang Belanja:**
    *   Penambahan/pengurangan kuantitas item.
    *   Validasi stok saat penambahan item.
    *   Input nama pelanggan (opsional).
*   **Kalkulasi Transaksi:**
    *   Subtotal.
    *   **Diskon:** Global (Persentase % atau Nominal Rp).
    *   **Pajak:** PPN (Persentase yang dapat diatur).
    *   Total Akhir.
*   **Pembayaran:**
    *   Tunai (Cash) dengan kalkulator kembalian otomatis dan tombol uang cepat (Quick Cash).
    *   QRIS.
    *   Debit/Kredit.

### B. Manajemen Inventaris
*   **CRUD Produk:** Tambah, Edit, Hapus produk lengkap dengan gambar (upload/preview).
*   **Kategori:** Manajemen kategori menu dinamis.
*   **Sistem Stok:**
    *   Mode Stok Terbatas (berkurang saat terjual).
    *   Mode Stok Tak Terbatas (Unlimited).
    *   **Auto Reset Stok:** Fitur khusus untuk produk fresh (misal: Roti/Donat) yang stoknya kembali ke jumlah awal setiap hari secara otomatis (atau manual via trigger).
    *   Indikator Stok Menipis (Low Stock Alert).

### C. Laporan & Analitik
*   **Dashboard:** Ringkasan pendapatan, total transaksi, dan rata-rata order.
*   **Periode:** Filter Harian, Mingguan, dan Bulanan.
*   **Grafik:** Visualisasi tren penjualan.
*   **Export Data:** Unduh laporan detail ke format Excel (.xlsx).

### D. Riwayat Transaksi
*   **Daftar Transaksi:** Mencari transaksi berdasarkan ID atau Tanggal.
*   **Fitur Aksi:**
    *   **Reprint:** Cetak ulang struk.
    *   **Edit:** Mengubah metode bayar atau kuantitas item (stok menyesuaikan otomatis).
    *   **Void:** Menghapus transaksi (mengembalikan stok ke inventaris).

### E. Perangkat Keras (Hardware)
*   **Printer Support:**
    *   Browser Print (Default System Dialog).
    *   **Direct Bluetooth:** Mencetak langsung ke Thermal Printer (58mm) menggunakan Web Bluetooth API (Tanpa dialog browser).

### F. Pengaturan & Keamanan
*   **Identitas:** Ubah Logo, Nama Kafe, Alamat, dan Footer Struk.
*   **Backup/Restore:** Export database ke JSON dan Import kembali untuk keamanan data.
*   **Keamanan:** Login Admin dengan password yang dapat diubah.

## 2. Spesifikasi Non-Fungsional
*   **Offline-First:** Aplikasi dapat berjalan penuh tanpa internet (data disimpan di LocalStorage).
*   **Responsif:** UI menyesuaikan tampilan Desktop, Tablet, dan Smartphone.
*   **Performa:** Load time cepat dan interaksi UI instan (Optimistic UI updates).
