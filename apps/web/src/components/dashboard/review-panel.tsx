'use client'

import type { ReviewMetrics } from '@/actions/reviews'
import { BarChart3, BarChartHorizontal, Calendar, CheckCircle2, Clock, Copy, Star, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getMonthlyReview, getWeeklyReview } from '@/actions/reviews'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

interface ReviewPanelProps {
  onTaskClick?: (taskId: string) => void
}

function formatDuration(minutes: number, t: (key: string) => string): string {
  if (minutes < 60) {
    return `${minutes} ${t('review.minutes')}`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}${t('review.hours')}`
  }
  return `${hours}${t('review.hours')} ${mins}${t('review.minutes')}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })
}

export function ReviewPanel({ onTaskClick }: ReviewPanelProps) {
  const { t } = useI18n()
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly')
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadMetrics() {
      setIsLoading(true)
      try {
        const data = periodType === 'weekly'
          ? await getWeeklyReview()
          : await getMonthlyReview()
        setMetrics(data)
      }
      catch (error) {
        console.error('Failed to load review metrics:', error)
      }
      finally {
        setIsLoading(false)
      }
    }
    loadMetrics()
  }, [periodType])

  const handleExportMarkdown = async () => {
    if (!metrics)
      return

    const lines = [
      `# ${periodType === 'weekly' ? t('review.weekly') : t('review.monthly')}`,
      '',
      `**${t('review.period')}:** ${formatDate(metrics.period_start)} - ${formatDate(metrics.period_end)}`,
      '',
      '## Summary',
      '',
      `- **${t('review.tasksCompleted')}:** ${metrics.total_completed}`,
      `- **${t('review.starred')}:** ${metrics.total_starred}`,
      `- **${t('review.totalDuration')}:** ${formatDuration(metrics.total_duration_minutes, t)}`,
      `- **${t('review.avgDaily')}:** ${metrics.avg_daily_completed}`,
      '',
    ]

    if (metrics.by_day.length > 0) {
      lines.push('## By Day', '')
      for (const day of metrics.by_day) {
        lines.push(`### ${formatDate(day.date)}`)
        lines.push('')
        lines.push(`- ${day.total_completed} tasks`)
        if (day.total_duration_minutes > 0) {
          lines.push(`- ${formatDuration(day.total_duration_minutes, t)}`)
        }
        lines.push('')
      }
    }

    if (metrics.by_group.length > 0) {
      lines.push('## By Group', '')
      for (const group of metrics.by_group) {
        lines.push(`### ${group.group_name}`)
        lines.push('')
        lines.push(`- ${group.total_completed} tasks`)
        lines.push('')
      }
    }

    if (metrics.all_tasks.length > 0) {
      lines.push('## Completed Tasks', '')
      for (const task of metrics.all_tasks) {
        const starred = task.starred ? '⭐ ' : ''
        lines.push(`- [x] ${starred}${task.name} (${task.list_name})`)
      }
    }

    const markdown = lines.join('\n')
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Find most productive day
  const mostProductiveDay = metrics?.by_day.reduce(
    (max, day) => day.total_completed > max.total_completed ? day : max,
    metrics?.by_day[0] || null,
  )

  // Find most productive list
  const mostProductiveList = metrics?.by_list[0] || null

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {t('review.title')}
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-stone-500">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  if (!metrics || metrics.total_completed === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {t('review.title')}
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <CheckCircle2 className="h-12 w-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-2">
              {t('review.noTasks')}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t('review.startTracking')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {t('review.title')}
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportMarkdown}
          className="gap-1"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t('review.copied')}
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              {t('review.exportMarkdown')}
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Period Toggle */}
        <Tabs value={periodType} onValueChange={v => setPeriodType(v as 'weekly' | 'monthly')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">{t('review.weekly')}</TabsTrigger>
            <TabsTrigger value="monthly">{t('review.monthly')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period Range */}
        <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(metrics.period_start)}
            {' '}
            -
            {' '}
            {formatDate(metrics.period_end)}
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardDescription className="text-xs">{t('review.tasksCompleted')}</CardDescription>
              <CardTitle className="text-2xl">{metrics.total_completed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardDescription className="text-xs">{t('review.starred')}</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-1">
                {metrics.total_starred}
                <Star className="h-4 w-4 text-yellow-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardDescription className="text-xs">{t('review.totalDuration')}</CardDescription>
              <CardTitle className="text-lg">
                {formatDuration(metrics.total_duration_minutes, t)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardDescription className="text-xs">{t('review.avgDaily')}</CardDescription>
              <CardTitle className="text-2xl">{metrics.avg_daily_completed}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Highlights */}
        {(mostProductiveDay || mostProductiveList) && (
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                {t('review.summary.header')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {t('review.summary.youCompleted')}
                {' '}
                <strong>{metrics.total_completed}</strong>
                {' '}
                {periodType === 'weekly' ? t('review.summary.tasksThisWeek') : t('review.summary.tasksThisMonth')}
                {' '}
                {t('review.summary.keepItUp')}
              </p>
              {mostProductiveDay && mostProductiveDay.total_completed > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                  📅
                  {' '}
                  {t('review.summary.mostProductiveDay')}
                  :
                  {' '}
                  {formatDate(mostProductiveDay.date)}
                  {' '}
                  (
                  {mostProductiveDay.total_completed}
                  {' '}
                  {t('review.summary.tasks')}
                  )
                </p>
              )}
              {mostProductiveList && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  📋
                  {' '}
                  {t('review.summary.mostProductiveList')}
                  :
                  {' '}
                  {mostProductiveList.list_icon}
                  {' '}
                  {mostProductiveList.list_name}
                  {' '}
                  (
                  {t('review.summary.with')}
                  {' '}
                  {mostProductiveList.total_completed}
                  {' '}
                  {t('review.summary.tasks')}
                  )
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* By Day Chart */}
        {metrics.by_day.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChartHorizontal className="h-4 w-4" />
                {t('review.byDay')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3">
              <div className="space-y-2">
                {metrics.by_day.map((day) => {
                  const maxTasks = Math.max(...metrics.by_day.map(d => d.total_completed), 1)
                  const width = (day.total_completed / maxTasks) * 100
                  return (
                    <div key={day.date} className="flex items-center gap-2">
                      <span className="text-xs text-stone-500 w-20 truncate">
                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 h-5 bg-stone-100 dark:bg-stone-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 dark:bg-emerald-600 rounded transition-all duration-300"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-600 dark:text-stone-400 w-6 text-right">
                        {day.total_completed}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* By List */}
        {metrics.by_list.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('review.byList')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3">
              <div className="space-y-2">
                {metrics.by_list.slice(0, 5).map((list) => {
                  return (
                    <div
                      key={list.list_id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-base">{list.list_icon}</span>
                      <span className="flex-1 text-stone-700 dark:text-stone-300 truncate">
                        {list.list_name}
                      </span>
                      <span className="text-stone-500 dark:text-stone-400">
                        {list.total_completed}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Tasks */}
        {metrics.all_tasks.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t('review.allTasks')}
                {' '}
                (
                {metrics.all_tasks.length}
                )
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3">
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {metrics.all_tasks.map(task => (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-2 text-sm py-1 px-2 rounded',
                      'hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer',
                    )}
                    onClick={() => onTaskClick?.(task.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {task.starred && <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                    <span className="flex-1 text-stone-700 dark:text-stone-300 truncate">
                      {task.name}
                    </span>
                    <span className="text-xs text-stone-400 truncate max-w-24">
                      {task.list_icon}
                      {' '}
                      {task.list_name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
