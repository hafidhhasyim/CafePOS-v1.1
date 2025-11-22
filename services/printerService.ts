
import { Order, CafeSettings } from '../types';

// Type definitions for Web Bluetooth API
interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: {
        filters?: Array<{ services: string[] }>;
        optionalServices?: string[];
        acceptAllDevices?: boolean;
      }): Promise<BluetoothDevice>;
    }
  }
}

// ESC/POS Commands
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

const COMMANDS = {
  INIT: [ESC, 0x40], // Initialize printer
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  TEXT_NORMAL: [ESC, 0x21, 0x00],
  TEXT_LARGE: [ESC, 0x21, 0x30], // Double height + Double width
  CUT: [GS, 0x56, 0x41, 0x03], // Cut paper
};

// Helper: Convert string to Uint8Array
const encoder = new TextEncoder();
const encode = (text: string) => encoder.encode(text);

// Helper: Format Currency
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount);
};

// Main Printer Service Class
class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // 1. Connect to Device
  async connect() {
    if (this.device && this.device.gatt?.connected && this.characteristic) {
      return true;
    }

    try {
      console.log('Requesting Bluetooth Device...');
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] } // Standard Thermal Printer Service
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      if (!this.device.gatt) throw new Error('Bluetooth GATT not available');

      console.log('Connecting to GATT Server...');
      const server = await this.device.gatt.connect();

      console.log('Getting Service...');
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');

      console.log('Getting Characteristic...');
      // Common characteristic for write (Print)
      this.characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      
      console.log('Printer Connected!');
      return true;
    } catch (error) {
      console.error('Connection Failed:', error);
      alert('Gagal terhubung ke printer. Pastikan Bluetooth aktif dan perangkat mendukung Web Bluetooth (Chrome di Android/Desktop).');
      return false;
    }
  }

  // 2. Send Data chunks (max 512 bytes usually safe)
  async send(data: Uint8Array) {
    if (!this.characteristic) {
      // Try auto-reconnect if device is known but disconnected
      const connected = await this.connect();
      if (!connected) return;
    }
    
    if (!this.characteristic) return;

    const CHUNK_SIZE = 100; // Small chunks for stability
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await this.characteristic.writeValue(chunk);
    }
  }

  // 3. Create Receipt Buffer
  generateReceiptData(order: Order, settings: CafeSettings): Uint8Array {
    const width = settings.printerWidth || 32;
    const buffer: number[] = [];

    // Helper to push commands
    const addCmd = (cmd: number[]) => buffer.push(...cmd);
    const addText = (text: string) => buffer.push(...encode(text));
    const addLn = () => buffer.push(LF);
    const addLine = () => {
      addText('-'.repeat(width));
      addLn();
    };

    // Helper for Column Layout (Name ...... Price)
    const addRow = (left: string, right: string) => {
      const spaceLen = width - left.length - right.length;
      if (spaceLen < 1) {
        // If text too long, print left, newline, then right aligned
        addText(left);
        addLn();
        addCmd(COMMANDS.ALIGN_RIGHT);
        addText(right);
      } else {
        addText(left + ' '.repeat(spaceLen) + right);
      }
      addLn();
      addCmd(COMMANDS.ALIGN_LEFT); // Reset alignment
    };

    // -- BUILD RECEIPT --
    addCmd(COMMANDS.INIT);

    // HEADER
    addCmd(COMMANDS.ALIGN_CENTER);
    addCmd(COMMANDS.BOLD_ON);
    addText(settings.name || 'KAFE KITA');
    addLn();
    addCmd(COMMANDS.BOLD_OFF);
    
    if (settings.address) {
      addText(settings.address.substring(0, width));
      addLn();
    }
    if (settings.phone) {
      addText(settings.phone);
      addLn();
    }
    
    addLn();
    addLine();
    addCmd(COMMANDS.ALIGN_LEFT);
    
    // ORDER INFO
    addText(`Tgl: ${new Date(order.timestamp).toLocaleDateString('id-ID')} ${new Date(order.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}`);
    addLn();
    addText(`ID: ${order.id}`);
    addLn();
    if (order.customerName) {
      addText(`Plg: ${order.customerName}`);
      addLn();
    }
    addLine();

    // ITEMS
    order.items.forEach(item => {
      addText(item.name);
      addLn();
      addRow(
        `${item.quantity} x ${formatRupiah(item.price)}`, 
        formatRupiah(item.quantity * item.price)
      );
    });

    addLine();

    // TOTALS
    // Recalculate totals logic to match Order snapshot
    const subtotal = order.items.reduce((s, i) => s + i.subtotal, 0);
    addRow('Subtotal', formatRupiah(subtotal));

    if (order.discountAmount && order.discountAmount > 0) {
      const discLabel = order.discountType === 'percent' ? `Disc (${order.discountRate}%)` : 'Discount';
      addRow(discLabel, `-${formatRupiah(order.discountAmount)}`);
    }

    if (order.taxAmount && order.taxAmount > 0) {
      addRow(`Pajak (${order.taxRate}%)`, formatRupiah(order.taxAmount));
    }

    addLn();
    addCmd(COMMANDS.BOLD_ON);
    addCmd(COMMANDS.TEXT_LARGE); // Make Total Bigger
    addCmd(COMMANDS.ALIGN_RIGHT); // Align Right for emphasis
    addText(`TOTAL: ${formatRupiah(order.totalAmount)}`); 
    addCmd(COMMANDS.TEXT_NORMAL);
    addCmd(COMMANDS.BOLD_OFF);
    addCmd(COMMANDS.ALIGN_LEFT);
    addLn();
    addLine();

    // PAYMENT
    addRow('Bayar', formatRupiah(order.cashReceived || order.totalAmount));
    addRow('Kembali', formatRupiah(order.change || 0));
    addRow('Metode', order.paymentMethod.toUpperCase());
    
    addLn();
    
    // FOOTER
    addCmd(COMMANDS.ALIGN_CENTER);
    if (settings.footerMessage) {
      addText(settings.footerMessage);
      addLn();
    }
    addText('Powered by KafeKita');
    addLn();
    addLn();
    addLn();
    
    // CUT
    addCmd(COMMANDS.CUT);

    return new Uint8Array(buffer);
  }

  // 4. Public Print Method
  async printOrder(order: Order, settings: CafeSettings) {
    const data = this.generateReceiptData(order, settings);
    await this.send(data);
  }

  // 5. Test Print
  async testPrint(settings: CafeSettings) {
    const width = settings.printerWidth || 32;
    const buffer: number[] = [];
    const addCmd = (cmd: number[]) => buffer.push(...cmd);
    const addText = (text: string) => buffer.push(...encode(text));
    const addLn = () => buffer.push(LF);

    addCmd(COMMANDS.INIT);
    addCmd(COMMANDS.ALIGN_CENTER);
    addCmd(COMMANDS.BOLD_ON);
    addText("TEST PRINT BERHASIL");
    addLn();
    addCmd(COMMANDS.BOLD_OFF);
    addText("-".repeat(width));
    addLn();
    addText("Koneksi Bluetooth OK");
    addLn();
    addLn();
    addLn();
    await this.send(new Uint8Array(buffer));
  }
}

export const PrinterService = new BluetoothPrinterService();
