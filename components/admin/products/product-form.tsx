'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { createProduct, updateProduct } from '@/app/admin/products/actions'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_price: number | null
  category: string | null
  stock_quantity: number | null
  is_active: boolean
  images: string[] | null
  variants: Record<string, unknown> | null
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ProductForm({
  defaultValues,
}: {
  defaultValues?: Product
}) {
  const isEdit = !!defaultValues
  const [slug, setSlug] = useState(defaultValues?.slug || '')
  const [isActive, setIsActive] = useState(defaultValues?.is_active ?? true)
  const formRef = useRef<HTMLFormElement>(null)

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!slug || !isEdit) {
      setSlug(slugify(e.target.value))
    }
  }

  const formAction = isEdit
    ? updateProduct.bind(null, defaultValues.id)
    : createProduct

  return (
    <form ref={formRef} action={formAction} className="max-w-2xl space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Име на продукта</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name || ''}
          onBlur={handleNameBlur}
          placeholder="Напр. Протеин Whey Gold"
        />
      </div>

      {/* Short name for labels/slips */}
      <div className="space-y-2">
        <Label htmlFor="short_name">Кратко име (за товарителници)</Label>
        <Input
          id="short_name"
          name="short_name"
          defaultValue={
            (defaultValues?.variants &&
              typeof defaultValues.variants === 'object' &&
              typeof (defaultValues.variants as Record<string, unknown>).short_name === 'string'
              ? ((defaultValues.variants as Record<string, unknown>).short_name as string)
              : '')
          }
          placeholder="Напр. Bubbles Лечи (ако е празно, ползва пълното име)"
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL)</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="protein-whey-gold"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description || ''}
          placeholder="Описание на продукта..."
          rows={4}
        />
      </div>

      {/* Price + Compare price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Цена (лв.)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.price || ''}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="compare_price">Стара цена (лв.)</Label>
          <Input
            id="compare_price"
            name="compare_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.compare_price || ''}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Категория</Label>
        <Input
          id="category"
          name="category"
          defaultValue={defaultValues?.category || ''}
          placeholder="Напр. Протеини, Креатин, Аксесоари"
        />
      </div>

      {/* Stock */}
      <div className="space-y-2">
        <Label htmlFor="stock_quantity">Наличност (бр.)</Label>
        <Input
          id="stock_quantity"
          name="stock_quantity"
          type="number"
          min="0"
          defaultValue={defaultValues?.stock_quantity ?? ''}
          placeholder="0"
        />
      </div>

      {/* Image URL — maps to images[0] in the DB */}
      <div className="space-y-2">
        <Label htmlFor="image_url">URL на снимка</Label>
        <Input
          id="image_url"
          name="image_url"
          defaultValue={defaultValues?.images?.[0] || ''}
          placeholder="https://... или /products/slug/featured.png"
        />
      </div>

      {/* Active switch */}
      <div className="flex items-center gap-3">
        <Switch
          id="is_active_switch"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked)}
        />
        <Label htmlFor="is_active_switch">Активен продукт</Label>
        <input type="hidden" name="is_active" value={isActive ? 'true' : 'false'} />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit">
          {isEdit ? 'Запази промените' : 'Създай продукт'}
        </Button>
        <Button type="button" variant="outline" render={<a href="/admin/products" />}>
          Отказ
        </Button>
      </div>
    </form>
  )
}
