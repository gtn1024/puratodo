export interface CheckForAppUpdatesOptions {
  manual?: boolean
  t: (key: string) => string
}

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

export async function checkForAppUpdates({ manual = false, t }: CheckForAppUpdatesOptions): Promise<void> {
  if (!isTauriEnvironment()) {
    return
  }

  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()

    if (!update) {
      if (manual) {
        alert(t('updater.noUpdate'))
      }
      return
    }

    const promptLines = [
      `${t('updater.available')} ${update.version}`,
      `${t('updater.currentVersion')} ${update.currentVersion}`,
      t('updater.installPrompt'),
    ]
    if (update.body?.trim()) {
      promptLines.push('', t('updater.releaseNotes'), update.body.trim())
    }

    const shouldInstall = confirm(promptLines.join('\n'))
    if (!shouldInstall) {
      return
    }

    alert(t('updater.downloading'))
    await update.downloadAndInstall()
    alert(t('updater.installed'))
  }
  catch (error) {
    console.error('Failed to check/install update', error)
    if (manual) {
      alert(t('updater.failed'))
    }
  }
}
