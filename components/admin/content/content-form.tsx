'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createContent, updateContent } from '@/app/admin/content/actions'

interface ContentBlock {
  id: string
  type: string
  title: string
  body: string | null
  image_url: string | null
  is_published: boolean
  position: number | null
}

export function ContentForm({
  defaultValues,
}: {
  defaultValues?: ContentBlock
}) {
  const isEdit = !!defaultValues
  const [type, setType] = useState(defaultValues?.type || 'banner')
  const [isPublished, setIsPublished] = useState(
    defaultValues?.is_published ?? false
  )

  const formAction = isEdit
    ? updateContent.bind(null, defaultValues.id)
    : createContent

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Тип</Label>
        <Select value={type} onValueChange={(value) => setType(value ?? 'banner')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Избери тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="banner">Банер</SelectItem>
            <SelectItem value="blog">Блог</SelectItem>
            <SelectItem value="review">Ревю</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="type" value={type} />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Заглавие</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title || ''}
          placeholder="Заглавие на съдържанието"
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <Label htmlFor="body">Съдържание</Label>
        <Textarea
          id="body"
          name="body"
          defaultValue={defaultValues?.body || ''}
          placeholder="Текст..."
          rows={6}
        />
      </div>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image_url">URL на снимка</Label>
        <Input
          id="image_url"
          name="image_url"
          type="url"
          defaultValue={defaultValues?.image_url || ''}
          placeholder="https://..."
        />
      </div>

      {/* Position (for banners) */}
      <div className="space-y-2">
        <Label htmlFor="position">Позиция (за банери)</Label>
        <Input
          id="position"
          name="position"
          type="number"
          min="0"
          defaultValue={defaultValues?.position ?? 0}
          placeholder="0"
        />
      </div>

      {/* Published switch */}
      <div className="flex items-center gap-3">
        <Switch
          id="is_published_switch"
          checked={isPublished}
          onCheckedChange={(checked) => setIsPublished(checked)}
        />
        <Label htmlFor="is_published_switch">Публикувано</Label>
        <input
          type="hidden"
          name="is_published"
          value={isPublished ? 'true' : 'false'}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit">
          {isEdit ? 'Запази промените' : 'Създай'}
        </Button>
        <Button type="button" variant="outline" render={<a href="/admin/content" />}>
          Отказ
        </Button>
      </div>
    </form>
  )
}
