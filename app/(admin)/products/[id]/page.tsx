import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/products/product-form'
import { DeleteProductButton } from '@/components/admin/products/delete-product-button'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Редактирай продукт</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.name}
          </p>
        </div>
        <DeleteProductButton id={product.id} name={product.name} />
      </div>
      <div className="mt-6">
        <ProductForm defaultValues={product} />
      </div>
    </div>
  )
}
