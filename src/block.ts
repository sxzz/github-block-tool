import { readFile } from 'fs/promises'
import path from 'path'
import { red } from 'colorette'
import { getBlocked, octokit } from './lib/fetch'
import type { User } from './lib/types'

async function main() {
  let data = JSON.parse(
    await readFile(path.resolve(__dirname, '../analyze.json'), 'utf-8')
  ) as User[]

  data = data.sort((a, b) => b.weight - a.weight)

  const blocks = await getBlocked()

  data.forEach((user) => {
    const blocked = blocks.some((_user) => _user.id === user.userId)
    if (user.weight >= 10) {
      if (blocked) {
        console.info(`Blocked @${red(user.username)}...`)
      } else {
        // Block!
        console.info(`Blocking @${red(user.username)}...`)
        octokit.users.block({ username: user.username }).catch(() => undefined)
      }
    } else if (blocked) {
      console.info(`Unblocking @${red(user.username)}...`)
      octokit.users.unblock({ username: user.username }) //.catch(() => undefined)
    }
  })
}

main()
