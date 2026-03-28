/* eslint-disable react-hooks/error-boundaries */
import Link from 'next/link'
import { getCaller } from '@/utils/trpcServer'

export default async function TelegramConnectPage() {
  try {
    const caller = await getCaller()
    const result = await caller.oauthRouter.telegram()

    const botUsername = result.botUsername || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'bot'
    const addBotUrl = `https://t.me/${botUsername}?startgroup=chronex_${result.registrationCode}`

    return (
      <main className="mx-auto max-w-xl space-y-4 px-6 py-8 text-sm">
        <h1 className="text-xl font-semibold">Telegram setup started</h1>
        <p>
          The workspace is linked to <strong>@{botUsername}</strong>, but Telegram will only become
          fully connected after you register at least one channel or group.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Add the bot as an admin in the Telegram channel or group you want to post to.</li>
          <li>
            In that same chat, send this command once:
            <code className="ml-2 rounded bg-muted px-2 py-1">
              /connect {result.registrationCode}
            </code>
          </li>
          <li>After the bot confirms, close this tab and refresh Chronex.</li>
        </ol>
        <p>
          <Link
            href={addBotUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-4"
          >
            Open Telegram and add the bot
          </Link>
        </p>
      </main>
    )
  } catch (error) {
    console.error('Telegram connect error:', error)
    return <div>Telegram connection failed. Please try again.</div>
  }
}
