'use client'

import { Suspense } from 'react'
import OnboardingChat from '@/components/OnboardingChat'
import Nav from '@/components/Nav'

export default function JoinPage() {
  return (
    <>
      <Nav user={null} />
      <Suspense>
        <OnboardingChat />
      </Suspense>
    </>
  )
}
