'use client'

import { format } from 'date-fns'
import { CalendarIcon, Repeat, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useI18n } from '@/i18n'

export type RecurrenceFrequency = '' | 'daily' | 'weekly' | 'monthly' | 'custom'
export type RecurrenceEndType = 'never' | 'onDate' | 'afterCount'
export type RecurrenceUpdateScope = 'single' | 'future'

export interface RecurrenceEditorValue {
  frequency: RecurrenceFrequency
  interval: string
  weekdays: number[]
  endType: RecurrenceEndType
  endDate: Date | undefined
  endCount: string
  rule: string
  timezone: string
}

interface RecurrenceFieldsProps {
  value: RecurrenceEditorValue
  onChange: (value: RecurrenceEditorValue) => void
  updateScope: RecurrenceUpdateScope
  onUpdateScopeChange: (scope: RecurrenceUpdateScope) => void
}

const WEEKDAY_OPTIONS = [
  { value: 0, labelKey: 'taskDetail.weekdaySun' },
  { value: 1, labelKey: 'taskDetail.weekdayMon' },
  { value: 2, labelKey: 'taskDetail.weekdayTue' },
  { value: 3, labelKey: 'taskDetail.weekdayWed' },
  { value: 4, labelKey: 'taskDetail.weekdayThu' },
  { value: 5, labelKey: 'taskDetail.weekdayFri' },
  { value: 6, labelKey: 'taskDetail.weekdaySat' },
] as const

function getIntervalUnitKey(frequency: RecurrenceFrequency): string {
  switch (frequency) {
    case 'weekly':
      return 'taskDetail.intervalUnitWeeks'
    case 'monthly':
      return 'taskDetail.intervalUnitMonths'
    default:
      return 'taskDetail.intervalUnitDays'
  }
}

export function RecurrenceFields({
  value,
  onChange,
  updateScope,
  onUpdateScopeChange,
}: RecurrenceFieldsProps) {
  const { t } = useI18n()

  const update = (patch: Partial<RecurrenceEditorValue>) => {
    onChange({ ...value, ...patch })
  }

  const clearRecurrence = () => {
    onChange({
      frequency: '',
      interval: '',
      weekdays: [],
      endType: 'never',
      endDate: undefined,
      endCount: '',
      rule: '',
      timezone: '',
    })
  }

  const toggleWeekday = (day: number, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...value.weekdays, day])).sort((a, b) => a - b)
      : value.weekdays.filter(entry => entry !== day)
    update({ weekdays: next })
  }

  const handleFrequencyChange = (frequency: RecurrenceFrequency) => {
    if (!frequency) {
      clearRecurrence()
      return
    }

    const fallbackTimezone
      = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

    update({
      frequency,
      interval: value.interval || '1',
      weekdays:
        frequency === 'weekly'
          ? value.weekdays.length > 0
            ? value.weekdays
            : [new Date().getDay()]
          : frequency === 'custom'
            ? value.weekdays
            : [],
      rule: frequency === 'custom' ? value.rule : '',
      timezone: value.timezone || fallbackTimezone,
    })
  }

  const handleEndTypeChange = (endType: RecurrenceEndType) => {
    if (endType === 'never') {
      update({ endType, endDate: undefined, endCount: '' })
      return
    }

    if (endType === 'onDate') {
      update({ endType, endCount: '' })
      return
    }

    update({ endType, endDate: undefined })
  }

  if (!value.frequency) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
          <Repeat className="h-4 w-4 text-stone-500 dark:text-stone-400" />
          {t('taskDetail.recurrence')}
        </Label>
        <select
          value={value.frequency}
          onChange={event =>
            handleFrequencyChange(event.target.value as RecurrenceFrequency)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
        >
          <option value="">{t('taskDetail.recurrenceNone')}</option>
          <option value="daily">{t('taskDetail.recurrenceDaily')}</option>
          <option value="weekly">{t('taskDetail.recurrenceWeekly')}</option>
          <option value="monthly">{t('taskDetail.recurrenceMonthly')}</option>
          <option value="custom">{t('taskDetail.recurrenceCustom')}</option>
        </select>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-stone-200 p-4 dark:border-stone-800">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
          <Repeat className="h-4 w-4 text-stone-500 dark:text-stone-400" />
          {t('taskDetail.recurrence')}
        </Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearRecurrence}
          className="h-6 px-2 text-stone-500"
        >
          <X className="h-3 w-3 mr-1" />
          {t('taskDetail.clear')}
        </Button>
      </div>

      <select
        value={value.frequency}
        onChange={event =>
          handleFrequencyChange(event.target.value as RecurrenceFrequency)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
      >
        <option value="daily">{t('taskDetail.recurrenceDaily')}</option>
        <option value="weekly">{t('taskDetail.recurrenceWeekly')}</option>
        <option value="monthly">{t('taskDetail.recurrenceMonthly')}</option>
        <option value="custom">{t('taskDetail.recurrenceCustom')}</option>
      </select>

      <div className="grid grid-cols-[auto_100px_auto] items-center gap-2">
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {t('taskDetail.every')}
        </span>
        <Input
          type="number"
          min="1"
          value={value.interval}
          onChange={event => update({ interval: event.target.value })}
          placeholder="1"
        />
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {t(getIntervalUnitKey(value.frequency))}
        </span>
      </div>

      {(value.frequency === 'weekly' || value.frequency === 'custom') && (
        <div className="space-y-2">
          <Label className="font-medium text-stone-700 dark:text-stone-300">
            {t('taskDetail.weekdays')}
          </Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_OPTIONS.map(day => (
              <label
                key={day.value}
                className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-2 py-1 text-xs dark:border-stone-700"
              >
                <Checkbox
                  checked={value.weekdays.includes(day.value)}
                  onCheckedChange={checked =>
                    toggleWeekday(day.value, checked === true)}
                />
                <span>{t(day.labelKey)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {value.frequency === 'custom' && (
        <div className="space-y-2">
          <Label className="font-medium text-stone-700 dark:text-stone-300">
            {t('taskDetail.customRule')}
          </Label>
          <Input
            value={value.rule}
            onChange={event => update({ rule: event.target.value })}
            placeholder={t('taskDetail.customRulePlaceholder')}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="font-medium text-stone-700 dark:text-stone-300">
          {t('taskDetail.timezone')}
        </Label>
        <Input
          value={value.timezone}
          onChange={event => update({ timezone: event.target.value })}
          placeholder={t('taskDetail.timezonePlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label className="font-medium text-stone-700 dark:text-stone-300">
          {t('taskDetail.end')}
        </Label>
        <select
          value={value.endType}
          onChange={event =>
            handleEndTypeChange(event.target.value as RecurrenceEndType)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
        >
          <option value="never">{t('taskDetail.endNever')}</option>
          <option value="onDate">{t('taskDetail.endOnDate')}</option>
          <option value="afterCount">{t('taskDetail.endAfterCount')}</option>
        </select>
      </div>

      {value.endType === 'onDate' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-medium text-stone-700 dark:text-stone-300">
              {t('taskDetail.endOnDate')}
            </Label>
            {value.endDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update({ endDate: undefined })}
                className="h-6 px-2 text-stone-500"
              >
                <X className="h-3 w-3 mr-1" />
                {t('taskDetail.clear')}
              </Button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  !value.endDate ? 'text-stone-500' : ''
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value.endDate
                  ? format(value.endDate, 'PPP')
                  : t('taskDetail.selectEndDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value.endDate}
                onSelect={date => update({ endDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {value.endType === 'afterCount' && (
        <div className="space-y-2">
          <Label className="font-medium text-stone-700 dark:text-stone-300">
            {t('taskDetail.endAfterCount')}
          </Label>
          <Input
            type="number"
            min="1"
            value={value.endCount}
            onChange={event => update({ endCount: event.target.value })}
            placeholder="10"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="font-medium text-stone-700 dark:text-stone-300">
          {t('taskDetail.applyScope')}
        </Label>
        <select
          value={updateScope}
          onChange={event =>
            onUpdateScopeChange(event.target.value as RecurrenceUpdateScope)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
        >
          <option value="single">{t('taskDetail.scopeSingle')}</option>
          <option value="future">{t('taskDetail.scopeFuture')}</option>
        </select>
      </div>
    </div>
  )
}
