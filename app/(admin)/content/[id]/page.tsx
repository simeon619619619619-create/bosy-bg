import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ContentForm } from '@/components/admin/content/content-form'
import { DeleteContentButton } from '@/components/admin/content/delete-content-button'

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: content } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('id', id)
    .single()

  if (!content) {
    notFound()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Редактирай съдържание</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {content.title}
          </p>
        </div>
        <DeleteContentButton id={content.id} title={content.title} />
      </div>
      <div className="mt-6">
        <ContentForm defaultValues={content} />
      </div>
    </div>
  )
}
