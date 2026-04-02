import { ProductForm } from '@/components/admin/products/product-form'

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Нов продукт</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Попълни данните за новия продукт
      </p>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  )
}
