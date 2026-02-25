'use client'

import type { NotificationPermissionState } from '@puratodo/shared'
import {
  formatReminderTime,
  fromLocalDateTimeString,
  getNotificationPermission,

  requestNotificationPermission,
  toLocalDateTimeString,
} from '@puratodo/shared'
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@puratodo/ui'
import {
  AlertCircle,
  Bell,
  BellOff,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export type ReminderPreset = 'none' | 'at_time' | '5min' | '15min' | '30min' | '1hour' | '1day' | 'custom'

export interface ReminderEditorValue {
  preset: ReminderPreset
  customTime: string // datetime-local format: YYYY-MM-DDTHH:mm
}

export interface ReminderEditorProps {
  /** Current remind_at value (ISO string or null) */
  remindAt: string | null
  /** Associated due_date for preset calculations */
  dueDate?: string | null
  /** Associated plan_date for preset calculations */
  planDate?: string | null
  /** Callback when reminder value changes */
  onChange: (value: { remindAt: string | null }) => void
  labels: {
    title: string
    clear: string
    notSupported: string
    denied: string
    enable: string
    selectPreset: string
    presetsNone: string
    presetsAtTime: string
    presets5min: string
    presets15min: string
    presets30min: string
    presets1hour: string
    presets1day: string
    presetsCustom: string
    willRemindAt: string
    noDateWarning: string
  }
}

/**
 * Calculate reminder time based on preset and target date
 */
function calculateRemindAt(
  preset: ReminderPreset,
  customTime: string,
  dueDate?: string | null,
  planDate?: string | null,
): string | null {
  if (preset === 'none') {
    return null
  }

  if (preset === 'custom') {
    return fromLocalDateTimeString(customTime)
  }

  // Determine the target date to base the reminder on
  const targetDateStr = dueDate || planDate
  if (!targetDateStr) {
    return null
  }

  // Parse the date and set to start of day in local time
  const targetDate = new Date(targetDateStr)
  const remindAt = new Date(targetDate)

  // Apply offset based on preset
  switch (preset) {
    case 'at_time':
      // Set to 9:00 AM on the target date
      remindAt.setHours(9, 0, 0, 0)
      break
    case '5min':
      remindAt.setHours(8, 55, 0, 0)
      break
    case '15min':
      remindAt.setHours(8, 45, 0, 0)
      break
    case '30min':
      remindAt.setHours(8, 30, 0, 0)
      break
    case '1hour':
      remindAt.setHours(8, 0, 0, 0)
      break
    case '1day':
      // One day before at 9:00 AM
      remindAt.setDate(remindAt.getDate() - 1)
      remindAt.setHours(9, 0, 0, 0)
      break
    default:
      return null
  }

  return remindAt.toISOString()
}

/**
 * Determine preset from existing remindAt value
 */
function getPresetFromRemindAt(
  remindAt: string | null,
  dueDate?: string | null,
  planDate?: string | null,
): ReminderPreset {
  if (!remindAt) {
    return 'none'
  }

  const targetDateStr = dueDate || planDate
  if (!targetDateStr) {
    // No associated date, must be custom
    return 'custom'
  }

  const remindDate = new Date(remindAt)
  const targetDate = new Date(targetDateStr)

  // Check if it's the same day
  const isSameDay
    = remindDate.getFullYear() === targetDate.getFullYear()
      && remindDate.getMonth() === targetDate.getMonth()
      && remindDate.getDate() === targetDate.getDate()

  if (!isSameDay) {
    // Check if it's one day before
    const dayBefore = new Date(targetDate)
    dayBefore.setDate(dayBefore.getDate() - 1)
    if (
      remindDate.getFullYear() === dayBefore.getFullYear()
      && remindDate.getMonth() === dayBefore.getMonth()
      && remindDate.getDate() === dayBefore.getDate()
      && remindDate.getHours() === 9
      && remindDate.getMinutes() === 0
    ) {
      return '1day'
    }
    return 'custom'
  }

  const hours = remindDate.getHours()
  const minutes = remindDate.getMinutes()

  // Match preset patterns
  if (hours === 9 && minutes === 0)
    return 'at_time'
  if (hours === 8 && minutes === 55)
    return '5min'
  if (hours === 8 && minutes === 45)
    return '15min'
  if (hours === 8 && minutes === 30)
    return '30min'
  if (hours === 8 && minutes === 0)
    return '1hour'

  return 'custom'
}

export function ReminderEditor({
  remindAt,
  dueDate,
  planDate,
  onChange,
  labels,
}: ReminderEditorProps) {
  const [permission, setPermission] = useState<NotificationPermissionState>('default')
  const [value, setValue] = useState<ReminderEditorValue>({
    preset: 'none',
    customTime: '',
  })

  // Check notification permission on mount
  useEffect(() => {
    setPermission(getNotificationPermission())
  }, [])

  // Initialize value from remindAt
  useEffect(() => {
    const preset = getPresetFromRemindAt(remindAt, dueDate, planDate)
    const customTime = preset === 'custom' && remindAt ? toLocalDateTimeString(remindAt) : ''

    setValue({
      preset,
      customTime,
    })
  }, [remindAt, dueDate, planDate])

  const handlePresetChange = (preset: ReminderPreset) => {
    setValue(prev => ({ ...prev, preset }))

    if (preset === 'none') {
      onChange({ remindAt: null })
      return
    }

    if (preset === 'custom') {
      // Don't update remindAt until user picks a time
      return
    }

    const newRemindAt = calculateRemindAt(preset, '', dueDate, planDate)
    onChange({ remindAt: newRemindAt })
  }

  const handleCustomTimeChange = (customTime: string) => {
    setValue(prev => ({ ...prev, customTime }))

    const newRemindAt = fromLocalDateTimeString(customTime)
    onChange({ remindAt: newRemindAt })
  }

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
  }

  const handleClear = () => {
    setValue({ preset: 'none', customTime: '' })
    onChange({ remindAt: null })
  }

  const hasDate = dueDate || planDate

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
          <Bell className="h-4 w-4 text-stone-500 dark:text-stone-400" />
          {labels.title}
        </Label>
        {remindAt && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 px-2 text-stone-500"
          >
            <X className="h-3 w-3 mr-1" />
            {labels.clear}
          </Button>
        )}
      </div>

      {/* Permission warning */}
      {permission === 'unsupported' && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{labels.notSupported}</span>
        </div>
      )}

      {permission === 'denied' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-sm text-red-700 dark:text-red-300">
          <BellOff className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{labels.denied}</span>
        </div>
      )}

      {permission === 'default' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRequestPermission}
          className="w-full"
        >
          <Bell className="h-4 w-4 mr-2" />
          {labels.enable}
        </Button>
      )}

      {permission === 'granted' && (
        <>
          {/* Preset selector */}
          <Select value={value.preset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder={labels.selectPreset} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{labels.presetsNone}</SelectItem>
              {hasDate && (
                <>
                  <SelectItem value="at_time">{labels.presetsAtTime}</SelectItem>
                  <SelectItem value="5min">{labels.presets5min}</SelectItem>
                  <SelectItem value="15min">{labels.presets15min}</SelectItem>
                  <SelectItem value="30min">{labels.presets30min}</SelectItem>
                  <SelectItem value="1hour">{labels.presets1hour}</SelectItem>
                  <SelectItem value="1day">{labels.presets1day}</SelectItem>
                </>
              )}
              <SelectItem value="custom">{labels.presetsCustom}</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom time picker */}
          {value.preset === 'custom' && (
            <Input
              type="datetime-local"
              value={value.customTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomTimeChange(e.target.value)}
              className="w-full"
            />
          )}

          {/* Display current reminder time */}
          {remindAt && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {labels.willRemindAt}
              {' '}
              {formatReminderTime(remindAt)}
            </p>
          )}

          {/* No date warning */}
          {!hasDate && value.preset !== 'none' && value.preset !== 'custom' && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {labels.noDateWarning}
            </p>
          )}
        </>
      )}
    </div>
  )
}
