import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface KlaviyoCampaign {
  id: string
  name: string
  status: string
  send_time: string | null
  stats?: {
    open_rate?: number
    click_rate?: number
    recipients?: number
  }
}

interface KlaviyoFlow {
  id: string
  name: string
  status: string
}

export default async function KlaviyoPage() {
  const supabase = await createServerSupabaseClient()

  const { data: profilesRow } = await supabase
    .from('klaviyo_cache')
    .select('data, synced_at')
    .eq('metric_type', 'profiles')
    .single()

  const { data: campaignsRow } = await supabase
    .from('klaviyo_cache')
    .select('data, synced_at')
    .eq('metric_type', 'campaigns')
    .single()

  const { data: flowsRow } = await supabase
    .from('klaviyo_cache')
    .select('data, synced_at')
    .eq('metric_type', 'flows')
    .single()

  const totalProfiles =
    (profilesRow?.data as Record<string, unknown>)?.total ?? 0

  const campaigns: KlaviyoCampaign[] = Array.isArray(campaignsRow?.data)
    ? (campaignsRow.data as KlaviyoCampaign[])
    : []

  const flows: KlaviyoFlow[] = Array.isArray(flowsRow?.data)
    ? (flowsRow.data as KlaviyoFlow[])
    : []

  return (
    <div>
      <h1 className="text-3xl font-bold">Klaviyo</h1>

      {/* Subscribers card */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Общо абонати
              </CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Number(totalProfiles).toLocaleString('bg-BG')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns */}
      <h2 className="mt-8 text-xl font-semibold">Последни кампании</h2>
      {campaigns.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Няма синхронизирани кампании
        </p>
      ) : (
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име</TableHead>
                <TableHead className="text-right">Изпратени</TableHead>
                <TableHead className="text-right">Open Rate</TableHead>
                <TableHead className="text-right">Click Rate</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right font-mono">
                    {c.stats?.recipients?.toLocaleString('bg-BG') ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {c.stats?.open_rate != null
                      ? `${(c.stats.open_rate * 100).toFixed(1)}%`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {c.stats?.click_rate != null
                      ? `${(c.stats.click_rate * 100).toFixed(1)}%`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.send_time
                      ? new Date(c.send_time).toLocaleDateString('bg-BG')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Active flows */}
      <h2 className="mt-8 text-xl font-semibold">Активни потоци (Flows)</h2>
      {flows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Няма синхронизирани потоци
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3"
            >
              <span className="font-medium">{flow.name}</span>
              <Badge
                variant={flow.status === 'live' ? 'default' : 'secondary'}
              >
                {flow.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
