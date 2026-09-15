'use client';

import { useState, useRef, useEffect } from 'react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  businessName: string;
  businessEmail: string;
  businessAddress: string;
  businessPhone: string;
  businessGSTIN: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxType: 'GST' | 'VAT' | 'Sales Tax' | 'None';
  taxRate: number;
  taxAmount: number;
  shipping: number;
  total: number;
  notes: string;
  terms: string;
  currency: string;
  currencySymbol: string;
  paymentMethods: string[];
  logo: string;
  showQRCode: boolean;
  showBarcode: boolean;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
}

function generateQRCode(data: string): string {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encoded}`;
}

function generateBarcode(data: string): string {
  return `https://barcodeapi.org/api/128/${data}`;
}

export default function AdvancedInvoiceGenerator() {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    businessName: '',
    businessEmail: '',
    businessAddress: '',
    businessPhone: '',
    businessGSTIN: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientPhone: '',
    items: [{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    taxType: 'GST',
    taxRate: 18,
    taxAmount: 0,
    shipping: 0,
    total: 0,
    notes: 'Thank you for your business!',
    terms: 'Payment is due within 30 days of invoice date. Late payments are subject to a 1.5% monthly fee.',
    currency: 'INR',
    currencySymbol: '₹',
    paymentMethods: ['Bank Transfer', 'UPI', 'Credit Card'],
    logo: '',
    showQRCode: true,
    showBarcode: true,
  });

  const [isEditing, setIsEditing] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    calculateTotals();
  }, [invoice.items, invoice.discountType, invoice.discountValue, invoice.taxType, invoice.taxRate, invoice.shipping]);

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const discountAmount = invoice.discountType === 'percentage'
      ? (subtotal * invoice.discountValue) / 100
      : invoice.discountValue;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = invoice.taxType === 'None' ? 0 : (afterDiscount * invoice.taxRate) / 100;
    const total = afterDiscount + taxAmount + invoice.shipping;

    setInvoice(prev => ({
      ...prev,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      items: prev.items.map(item => ({
        ...item,
        amount: item.quantity * item.rate
      }))
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          updated.amount = updated.quantity * updated.rate;
          return updated;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    const newId = (invoice.items.length + 1).toString();
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: newId, description: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (id: string) => {
    if (invoice.items.length <= 1) return;
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
          .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
          .logo { max-height: 80px; }
          .title { font-size: 32px; font-weight: bold; color: #6366f1; }
          .invoice-number { color: #666; margin-top: 5px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 10px; letter-spacing: 1px; }
          .party-info { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
          .party-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
          .party-details { color: #666; font-size: 14px; line-height: 1.6; }
          .dates { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px; }
          .date-item { text-align: center; }
          .date-label { font-size: 11px; text-transform: uppercase; color: #999; }
          .date-value { font-weight: bold; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #6366f1; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
          tr:hover { background: #f8f9fa; }
          .amount { text-align: right; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .totals-table { width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .totals-row.total { border-bottom: 2px solid #6366f1; font-weight: bold; font-size: 18px; color: #6366f1; }
          .barcode-qr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .barcode-qr img { max-height: 80px; }
          .payment-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .payment-methods { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
          .payment-badge { background: #6366f1; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
          .notes-terms { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          .footer { text-align: center; padding-top: 30px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
          @media print { body { padding: 0; } .invoice-container { border: none; box-shadow: none; } }
        </style>
      </head>
      <body>
        ${invoiceRef.current?.innerHTML || ''}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
          .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
          .logo { max-height: 80px; }
          .title { font-size: 32px; font-weight: bold; color: #6366f1; }
          .invoice-number { color: #666; margin-top: 5px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 10px; letter-spacing: 1px; }
          .party-info { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
          .party-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
          .party-details { color: #666; font-size: 14px; line-height: 1.6; }
          .dates { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px; }
          .date-item { text-align: center; }
          .date-label { font-size: 11px; text-transform: uppercase; color: #999; }
          .date-value { font-weight: bold; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #6366f1; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
          .amount { text-align: right; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .totals-table { width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .totals-row.total { border-bottom: 2px solid #6366f1; font-weight: bold; font-size: 18px; color: #6366f1; }
          .barcode-qr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .barcode-qr img { max-height: 80px; }
          .payment-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .payment-methods { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
          .payment-badge { background: #6366f1; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
          .notes-terms { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          .footer { text-align: center; padding-top: 30px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        ${invoiceRef.current?.innerHTML || ''}
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleSaveJSON = () => {
    const dataStr = JSON.stringify(invoice, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveHTML = () => {
    const htmlContent = invoiceRef.current?.innerHTML || '';
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
    .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
    .logo { max-height: 80px; }
    .title { font-size: 32px; font-weight: bold; color: #6366f1; }
    .invoice-number { color: #666; margin-top: 5px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 10px; letter-spacing: 1px; }
    .party-info { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
    .party-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
    .party-details { color: #666; font-size: 14px; line-height: 1.6; }
    .dates { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px; }
    .date-item { text-align: center; }
    .date-label { font-size: 11px; text-transform: uppercase; color: #999; }
    .date-value { font-weight: bold; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #6366f1; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
    .amount { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-table { width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
    .totals-row.total { border-bottom: 2px solid #6366f1; font-weight: bold; font-size: 18px; color: #6366f1; }
    .barcode-qr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .barcode-qr img { max-height: 80px; }
    .payment-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .payment-methods { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
    .payment-badge { background: #6366f1; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
    .notes-terms { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="invoice-container">${htmlContent}</div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInvoice(prev => ({ ...prev, logo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const qrCodeUrl = generateQRCode(`Invoice:${invoice.invoiceNumber}|Total:${invoice.currencySymbol}${invoice.total}|Due:${invoice.dueDate}`);
  const barcodeUrl = generateBarcode(invoice.invoiceNumber);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Invoice Generator</h2>
          <p className="text-zinc-400">Create professional invoices with QR codes, barcodes, and more</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg ${isEditing ? 'bg-violet-600' : 'bg-zinc-700'}`}
          >
            {isEditing ? '✏️ Editing' : '👁️ Preview Mode'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">🏢</span> Your Business Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={invoice.businessName}
                    onChange={(e) => setInvoice(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Your Company Ltd."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={invoice.businessEmail}
                    onChange={(e) => setInvoice(prev => ({ ...prev, businessEmail: e.target.value }))}
                    placeholder="billing@company.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={invoice.businessPhone}
                    onChange={(e) => setInvoice(prev => ({ ...prev, businessPhone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={invoice.businessGSTIN}
                    onChange={(e) => setInvoice(prev => ({ ...prev, businessGSTIN: e.target.value }))}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Currency</label>
                  <select
                    value={invoice.currency}
                    onChange={(e) => {
                      const curr = CURRENCIES.find(c => c.code === e.target.value);
                      setInvoice(prev => ({
                        ...prev,
                        currency: e.target.value,
                        currencySymbol: curr?.symbol || '$'
                      }));
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">Address</label>
                  <textarea
                    value={invoice.businessAddress}
                    onChange={(e) => setInvoice(prev => ({ ...prev, businessAddress: e.target.value }))}
                    placeholder="123 Business St, City, Country"
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">👤</span> Client Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Client Name *</label>
                  <input
                    type="text"
                    value={invoice.clientName}
                    onChange={(e) => setInvoice(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Client Company"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Client Email</label>
                  <input
                    type="email"
                    value={invoice.clientEmail}
                    onChange={(e) => setInvoice(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="client@company.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Client Phone</label>
                  <input
                    type="tel"
                    value={invoice.clientPhone}
                    onChange={(e) => setInvoice(prev => ({ ...prev, clientPhone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => setInvoice(prev => ({ ...prev, invoiceDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={invoice.invoiceDate}
                    onChange={(e) => setInvoice(prev => ({ ...prev, invoiceDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">Client Address</label>
                  <textarea
                    value={invoice.clientAddress}
                    onChange={(e) => setInvoice(prev => ({ ...prev, clientAddress: e.target.value }))}
                    placeholder="456 Client Ave, City, Country"
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="text-xl">📦</span> Line Items
                </h3>
                <button
                  onClick={addItem}
                  className="px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <label className="block text-xs text-zinc-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Service or product"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-400 mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-400 mb-1">Rate</label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-400 mb-1">Amount</label>
                      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-right">
                        {invoice.currencySymbol}{item.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={invoice.items.length <= 1}
                        className="w-full p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax & Discount */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">💳</span> Tax & Discount
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Discount Type</label>
                  <select
                    value={invoice.discountType}
                    onChange={(e) => setInvoice(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={invoice.discountValue}
                    onChange={(e) => setInvoice(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Tax Type</label>
                  <select
                    value={invoice.taxType}
                    onChange={(e) => setInvoice(prev => ({ ...prev, taxType: e.target.value as any }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  >
                    <option value="GST">GST</option>
                    <option value="VAT">VAT</option>
                    <option value="Sales Tax">Sales Tax</option>
                    <option value="None">No Tax</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={invoice.taxRate}
                    onChange={(e) => setInvoice(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Shipping</label>
                  <input
                    type="number"
                    value={invoice.shipping}
                    onChange={(e) => setInvoice(prev => ({ ...prev, shipping: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">⚙️</span> Options
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.showQRCode}
                    onChange={(e) => setInvoice(prev => ({ ...prev, showQRCode: e.target.checked }))}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-violet-500"
                  />
                  <span>Show QR Code for Payment</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.showBarcode}
                    onChange={(e) => setInvoice(prev => ({ ...prev, showBarcode: e.target.checked }))}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-violet-500"
                  />
                  <span>Show Barcode</span>
                </label>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">📝</span> Notes & Terms
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                  <textarea
                    value={invoice.notes}
                    onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Terms & Conditions</label>
                  <textarea
                    value={invoice.terms}
                    onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Live Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Live Preview</h3>
              <div ref={invoiceRef} className="bg-white text-black p-4 rounded-lg text-xs">
                {/* Invoice Preview Content */}
                <div className="border-b-2 border-violet-500 pb-3 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      {invoice.logo && (
                        <img src={invoice.logo} alt="Logo" className="h-12 mb-2" />
                      )}
                      <h1 className="text-xl font-bold text-violet-600">INVOICE</h1>
                      <p className="text-gray-500 text-xs">{invoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold">{invoice.businessName}</p>
                      <p className="text-gray-500">{invoice.businessEmail}</p>
                      <p className="text-gray-500">{invoice.businessPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                  <div>
                    <p className="text-gray-500 uppercase text-[9px]">Bill To</p>
                    <p className="font-semibold">{invoice.clientName || 'Client Name'}</p>
                    <p className="text-gray-500">{invoice.clientAddress}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-[9px]">Ship To</p>
                    <p className="text-gray-500">{invoice.clientAddress || 'Same as billing'}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 p-2 rounded text-xs">
                  <div className="text-center">
                    <p className="text-gray-500 text-[8px]">Invoice Date</p>
                    <p className="font-semibold text-[10px]">{invoice.invoiceDate}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-[8px]">Due Date</p>
                    <p className="font-semibold text-[10px]">{invoice.dueDate}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-[8px]">Status</p>
                    <p className="font-semibold text-[10px] text-violet-600">UNPAID</p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-4 text-xs">
                  <thead>
                    <tr className="bg-violet-500 text-white">
                      <th className="p-1 text-left text-[8px]">#</th>
                      <th className="p-1 text-left text-[8px]">Description</th>
                      <th className="p-1 text-center text-[8px]">Qty</th>
                      <th className="p-1 text-right text-[8px]">Rate</th>
                      <th className="p-1 text-right text-[8px]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-1 text-[9px]">{index + 1}</td>
                        <td className="p-1 text-[9px]">{item.description || 'Item'}</td>
                        <td className="p-1 text-center text-[9px]">{item.quantity}</td>
                        <td className="p-1 text-right text-[9px]">{invoice.currencySymbol}{item.rate.toFixed(2)}</td>
                        <td className="p-1 text-right text-[9px]">{invoice.currencySymbol}{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-4">
                  <div className="w-36 text-xs">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{invoice.currencySymbol}{invoice.subtotal.toFixed(2)}</span>
                    </div>
                    {invoice.discountAmount > 0 && (
                      <div className="flex justify-between py-1 border-b text-red-500">
                        <span>Discount</span>
                        <span>-{invoice.currencySymbol}{invoice.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.taxType !== 'None' && (
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-gray-500">{invoice.taxType} ({invoice.taxRate}%)</span>
                        <span>{invoice.currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.shipping > 0 && (
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-gray-500">Shipping</span>
                        <span>{invoice.currencySymbol}{invoice.shipping.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 font-bold text-violet-600">
                      <span>Total</span>
                      <span>{invoice.currencySymbol}{invoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code & Barcode */}
                {(invoice.showQRCode || invoice.showBarcode) && (
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded mb-4">
                    {invoice.showQRCode && (
                      <div className="text-center">
                        <img src={qrCodeUrl} alt="QR Code" className="h-16 mx-auto" />
                        <p className="text-[8px] text-gray-500 mt-1">Scan to Pay</p>
                      </div>
                    )}
                    {invoice.showBarcode && (
                      <div className="text-center">
                        <img src={barcodeUrl} alt="Barcode" className="h-10 mx-auto" />
                        <p className="text-[8px] text-gray-500 mt-1">{invoice.invoiceNumber}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Methods */}
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <p className="text-[9px] text-gray-500 uppercase mb-2">Payment Methods</p>
                  <div className="flex gap-1 flex-wrap">
                    {invoice.paymentMethods.map((method, i) => (
                      <span key={i} className="bg-violet-500 text-white px-2 py-0.5 rounded-full text-[8px]">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes & Terms */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 uppercase text-[9px] mb-1">Notes</p>
                    <p className="text-[9px] text-gray-600">{invoice.notes}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-[9px] mb-1">Terms</p>
                    <p className="text-[9px] text-gray-600">{invoice.terms}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t text-center text-[8px] text-gray-400">
                  Generated by AbhiBase • {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full Preview Mode */
        <div className="bg-white rounded-xl p-8 shadow-2xl" ref={invoiceRef}>
          {/* Invoice Preview Content */}
          <div className="border-b-2 border-violet-500 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                {invoice.logo && (
                  <img src={invoice.logo} alt="Logo" className="h-16 mb-3" />
                )}
                <h1 className="text-4xl font-bold text-violet-600">INVOICE</h1>
                <p className="text-gray-500 mt-1">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold">{invoice.businessName}</p>
                <p className="text-gray-500">{invoice.businessEmail}</p>
                <p className="text-gray-500">{invoice.businessPhone}</p>
                {invoice.businessGSTIN && (
                  <p className="text-gray-500 text-sm mt-1">GSTIN: {invoice.businessGSTIN}</p>
                )}
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-gray-500 uppercase text-xs mb-2">Bill To</p>
              <p className="text-lg font-semibold">{invoice.clientName || 'Client Name'}</p>
              <p className="text-gray-500">{invoice.clientAddress}</p>
              <p className="text-gray-500">{invoice.clientEmail}</p>
              <p className="text-gray-500">{invoice.clientPhone}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase text-xs mb-2">Ship To</p>
              <p className="text-gray-500">{invoice.clientAddress || 'Same as billing'}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 text-xs">Invoice Date</p>
              <p className="font-semibold">{invoice.invoiceDate}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs">Due Date</p>
              <p className="font-semibold">{invoice.dueDate}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs">Status</p>
              <p className="font-semibold text-violet-600">UNPAID</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="bg-violet-500 text-white">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{item.description || 'Item'}</td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-right">{invoice.currencySymbol}{item.rate.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold">{invoice.currencySymbol}{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Subtotal</span>
                <span>{invoice.currencySymbol}{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between py-2 border-b text-red-500">
                  <span>Discount</span>
                  <span>-{invoice.currencySymbol}{invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.taxType !== 'None' && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">{invoice.taxType} ({invoice.taxRate}%)</span>
                  <span>{invoice.currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.shipping > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Shipping</span>
                  <span>{invoice.currencySymbol}{invoice.shipping.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 font-bold text-xl text-violet-600">
                <span>Total</span>
                <span>{invoice.currencySymbol}{invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* QR Code & Barcode */}
          {(invoice.showQRCode || invoice.showBarcode) && (
            <div className="flex justify-between items-center bg-gray-50 p-6 rounded-lg mb-8">
              {invoice.showQRCode && (
                <div className="text-center">
                  <img src={qrCodeUrl} alt="QR Code" className="h-32 mx-auto" />
                  <p className="text-xs text-gray-500 mt-2">Scan to Pay</p>
                </div>
              )}
              {invoice.showBarcode && (
                <div className="text-center">
                  <img src={barcodeUrl} alt="Barcode" className="h-16 mx-auto" />
                  <p className="text-xs text-gray-500 mt-2">{invoice.invoiceNumber}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment Methods */}
          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <p className="text-xs text-gray-500 uppercase mb-2">Payment Methods</p>
            <div className="flex gap-2 flex-wrap">
              {invoice.paymentMethods.map((method, i) => (
                <span key={i} className="bg-violet-500 text-white px-3 py-1 rounded-full text-sm">
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Notes</p>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Terms & Conditions</p>
              <p className="text-sm text-gray-600">{invoice.terms}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-sm text-gray-400">
            Generated by AbhiBase • {new Date().toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">⚡</span> Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium flex items-center gap-2"
          >
            🖨️ Print Invoice
          </button>
          <button
            onClick={handleSaveHTML}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2"
          >
            💾 Save as HTML
          </button>
          <button
            onClick={handleSaveJSON}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium flex items-center gap-2"
          >
            📁 Save as JSON
          </button>
          <button
            onClick={() => {
              setInvoice({
                invoiceNumber: generateInvoiceNumber(),
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                businessName: '',
                businessEmail: '',
                businessAddress: '',
                businessPhone: '',
                businessGSTIN: '',
                clientName: '',
                clientEmail: '',
                clientAddress: '',
                clientPhone: '',
                items: [{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }],
                subtotal: 0,
                discountType: 'percentage',
                discountValue: 0,
                discountAmount: 0,
                taxType: 'GST',
                taxRate: 18,
                taxAmount: 0,
                shipping: 0,
                total: 0,
                notes: 'Thank you for your business!',
                terms: 'Payment is due within 30 days of invoice date.',
                currency: 'INR',
                currencySymbol: '₹',
                paymentMethods: ['Bank Transfer', 'UPI', 'Credit Card'],
                logo: '',
                showQRCode: true,
                showBarcode: true,
              });
            }}
            className="px-6 py-3 bg-zinc-600 hover:bg-zinc-700 rounded-lg font-medium flex items-center gap-2"
          >
            🔄 New Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
