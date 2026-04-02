import { ContentForm } from '@/components/admin/content/content-form'

export default function NewContentPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Ново съдържание</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Попълни данните за новото съдържание
      </p>
      <div className="mt-6">
        <ContentForm />
      </div>
    </div>
  )
}
