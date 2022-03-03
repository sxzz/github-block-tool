/* eslint-disable no-console */
import { writeFile } from 'fs/promises'
import { Octokit } from '@octokit/rest'
import { red, blue } from 'colorette'

const words = [
  '操你',
  'fuck',
  '美国政府',
  '傻逼',
  '干你娘',
  '没脑子',
  'StayWithUkraine'.toLowerCase(),
  '公平',
  '对乌自卫反击战',
  '侵略战争',
  '尤雨溪',
  '支那',
  '屁眼',
  '你妈',
  '湾湾',
  '华为',
  '垃圾',
  '罪魁祸首',
  '美国狗',
  'your mother',
  '英特纳雄耐尔',
  '干你老母',
  '谢罪',
  '帝国主义',
  '美国战争列表',
  '鱿鱼须',
  '俄乌',
  '美狗',
  '美忠犬',
  '南联盟大使馆',
  '南海',
  '乌拉',
  '西方爹',
  '软骨头',
  '中美',
  '支持乌克兰',
  '死一户口本',
]

const data: {
  author: string
  content: string
  shouldBlock: boolean
}[] = []

const octokit = new Octokit({
  auth: process.env.TOKEN,
})

async function getAll<T>(
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

function getBlocked() {
  return getAll(
    async (page) =>
      (
        await octokit.users.listBlockedByAuthenticatedUser({
          page,
          per_page: 100,
        })
      ).data ?? [],
    100
  )
}

function check(
  content: string | undefined,
  userId: string | undefined,
  blocked: Set<string>
) {
  if (!content || !userId) return

  content = content.toLowerCase()
  const shouldBlock = words.some((word) => content.includes(word))
  data.push({
    author: userId,
    content,
    shouldBlock,
  })

  if (shouldBlock) {
    console.info(`Blocking ${red(userId)}...`)
    if (!blocked.has(userId)) {
      blocked.add(userId)
      octokit.users.block({ username: userId }).catch(() => undefined)
    }
  }
}

;(async () => {
  console.info(`Fetching blocked users...`)
  const blocked = new Set((await getBlocked()).map((user) => user.login))

  console.info(`Fetching issues...`)
  const issues = await getAll(
    async (page) =>
      (
        await octokit.issues.listForRepo({
          owner: 'facebook',
          repo: 'react',
          page,
          per_page: 100,
          since: '2022-03-03T04:00:00Z',
        })
      ).data,
    100
  )

  for (const [i, issue] of issues.entries()) {
    if (issue.comments > 0) {
      console.info(
        `Fetching issue ${blue(
          `#${issue.number}`
        )} (https://github.com/facebook/react/issues/${
          issue.number
        }) comments... (${i + 1} / ${issues.length})`
      )
      const comments = await getAll(
        async () =>
          (
            await octokit.issues.listComments({
              owner: 'facebook',
              repo: 'react',
              issue_number: issue.number,
              per_page: 100,
            })
          ).data ?? [],
        100
      )
      for (const comment of comments) {
        check(comment.body, comment.user?.login, blocked)
      }
    }

    check(`${issue.title} ${issue.body ?? ''}`, issue.user?.login, blocked)
  }

  await writeFile(
    './data/data.json',
    JSON.stringify(data, undefined, 2),
    'utf-8'
  )
})()
