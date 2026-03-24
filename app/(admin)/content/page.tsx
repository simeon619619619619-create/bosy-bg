import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Plus, FileText } from 'lucide-react'
import { ContentPublishedToggle } from '@/components/admin/content/content-published-toggle'

const TAB_MAP: Record<string, string> = {
  banners: 'banner',
  blog: 'blog',
  reviews: 'review',
}

const TYPE_LABELS: Record<string, string> = {
  banner: 'Банер',
  blog: 'Блог',
  review: 'Ревю',
}

const TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  banner: 'default',
  blog: 'secondary',
  review: 'outline',
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab } = await searchParams
  const activeTab = typeof tab === 'string' && tab in TAB_MAP ? tab : 'banners'
  const filterType = TAB_MAP[activeTab]

  const supabase = await createServerSupabaseClient()

  const { data: items } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('type', filterType)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Съдържание</h1>
        <Button render={<Link href="/content/new" />}>
          <Plus data-icon="inline-start" />
          Ново съдържание
        </Button>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs value={activeTab}>
          <TabsList>
            <TabsTrigger value="banners" render={<Link href="/content?tab=banners" />}>
              Банери
            </TabsTrigger>
            <TabsTrigger value="blog" render={<Link href="/content?tab=blog" />}>
              Блог
            </TabsTrigger>
            <TabsTrigger value="reviews" render={<Link href="/content?tab=reviews" />}>
              Ревюта
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {!items || items.length === 0 ? (
              <div className="mt-12 flex flex-col items-center justify-center text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="size-8 text-muted-foreground" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">Няма съдържание</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Добави първото си съдържание от този тип
                </p>
                <Button className="mt-4" render={<Link href="/content/new" />}>
                  <Plus data-icon="inline-start" />
                  Ново съдържание
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Заглавие</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Публикувано</TableHead>
                    <TableHead>Позиция</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="w-[100px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={TYPE_VARIANTS[item.type] || 'secondary'}>
                          {TYPE_LABELS[item.type] || item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ContentPublishedToggle
                          id={item.id}
                          isPublished={item.is_published}
                        />
                      </TableCell>
                      <TableCell className="font-mono">
                        {item.position ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('bg-BG')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" render={<Link href={`/content/${item.id}`} />}>
                          Редактирай
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
