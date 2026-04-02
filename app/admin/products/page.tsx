import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { toEur } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Package, ArrowUp, ArrowDown } from 'lucide-react'
import { ProductActiveToggle } from '@/components/admin/products/product-active-toggle'
import { ProductMoveButtons } from '@/components/admin/products/product-move-buttons'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { search } = await searchParams
  const searchQuery = typeof search === 'string' ? search : ''

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`)
  }

  const { data: products } = await query

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Продукти</h1>
        <Button render={<Link href="/products/new" />}>
          <Plus data-icon="inline-start" />
          Нов продукт
        </Button>
      </div>

      {/* Search */}
      <form className="mt-6" action="/products" method="GET">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Търси по име..."
            defaultValue={searchQuery}
            className="pl-9"
          />
        </div>
      </form>

      {/* Table */}
      {!products || products.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Package className="size-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Няма продукти</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? `Няма резултати за "${searchQuery}"`
              : 'Добави първия си продукт'}
          </p>
          {!searchQuery && (
            <Button className="mt-4" render={<Link href="/products/new" />}>
              <Plus data-icon="inline-start" />
              Нов продукт
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Ред</TableHead>
                <TableHead className="w-[60px]">Снимка</TableHead>
                <TableHead>Име</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Намаление</TableHead>
                <TableHead>Наличност</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => {
                const hasDiscount = product.compare_price && product.compare_price > product.price
                const discountPct = hasDiscount
                  ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
                  : 0
                const imgSrc = Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : product.image_url
                return (
                <TableRow key={product.id}>
                  <TableCell>
                    <ProductMoveButtons
                      id={product.id}
                      isFirst={index === 0}
                      isLast={index === products.length - 1}
                    />
                  </TableCell>
                  <TableCell>
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={product.name}
                        className="size-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                        <Package className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.name}
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="secondary">{product.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    <span>{toEur(Number(product.price)).toFixed(2)} &euro;</span>
                    {hasDiscount && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        {toEur(Number(product.compare_price)).toFixed(2)} &euro;
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hasDiscount ? (
                      <Badge variant="destructive">-{discountPct}%</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.stock_quantity != null ? (
                      <Badge
                        variant={
                          product.stock_quantity > 0 ? 'secondary' : 'destructive'
                        }
                      >
                        {product.stock_quantity}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ProductActiveToggle
                      id={product.id}
                      isActive={product.is_active}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" render={<Link href={`/products/${product.id}`} />}>
                      Редактирай
                    </Button>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
