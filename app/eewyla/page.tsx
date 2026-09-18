import Apply from '@/components/eewyla/apply'
import Hero from '@/components/eewyla/heroSection'
import How from '@/components/eewyla/how'
import Partners from '@/components/eewyla/partners'
import Newsletter from '@/components/layout/newsletter'
import React from 'react'

const page = () => {
  return (
    <div>
      <Hero />
      <How />
      <Partners />
      <Apply />
      <Newsletter />
    </div>
  )
}

export default page
