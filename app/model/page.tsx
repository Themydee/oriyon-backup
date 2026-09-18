import Newsletter from '@/components/layout/newsletter'
import Hero from '@/components/model/heroSection'
import Model from '@/components/model/model'
import Why from '@/components/model/why'
import React from 'react'

const page = () => {
  return (
    <div>
      <Hero />
      <Model />
      <Why />
      <Newsletter />
    </div>
  )
}

export default page
