import PageClient from './page.client'

export const runtime = 'edge'

export default async function Page() {
  return <PageClient />
}