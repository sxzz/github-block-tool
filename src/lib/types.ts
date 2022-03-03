export interface Issue {
  id: number
  number: number
  userId: number | undefined
  username: string | undefined
  title: string
  content: string
  comments: Comment[]
}

export interface Comment {
  id: number
  userId: number | undefined
  username: string | undefined
  content: string
}

export type Word = [string, number]

export interface User {
  userId: number
  username: string
  weight: number
}
