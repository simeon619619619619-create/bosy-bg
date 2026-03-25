'use server'

import { createClient } from '@supabase/supabase-js'
import { sendNewOrderNotification } from '@/lib/resend/client'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string | null
}

interface CreateOrderInput {
  name: string
  email: string
  phone: string
  city: string
  address: string
  postalCode: string
  notes: string
  items: OrderItem[]
}

function generateOrderNumber(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `B${datePart}-${randomPart}`
}

export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; orderNumber: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Calculate totals
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = subtotal >= 50 ? 0 : 5.99
  const total = subtotal + shippingCost

  // 1. Upsert customer by email
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, total_orders, total_spent')
    .eq('email', input.email)
    .single()

  let customerId: string

  if (existingCustomer) {
    customerId = existingCustomer.id

    // Update customer info (name/phone/address might change)
    await supabase
      .from('customers')
      .update({
        name: input.name,
        phone: input.phone,
        address: {
          city: input.city,
          street: input.address,
          zip: input.postalCode,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: {
          city: input.city,
          street: input.address,
          zip: input.postalCode,
        },
        total_orders: 0,
        total_spent: 0,
      })
      .select('id')
      .single()

    if (customerError || !newCustomer) {
      throw new Error(customerError?.message ?? 'Failed to create customer')
    }

    customerId = newCustomer.id
  }

  // 2. Create order
  const orderNumber = generateOrderNumber()

  const orderItems = input.items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }))

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      items: orderItems,
      subtotal,
      shipping_cost: shippingCost,
      total,
      status: 'pending',
      notes: input.notes || null,
      shipping_address: {
        city: input.city,
        street: input.address,
        zip: input.postalCode,
      },
    })
    .select('id')
    .single()

  if (orderError || !order) {
    throw new Error(orderError?.message ?? 'Failed to create order')
  }

  // 3. Update customer aggregates
  const prevOrders = existingCustomer?.total_orders ?? 0
  const prevSpent = Number(existingCustomer?.total_spent ?? 0)

  await supabase
    .from('customers')
    .update({
      total_orders: prevOrders + 1,
      total_spent: prevSpent + total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)

  // 4. Send email notifications (customer + admin)
  await sendNewOrderNotification(
    input.email,
    input.name,
    orderNumber,
    total,
    input.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
  ).catch(() => {})

  return { orderId: order.id, orderNumber }
}
