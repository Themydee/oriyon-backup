import FAQ from '@/components/home/faq'
import Hero from '@/components/home/heroSection'
import KeyMessaging from '@/components/home/keyMessaging'
import OurSolutions from '@/components/home/ourSolutions'
import LaunchShowcase from '@/components/home/LaunchShowcase'
import Partners from '@/components/home/partners'
import ProblemSection from '@/components/home/problemSection'
import StatsBar from '@/components/home/statsBar'
import Testimonials from '@/components/home/testimonials'
import Newsletter from '@/components/layout/newsletter'
import React from 'react'

const page = () => {
  return (
    <div>
      <Hero />
      <StatsBar />
      <ProblemSection />
      <KeyMessaging />
      <OurSolutions />
      <LaunchShowcase />
      <Partners />
      <Testimonials />
      <FAQ />
      <Newsletter />
    </div>
  )
}

export default page
