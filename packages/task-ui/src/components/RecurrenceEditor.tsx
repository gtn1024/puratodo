'use client'

import type {
  RecurrenceEditorValue,
  RecurrenceEndType,
  RecurrenceFrequency,
  RecurrenceUpdateScope,
} from './TaskDetailForm'
import {
  Button,
  Calendar,
  Checkbox,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@puratodo/ui'
import { format } from 'date-fns'
import { CalendarIcon, Repeat, X } from 'lucide-react'

export interface RecurrenceEditorProps {
  value: RecurrenceEditorValue
  onChange: (value: RecurrenceEditorValue) => void
  updateScope: RecurrenceUpdateScope
  onUpdateScopeChange: (scope: RecurrenceUpdateScope) => void
  labels: {
    recurrence: string
    recurrenceNone: string
    recurrenceDaily: string
    recurrenceWeekly: string
    recurrenceMonthly: string
    recurrenceCustom: string
    clear: string
    every: string
    intervalUnitDays: string
    intervalUnitWeeks: string
    intervalUnitMonths: string
    weekdays: string
    weekdaySun: string
    weekdayMon: string
    weekdayTue: string
    weekdayWed: string
    weekdayThu: string
    weekdayFri: string
    weekdaySat: string
    customRule: string
    customRulePlaceholder: string
    timezone: string
    timezonePlaceholder: string
    end: string
    endNever: string
    endOnDate: string
    endAfterCount: string
    selectEndDate: string
    applyScope: string
    scopeSingle: string
    scopeFuture: string
  }
}

const WEEKDAY_OPTIONS = [
  { value: 0, labelKey: 'weekdaySun' },
  { value: 1, labelKey: 'weekdayMon' },
  { value: 2, labelKey: 'weekdayTue' },
  { value: 3, labelKey: 'weekdayWed' },
  { value: 4, labelKey: 'weekdayThu' },
  { value: 5, labelKey: 'weekdayFri' },
  { value: 6, labelKey: 'weekdaySat' },
] as const

function getIntervalUnitKey(frequency: RecurrenceFrequency): string {
  switch (frequency) {
    case 'weekly':
      return 'intervalUnitWeeks'
    case 'monthly':
      return 'intervalUnitMonths'
    default:
      return 'intervalUnitDays'
  }
}

export function RecurrenceEditor({
  value,
  onChange,
  updateScope,
  onUpdateScopeChange,
  labels,
}: RecurrenceEditorProps) {
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
          {labels.recurrence}
        </Label>
        <select
          value={value.frequency}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            handleFrequencyChange(event.target.value as RecurrenceFrequency)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
        >
          <option value="">{labels.recurrenceNone}</option>
          <option value="daily">{labels.recurrenceDaily}</option>
          <option value="weekly">{labels.recurrenceWeekly}</option>
          <option value="monthly">{labels.recurrenceMonthly}</option>
          <option value="custom">{labels.recurrenceCustom}</option>
        </select>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-stone-200 p-4 dark:border-stone-800">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
          <Repeat className="h-4 w-4 text-stone-500 dark:text-stone-400" />
          {labels.recurrence}
        </Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearRecurrence}
          className="h-6 px-2 text-stone-500"
        >
          <X className="h-3 w-3 mr-1" />
          {labels.clear}
        </Button>
      </div>

      <select
        value={value.frequency}
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
          handleFrequencyChange(event.target.value as RecurrenceFrequency)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
      >
        <option value="daily">{labels.recurrenceDaily}</option>
        <option value="weekly">{labels.recurrenceWeekly}</option>
        <option value="monthly">{labels.recurrenceMonthly}</option>
        <option value="custom">{labels.recurrenceCustom}</option>
      </select>

      <div className="grid grid-cols-[auto_100px_auto] items-center gap-2">
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {labels.every}
        </span>
        <Input
          type="number"
          min="1"
          value={value.interval}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => update({ interval: event.target.value })}
          placeholder="1"
        />
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {labels[getIntervalUnitKey(value.frequency) as keyof typeof labels]}
        </span>
      </div>

      {(value.frequency === 'weekly' || value.frequency === 'custom') && (
        <div className="space-y-2">
          <Label className="font-medium text-stone-700 dark:text-stone-300">
            {labels.weekdays}
          </Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_OPTIONS.map(day => (
              <label
                key={day.value}
                className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-2 py-1 text-xs dark:border-stone-700"
              >
                <Checkbox
                  checked={value.weekdays.includes(day.value)}
                  onCheckedChange={(checked: boolean | 'indeterminate') =>
                    toggleWeekday(day.value, checked === true)}
                />
                <span>{labels[day.labelKey as keyof typeof labels]}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {value.frequency === 'custom' && (
        <div className="space-y-2">
          <Label className="font-medium text-stone-700 dark:text-stone-300">
            {labels.customRule}
          </Label>
          <Input
            value={value.rule}
            onChange={event => update({ rule: event.target.value })}
            placeholder={labels.customRulePlaceholder}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="font-medium text-stone-700 dark:text-stone-300">
          {labels.timezone}
        </Label>
        <Input
          value={value.timezone}
          onChange={event => update({ timezone: event.target.value })}
          placeholder={labels.timezonePlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label className="font-medium text-stone-700 dark:text-stone-300">
          {labels.end}
        </Label>
        <select
          value={value.endType}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            handleEndTypeChange(event.target.value as RecurrenceEndType)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
        >
          <option value="never">{labels.endNever}</option>
          <option value="onDate">{labels.endOnDate}</option>
          <option value="afterCount">{labels.endAfterCount}</option>
        </select>
      </div>

      {value.endType === 'onDate' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-medium text-stone-700 dark:text-stone-300">
              {labels.endOnDate}
            </Label>
            {value.endDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update({ endDate: undefined })}
                className="h-6 px-2 text-stone-500"
              >
                <X className="h-3 w-3 mr-1" />
                {labels.clear}
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
                  : labels.selectEndDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value.endDate}
                onSelect={(date: Date | undefined) => update({ endDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {value.endType === 'afterCount' && (
        <div className="space-y-2">
          <Label className="font-medium text-stone-700 dark:text-stone-300">
            {labels.endAfterCount}
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
          {labels.applyScope}
        </Label>
        <select
          value={updateScope}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            onUpdateScopeChange(event.target.value as RecurrenceUpdateScope)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
        >
          <option value="single">{labels.scopeSingle}</option>
          <option value="future">{labels.scopeFuture}</option>
        </select>
      </div>
    </div>
  )
}
