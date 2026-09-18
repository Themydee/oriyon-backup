import Hero from '@/components/about/heroSection';
import MissionVision from '@/components/about/mission';
import Model from '@/components/about/model';
import RumerSection from '@/components/about/rumer';
import BusinessImpactSection from '@/components/about/businessImpact';
import FarmServices from '@/components/about/services';
import Newsletter from '@/components/layout/newsletter';
import React from 'react';

const AboutPage = () => {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <MissionVision />
      <Model />
      <RumerSection />
      <BusinessImpactSection />
      <FarmServices />
      <Newsletter />
    </main>
  );
};

export default AboutPage;
