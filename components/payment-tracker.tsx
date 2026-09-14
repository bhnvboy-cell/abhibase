'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  client_name: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  created_at: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export function PaymentTracker() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState({
    totalEarned: 0,
    pending: 0,
    overdue: 0,
    thisMonth: 0
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await api.payments.listInvoices();
      setInvoices(data);
      calculateStats(data);
    } catch (error) {
      console.error('Failed to load invoices');
    }
  };

  const calculateStats = (data: Invoice[]) => {
    const totalEarned = data
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);
    
    const pending = data
      .filter(i => i.status === 'sent')
      .reduce((sum, i) => sum + i.amount, 0);
    
    const overdue = data
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + i.amount, 0);

    const thisMonth = data
      .filter(i => {
        const date = new Date(i.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear() &&
               i.status === 'paid';
      })
      .reduce((sum, i) => sum + i.amount, 0);

    setStats({ totalEarned, pending, overdue, thisMonth });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-zinc-500/20 text-zinc-400',
      sent: 'bg-blue-500/20 text-blue-400',
      paid: 'bg-emerald-500/20 text-emerald-400',
      overdue: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-zinc-500/20 text-zinc-400'
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Total Earned</p>
          <p className="text-2xl font-bold text-emerald-400">₹{stats.totalEarned.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-blue-400">₹{stats.pending.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Overdue</p>
          <p className="text-2xl font-bold text-red-400">₹{stats.overdue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">This Month</p>
          <p className="text-2xl font-bold text-violet-400">₹{stats.thisMonth.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Invoices</h3>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm"
          >
            + New Invoice
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-4xl mb-2">💰</p>
            <p>No invoices yet</p>
            <p className="text-sm mt-2">Create your first invoice to start tracking payments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{invoice.client_name}</p>
                  <p className="text-sm text-zinc-400">
                    Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{invoice.amount.toLocaleString('en-IN')}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <InvoiceModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadInvoices();
          }}
        />
      )}
    </div>
  );
}

function InvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    due_date: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }]
  });

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...form.items];
    (newItems[index] as any)[field] = value;
    setForm({ ...form, items: newItems });
  };

  const removeItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  };

  const total = form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.payments.createInvoice({
        ...form,
        amount: total,
        currency: 'INR',
        status: 'draft'
      });
      onCreated();
    } catch (error) {
      console.error('Failed to create invoice');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">New Invoice</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Client Name</label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Client Email</label>
              <input
                type="email"
                value={form.client_email}
                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-zinc-400">Items</label>
                <button type="button" onClick={addItem} className="text-violet-400 text-sm hover:text-violet-300">
                  + Add Item
                </button>
              </div>
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                    />
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-300 px-2">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-700 pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-emerald-400">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 py-2 rounded-lg">
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
