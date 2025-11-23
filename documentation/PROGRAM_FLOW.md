# Alur Program (Program Flow)

Berikut adalah visualisasi alur kerja utama dalam aplikasi KafeKita POS.

## 1. Alur Transaksi (Checkout)

Proses dari pemilihan barang hingga pencetakan struk.

```mermaid
sequenceDiagram
    participant Kasir
    participant POS_Page
    participant App_Logic
    participant Storage
    participant Printer

    Kasir->>POS_Page: Pilih Produk & Qty
    POS_Page->>App_Logic: Validasi Stok (Cukup?)
    alt Stok Kurang
        App_Logic-->>POS_Page: Tampilkan Alert Error
    else Stok Cukup
        App_Logic-->>POS_Page: Update Keranjang
    end
    
    Kasir->>POS_Page: Klik Bayar
    POS_Page->>POS_Page: Hitung Total (Subtotal - Diskon + Pajak)
    POS_Page->>Kasir: Buka Modal Pembayaran
    
    Kasir->>POS_Page: Input Uang / Pilih Metode
    Kasir->>POS_Page: Konfirmasi Bayar
    
    POS_Page->>App_Logic: Finalisasi Order
    App_Logic->>Storage: Kurangi Stok (Update Produk)
    App_Logic->>Storage: Simpan Order Baru
    
    App_Logic-->>POS_Page: Transaksi Sukses
    
    opt Cetak Struk
        Kasir->>POS_Page: Klik Tombol Cetak
        POS_Page->>Printer: Kirim Data (Bluetooth/Window)
        Printer-->>Kasir: Struk Fisik
    end
```

## 2. Alur Reset Stok Harian

Fitur ini digunakan untuk mengembalikan stok produk harian (seperti kue basah/roti) ke jumlah awal sebelum toko buka.

```mermaid
flowchart TD
    Start([Mulai Shift Pagi]) --> Login{Login Admin}
    Login -- Gagal --> Login
    Login -- Sukses --> Dashboard
    
    Dashboard --> Settings[Menu Pengaturan]
    Settings --> ResetSection[Bagian Operasional Stok]
    
    ResetSection --> ClickReset[Klik "Reset Stok"]
    
    ClickReset --> CheckProducts{Ada Produk Terkonfigurasi?}
    
    CheckProducts -- Tidak Ada (0) --> AlertError[Alert: Belum ada produk diset]
    AlertError --> End([Selesai])
    
    CheckProducts -- Ada (>0) --> Confirm[Modal Konfirmasi]
    
    Confirm -- Batal --> End
    Confirm -- Ya, Reset --> ProcessLoop[Looping Produk]
    
    subgraph Logika Sistem
        ProcessLoop --> IsAuto{Auto Reset Aktif?}
        IsAuto -- Ya --> SetStock[Set Stok = Initial Stock]
        IsAuto -- Tidak --> Skip[Lewati]
        SetStock --> SaveStorage[Simpan ke LocalStorage]
    end
    
    SaveStorage --> Notify[Notifikasi Sukses]
    Notify --> UpdateUI[Update Tampilan Stok]
    UpdateUI --> End
```

## 3. Alur Edit Transaksi (Sinkronisasi Stok)

Bagaimana sistem menangani perubahan stok jika transaksi diedit di masa lalu.

```mermaid
flowchart LR
    EditOrder[Edit Transaksi] --> ChangeQty{Perubahan Qty Item}
    
    ChangeQty -- Tambah Qty --> CheckStock{Stok Tersedia?}
    CheckStock -- Ya --> KurangiStok[Stok Inventaris Berkurang]
    CheckStock -- Tidak --> Error[Tolak Edit]
    
    ChangeQty -- Kurangi Qty --> TambahStok[Stok Inventaris Bertambah]
    
    KurangiStok --> Recalc[Hitung Ulang Total, Pajak, Kembalian]
    TambahStok --> Recalc
    
    Recalc --> Save[Simpan Order Revisi]
```
