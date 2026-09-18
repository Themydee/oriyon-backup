import Hero from '@/components/teams/heroSection'
import Team from '@/components/teams/team'
import Board from '@/components/teams/board'
import Newsletter from '@/components/layout/newsletter'
import React from 'react'

const page = () => {
  return (
    <div>
      <Hero />
      <Team />
      <Board />
      <Newsletter />
    </div>
  )
}

export default page
