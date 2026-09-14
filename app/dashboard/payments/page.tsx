'use client';

import { PaymentTracker } from '@/components/payment-tracker';

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto">
        <PaymentTracker />
      </div>
    </div>
  );
}
