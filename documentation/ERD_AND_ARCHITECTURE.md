# Arsitektur Sistem & Struktur Data

## 1. Tech Stack
*   **Frontend Framework:** React 18 (TypeScript)
*   **State Management:** React Hooks (`useState`, `useEffect`, `useMemo`) + Prop Drilling (Sederhana & Efektif).
*   **Styling:** Tailwind CSS (Utility-first CSS).
*   **Penyimpanan Data:** Browser LocalStorage (JSON Persistence).
*   **Hardware Interface:** Web Bluetooth API (untuk komunikasi Thermal Printer).
*   **Libraries Pendukung:**
    *   `lucide-react`: Ikon UI.
    *   `recharts`: Visualisasi Grafik.
    *   `xlsx`: Export laporan ke Excel.

## 2. Entity Relationship Diagram (ERD)

Meskipun menggunakan penyimpanan NoSQL (JSON), struktur data dirancang secara relasional untuk menjaga integritas data.

```mermaid
erDiagram
    CATEGORY ||--|{ PRODUCT : "memiliki"
    ORDER ||--|{ ORDER_ITEM : "berisi"
    PRODUCT ||--o{ ORDER_ITEM : "referensi (snapshot)"

    CATEGORY {
        string id PK
        string name
    }

    PRODUCT {
        string id PK
        string name
        number price
        string categoryId FK
        string image "Base64 String"
        string description
        number stock "Stok Saat Ini"
        boolean isUnlimited
        boolean autoResetStock "Flag Reset"
        number initialStock "Nilai Reset Harian"
    }

    ORDER {
        string id PK
        number timestamp
        number totalAmount
        string paymentMethod "cash/qris/debit"
        string customerName
        number cashReceived
        number change
        number taxRate "Snapshot saat transaksi"
        number taxAmount
        boolean discountEnabled
        string discountType "percent/nominal"
        number discountRate
        number discountAmount
    }

    ORDER_ITEM {
        string productId FK
        string name "Snapshot Nama"
        number price "Snapshot Harga"
        number quantity
        number subtotal
    }

    SETTINGS {
        string name
        string address
        string phone
        string footerMessage
        string logo "Base64"
        boolean taxEnabled
        number taxRate
        boolean discountEnabled
        string discountType
        number discountRate
        string printerType "browser/bluetooth"
        number printerWidth "32/48 chars"
    }
```

## 3. Desain Sistem (Architecture)

Aplikasi menggunakan arsitektur **Client-Side Monolith** dengan pola **Service-Repository** untuk pemisahan logika penyimpanan.

```mermaid
graph TD
    User[User / Kasir] -->|Interaksi UI| UI[React Components]
    
    subgraph Frontend Application
        UI -->|State Management| AppState[App.tsx (Global State)]
        
        AppState -->|Persistensi Data| StorageService[services/storageService.ts]
        AppState -->|Cetak Struk| PrinterService[services/printerService.ts]
        
        StorageService -->|Read/Write JSON| LocalStorage[(Browser LocalStorage)]
        
        PrinterService -->|Cek Tipe| PrinterLogic{Tipe Printer?}
        PrinterLogic -->|Browser| WindowPrint[window.print API]
        PrinterLogic -->|Bluetooth| WebBLE[Web Bluetooth API]
    end
    
    WebBLE -->|ESC/POS Commands| ThermalPrinter[Hardware Printer Bluetooth]
```
