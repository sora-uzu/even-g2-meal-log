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
    const res = await fetch(`/meal.json?t=${Date.now()}`)
    if (!res.ok) return null
    return (await res.json()) as Meal
  } catch {
    return null
  }
}

const n = (v: number) => Math.round(v)

function render(m: Meal | null): string {
  if (!m) return '食事ログ\nデータが読めません\nタップで再読み込み'
  const r = {
    kcal: m.target.kcal - m.total.kcal,
    p: m.target.p - m.total.p,
    f: m.target.f - m.total.f,
    c: m.target.c - m.total.c,
  }
  return [
    `食事 ${m.date.slice(5)}（${m.updated}時点）`,
    `残り ${n(r.kcal)}kcal`,
    `P ${n(r.p)}　F ${n(r.f)}　C ${n(r.c)}`,
    `合計 ${n(m.total.kcal)}kcal`,
    'タップ＝更新／ダブル＝終了',
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
