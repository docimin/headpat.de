import { Button } from '@/components/ui/button'
import { Link } from '@/navigation'
import MfaPageClient from '@/app/[locale]/(auth)/login/mfa/page.client'

export const metadata = {
  title: 'Login',
  description: 'Login or Register to your account.',
  keywords: 'login, account, sign in, register',
}

export const runtime = 'edge'

export default async function Page() {
  return (
    <>
      <Link href={'/'} className={'absolute top-8 left-8 z-10'}>
        <Button>Home</Button>
      </Link>
      <MfaPageClient />
    </>
  )
}
