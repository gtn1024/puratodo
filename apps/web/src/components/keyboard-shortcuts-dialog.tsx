'use client'

import { Keyboard } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useI18n } from '@/i18n'

interface ShortcutItem {
  keys: string[]
  descriptionKey: string
}

const SHORTCUTS_LIST: ShortcutItem[] = [
  { keys: ['N'], descriptionKey: 'shortcuts.createNewTask' },
  { keys: ['L'], descriptionKey: 'shortcuts.createNewList' },
  { keys: ['Ctrl', 'K'], descriptionKey: 'shortcuts.searchTasks' },
  { keys: ['?'], descriptionKey: 'shortcuts.showThisHelp' },
  { keys: ['Esc'], descriptionKey: 'shortcuts.closeDialogMenu' },
]

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('shortcuts.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {SHORTCUTS_LIST.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-stone-600 dark:text-stone-400">
                {t(shortcut.descriptionKey)}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 text-xs font-mono bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Button to trigger the dialog
export function KeyboardShortcutsButton({
  onClick,
}: {
  onClick: () => void
}) {
  const { t } = useI18n()

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="h-6 w-6"
      onClick={onClick}
      title={t('shortcuts.buttonTitle')}
    >
      <Keyboard className="h-3.5 w-3.5" />
      <span className="sr-only">{t('shortcuts.buttonSrOnly')}</span>
    </Button>
  )
}
