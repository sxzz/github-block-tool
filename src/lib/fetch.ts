import { Octokit } from '@octokit/rest'
import { getAll } from '../lib/utils'

export const octokit = new Octokit({
  auth: process.env.TOKEN,
})

export const owner = 'facebook'
export const repo = 'react'
export const per_page = 100

export const getIssues = () => {
  return getAll(
    async (page) =>
      (
        await octokit.issues.listForRepo({
          owner,
          repo,
          page,
          per_page,
          since: '2022-03-03T04:00:00Z',
          state: 'all',
        })
      ).data.filter((item) => item.number <= 23988),
    per_page
  )
}

export const getComments = (issue_number: number) =>
  getAll(
    async () =>
      (
        await octokit.issues.listComments({
          owner,
          repo,
          issue_number,
          per_page,
        })
      ).data ?? [],
    per_page
  )

export const getBlocked = () => {
  return getAll(
    async (page) =>
      (
        await octokit.users.listBlockedByAuthenticatedUser({
          page,
          per_page,
        })
      ).data ?? [],
    per_page
  )
}
