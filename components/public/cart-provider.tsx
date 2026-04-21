'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number | null
  image: string | null
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartCount: () => number
  drawerOpen: boolean
  openCartDrawer: () => void
  closeCartDrawer: () => void
}

const CartContext = createContext<CartContextType | null>(null)

const CART_KEY = 'bosy-cart'

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const openCartDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeCartDrawer = useCallback(() => setDrawerOpen(false), [])

  useEffect(() => {
    setItems(loadCart())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveCart(items)
  }, [items, loaded])

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { ...item, quantity }]
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.id !== id))
      return
    }
    setItems(prev => prev.map(i => (i.id === id ? { ...i, quantity } : i)))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const getCartTotal = useCallback(() => {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  }, [items])

  const getCartCount = useCallback(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0)
  }, [items])

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount, drawerOpen, openCartDrawer, closeCartDrawer }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
