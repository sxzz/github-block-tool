import { writeFile } from 'fs/promises'
import { Octokit } from '@octokit/rest'
import { red, blue } from 'colorette'
import words from './words.json'

interface Datum {
  login: string
  userId: number
  content: string
  shouldBlock: boolean
}

const data: Datum[] = []

const owner = 'facebook'
const repo = 'react'
const perPage = 100

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
          per_page: perPage,
        })
      ).data ?? [],
    perPage
  )
}

function check(
  user: { id: number | null; login: string | null } | null,
  content: string | undefined,
  blocked: Set<string>
) {
  if (!content || !user?.id || !user.login) return

  const shouldBlock = words.some((word) =>
    content.toLowerCase().includes(word.toLowerCase())
  )
  data.push({
    login: user.login,
    userId: user.id,
    content,
    shouldBlock,
  })

  if (shouldBlock) {
    console.info(`Blocking ${red(user.login)}...`)
    if (!blocked.has(user.login)) {
      blocked.add(user.login)
      octokit.users.block({ username: user.login }).catch(() => undefined)
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
          owner,
          repo,
          page,
          per_page: perPage,
          since: '2022-03-03T04:00:00Z',
        })
      ).data,
    perPage
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
              owner,
              repo,
              issue_number: issue.number,
              per_page: perPage,
            })
          ).data ?? [],
        perPage
      )
      for (const comment of comments) {
        check(comment.user, comment.body, blocked)
      }
    }

    check(issue.user, `${issue.title} ${issue.body ?? ''}`, blocked)
  }

  await writeFile('./data.json', JSON.stringify(data, undefined, 2), 'utf-8')
})()
