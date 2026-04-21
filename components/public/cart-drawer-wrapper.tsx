'use client'

import { useCart } from '@/components/public/cart-provider'
import { CartDrawer } from '@/components/public/cart-drawer'

export function CartDrawerWrapper() {
  const { drawerOpen, closeCartDrawer } = useCart()
  return <CartDrawer open={drawerOpen} onClose={closeCartDrawer} />
}
