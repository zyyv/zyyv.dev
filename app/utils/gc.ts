import type { Day, WeekDay, Weeks } from '~/types'
import dayjs from 'dayjs'

export interface Label {
  x: number
  y: number
  text: string
}

export const MIN_DISTANCE_MONTH_LABELS = 2

export const DEFAULT_MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export const DEFAULT_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const DEFAULT_LABELS = {
  months: DEFAULT_MONTH_LABELS,
  weekdays: DEFAULT_WEEKDAY_LABELS,
  totalCount: '{{count}} contributions in {{year}}',
  tooltip: '<strong>{{count}} contributions</strong> on {{date}}',
  legend: {
    less: 'Less',
    more: 'More',
  },
}

export function parseISO(date: string) {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  return new Date(year, month - 1, day)
}

export function formatDate(date: Date) {
  return dayjs(date).format('MMM DD, YYYY')
}

export function groupByWeeks(days: Day[], weekStart: WeekDay = 0): Weeks {
  if (days.length === 0)
    return []

  const normalizedDays = normalizeCalendarDays(days)

  const firstDate = parseISO(normalizedDays[0].date)
  const firstCalendarDate = getDay(firstDate) === weekStart ? firstDate : subWeeks(nextDay(firstDate, weekStart), 1)

  const paddedDays: Array<Day | undefined> = [
    ...Array.from({
      length: differenceInCalendarDays(firstDate, firstCalendarDate),
    }, () => undefined),
    ...normalizedDays,
  ]

  return Array.from({ length: Math.ceil(paddedDays.length / 7) }, (_, i) => paddedDays.slice(i * 7, i * 7 + 7))
}

export function getMonth(date: Date) {
  return date.getMonth()
}

export function getMonthLabels(
  weeks: Weeks,
  monthNames: Array<string> = DEFAULT_MONTH_LABELS,
): Array<Label> {
  return weeks.reduce<Array<Label>>((labels, week, index) => {
    const firstWeekDay = week.find(day => day !== undefined)

    if (!firstWeekDay)
      throw new Error(`Unexpected error: Week is empty: [${week}]`)

    const month = monthNames[getMonth(parseISO(firstWeekDay.date))]
    const prev = labels[labels.length - 1]

    if (index === 0 || prev.text !== month) {
      return [
        ...labels,
        {
          x: index,
          y: -7,
          text: month,
        },
      ]
    }

    return labels
  }, [])
    .filter((label, index, labels) => {
      if (index === 0)
        return labels[1] && labels[1].x - label.x > MIN_DISTANCE_MONTH_LABELS

      return true
    })
}

export function normalizeCalendarDays(days: Day[]): Day[] {
  const daysMap = days.reduce((map, day) => {
    map.set(day.date, day)
    return map
  }, new Map<string, Day>())

  return eachDayOfInterval(parseISO(days[0].date), parseISO(days[days.length - 1].date)).map((day) => {
    const date = formatISO(day, { representation: 'date' })!

    if (daysMap.has(date))
      return daysMap.get(date)!

    return {
      date,
      count: 0,
      level: 0,
    }
  })
}

export function formatISO(date: Date, options?: { representation: 'date' | 'time' }) {
  const nDate = dayjs(date)
  if (options?.representation === 'date')
    return nDate.format('YYYY-MM-DD')
  if (options?.representation === 'time')
    return nDate.format('HH:mm:ss')
}

// 返回指定时间间隔内的日期数组。
export function eachDayOfInterval(start: Date, end: Date): Date[] {
  // const { start, end } = interval
  const days = []

  let date = start
  while (isBefore(date, end) || isEqual(date, end)) {
    days.push(date)
    date = addDays(date, 1)
  }

  return days
}

function isBefore(dateLeft: Date, dateRight: Date) {
  return dayjs(dateLeft).isBefore(dateRight)
}

function isEqual(dateLeft: Date, dateRight: Date) {
  return dayjs(dateLeft).isSame(dateRight)
}

function addDays(date: Date, amount: number) {
  return dayjs(date).add(amount, 'day').toDate()
}

function getDay(date: Date) {
  return date.getDay()
}

function nextDay(date: Date, day: WeekDay) {
  const diff = (day - date.getDay() + 7) % 7
  return addDays(date, diff)
}

function subWeeks(date: Date, amount: number) {
  return getDayjsSubtract(date, amount, 'week')
}

function differenceInCalendarDays(dateLeft: Date, dateRight: Date) {
  return dayjs(dateLeft).diff(dateRight, 'day')
}

export function getDayjsSubtract(date: Date | undefined, amount: number, unit: dayjs.ManipulateType) {
  return dayjs(date).subtract(amount, unit).toDate()
}
