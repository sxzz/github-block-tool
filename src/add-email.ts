import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { octokit } from './lib/fetch'
import type { User } from './lib/types'

async function main() {
  const users = JSON.parse(
    await readFile(path.resolve(__dirname, '../analyze.json'), 'utf-8')
  ) as User[]

  for (const [i, user] of users.entries()) {
    console.log(i)
    const _user = await octokit.users.getByUsername({
      username: user.username,
    })
    if (_user.data.email) {
      users[i].email = _user.data.email as string
    }
  }

  writeFile('./analyze.json', JSON.stringify(users, undefined, 2), 'utf-8')
}

main()
