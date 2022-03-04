import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { green } from 'colorette'
import words from './words.json'
import whitelist from './whitelist.json'
import type { Issue, Word, User } from './lib/types'

const users = new Map<number, User>() // userId -> user

function analyzeUser(
  userId: number,
  username: string,
  content: string,
  baseWeight: number
) {
  let user: User
  if (users.has(userId)) user = users.get(userId)!
  else user = { userId, username, weight: 0 }

  let weight = 0
  if (!whitelist.includes(username)) {
    weight = (words as Word[])
      .filter(([word]) => content.toLowerCase().includes(word.toLowerCase()))
      .map(([, weight]) => weight)
      .reduce((prev, curr) => prev + curr, 0)
    user.weight += baseWeight * weight
  }

  users.set(userId, user)
}

async function main() {
  const data = JSON.parse(
    await readFile(path.resolve(__dirname, '../data.json'), 'utf-8')
  ) as Issue[]

  for (const issue of data) {
    for (const comment of issue.comments) {
      comment.userId &&
        comment.username &&
        analyzeUser(comment.userId, comment.username, comment.content, 1)
    }

    issue.userId &&
      issue.username &&
      analyzeUser(
        issue.userId,
        issue.username,
        issue.title + issue.content,
        1.5
      )
  }

  const weights = Array.from(users.values())
  weights.sort((a, b) => b.weight - a.weight)

  console.info(green('Data saved successfully.'))
  await writeFile('./analyze.json', JSON.stringify(weights, undefined, 2))
}

main()
