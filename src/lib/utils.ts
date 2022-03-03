export async function getAll<T>(
  getter: (page: number) => Promise<T[]>,
  perPage: number
) {
  let page = 1
  let hasNext = true
  const data = []
  do {
    if (page > 1) console.info(`Fetching page ${page}...`)
    const items = await getter(page)
    data.push(...items)
    hasNext = items.length >= perPage
    page++
  } while (hasNext)

  return data
}
