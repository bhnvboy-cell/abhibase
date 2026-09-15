// Cart Page
// Review and place order

import { CartSummary } from '@/components/CartSummary'
import { OrderForm } from '@/components/OrderForm'

export default function CartPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <CartSummary />
        <OrderForm />
      </div>
    </div>
  )
}
