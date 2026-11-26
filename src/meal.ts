import {
  waitForEvenAppBridge,
  TextContainerProperty,
  CreateStartUpPageContainer,
  TextContainerUpgrade,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'

// 食事ログ表示。データは /meal.json（個人データのため git 管理外。形式は public/meal.sample.json）
// 操作：タップ＝再読み込み ／ ダブルタップ＝終了
type Pfc = { kcal: number; p: number; f: number; c: number }
type Meal = { date: string; updated: string; target: Pfc; total: Pfc }

async function loadMeal(): Promise<Meal | null> {
  try {
    // 開発中は同じオリジンの /meal.json。パッケージ版は .env.production の VITE_MEAL_URL（git 管理外）
    const base: string = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_MEAL_URL ?? '/meal.json'
    const res = await fetch(`${base}?t=${Date.now()}`)
    if (!res.ok) return null
    return (await res.json()) as Meal
  } catch {
    return null
  }
}

const n = (v: number) => Math.round(v)

// 端末の現地日付（YYYY-MM-DD）。toISOString は UTC になるので使わない
function today(): string {
  const d = new Date()
  const two = (v: number) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`
}

// 残りがマイナスなら「超n」
const left = (v: number) => (n(v) < 0 ? `超${-n(v)}` : `${n(v)}`)

const HELP = 'タップ＝更新／ダブル＝終了'

function render(m: Meal | null): string {
  if (!m) return '食事ログ\nデータが読めません\nタップで再読み込み'
  const now = today()
  // 記録の日付が今日でなければ、古い残りは出さず、目標を出す
  if (m.date !== now) {
    return [
      `食事 ${now.slice(5)}（今日の記録なし）`,
      `目標 ${n(m.target.kcal)}kcal`,
      `P ${n(m.target.p)}　F ${n(m.target.f)}　C ${n(m.target.c)}`,
      `最新の記録 ${m.date.slice(5)}`,
      HELP,
    ].join('\n')
  }
  const r = {
    kcal: m.target.kcal - m.total.kcal,
    p: m.target.p - m.total.p,
    f: m.target.f - m.total.f,
    c: m.target.c - m.total.c,
  }
  return [
    `食事 ${m.date.slice(5)}（${m.updated}時点）`,
    n(r.kcal) < 0 ? `超過 ${-n(r.kcal)}kcal` : `残り ${n(r.kcal)}kcal`,
    `P ${left(r.p)}　F ${left(r.f)}　C ${left(r.c)}`,
    `合計 ${n(m.total.kcal)}kcal`,
    HELP,
  ].join('\n')
}

const bridge = await waitForEvenAppBridge()

await bridge.createStartUpPageContainer(
  new CreateStartUpPageContainer({
    containerTotalNum: 1,
    textObject: [
      new TextContainerProperty({
        xPosition: 0,
        yPosition: 0,
        width: 576,
        height: 288,
        borderWidth: 0,
        borderColor: 5,
        paddingLength: 4,
        containerID: 1,
        containerName: 'main',
        content: render(await loadMeal()),
        isEventCapture: 1,
      }),
    ],
  }),
)

async function redraw() {
  const content = render(await loadMeal())
  bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: 1, containerName: 'main', content }))
}

function eventTypeOf(envelope?: { eventType?: OsEventTypeList }): OsEventTypeList | null {
  if (!envelope) return null
  return envelope.eventType ?? OsEventTypeList.CLICK_EVENT
}

const unsubscribe = bridge.onEvenHubEvent(event => {
  const sysType = eventTypeOf(event.sysEvent)
  const textType = eventTypeOf(event.textEvent)
  if (sysType === OsEventTypeList.DOUBLE_CLICK_EVENT || textType === OsEventTypeList.DOUBLE_CLICK_EVENT) {
    bridge.shutDownPageContainer(1)
    return
  }
  if (sysType === OsEventTypeList.CLICK_EVENT || textType === OsEventTypeList.CLICK_EVENT) {
    void redraw()
    return
  }
  if (sysType === OsEventTypeList.SYSTEM_EXIT_EVENT || sysType === OsEventTypeList.ABNORMAL_EXIT_EVENT) {
    unsubscribe()
  }
})
