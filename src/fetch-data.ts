import { writeFile } from 'fs/promises'
import { blue } from 'colorette'
import { getComments, getIssues, owner, repo } from './lib/fetch'
import type { Comment, Issue } from './lib/types'

async function main() {
  console.info(`Fetching issues...`)

  const issues = await getIssues()

  const data = await Promise.all(
    Array.from(issues.entries()).map(async ([i, issue]): Promise<Issue> => {
      const comments: Comment[] = []
      if (issue.comments > 0) {
        console.info(
          `Fetching issue ${blue(
            `#${issue.number}`
          )} (https://github.com/${owner}/${repo}/issues/${
            issue.number
          }) comments... (${i + 1} / ${issues.length})`
        )
        const _comments: Comment[] = (await getComments(issue.number)).map(
          (comment) => {
            return {
              id: comment.id,
              userId: comment.user?.id,
              username: comment.user?.login,
              content: comment.body ?? '',
            }
          }
        )
        comments.push(..._comments)
      }

      return {
        id: issue.id,
        number: issue.number,
        userId: issue.user?.id,
        username: issue.user?.login,
        title: issue.title,
        content: issue.body ?? '',
        comments,
      }
    })
  )

  console.info(`Writing data...`)
  await writeFile('./data.json', JSON.stringify(data, undefined, 2), 'utf-8')
}

main()
