import Newsletter from '@/components/layout/newsletter'
import Apply from '@/components/learn/training/apply'
import ShortCourses from '@/components/learn/training/courses'
import Hero from '@/components/learn/training/hero'
import React from 'react'

const page = () => {
  return (
    <div>
      <Hero />
      <Apply />
      <ShortCourses />
      <Newsletter />
    </div>
  )
}

export default page
