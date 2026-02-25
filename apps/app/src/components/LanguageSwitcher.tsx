import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@puratodo/ui'
import { Check, Globe } from 'lucide-react'
import { useI18n } from '@/i18n'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('language.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale('en')}
          className={locale === 'en' ? 'bg-accent' : ''}
        >
          {locale === 'en' && <Check className="h-4 w-4 mr-2" />}
          <span className={locale === 'en' ? '' : 'ml-6'}>{t('language.english')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('zh')}
          className={locale === 'zh' ? 'bg-accent' : ''}
        >
          {locale === 'zh' && <Check className="h-4 w-4 mr-2" />}
          <span className={locale === 'zh' ? '' : 'ml-6'}>{t('language.chinese')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
