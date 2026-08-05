import {
  CasesStack,
  HonestyBanner,
  Reviews,
  Workflow,
} from "@/components/site/ContentSections";
import { Contacts, FloatingActions } from "@/components/site/Contacts";
import { ContractXRay } from "@/components/site/ContractXRay";
import { Faq } from "@/components/site/Faq";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { LegalServiceJsonLd } from "@/components/site/LegalServiceJsonLd";
import { QuickAccess } from "@/components/site/QuickAccess";
import { ServicesSection } from "@/components/site/ServicesSection";
import { getPublicEnv } from "@/lib/env/public";
import { getLandingPageData } from "@/modules/content/preview-landing-data";

export default async function HomePage() {
  const data = await getLandingPageData();
  const { NEXT_PUBLIC_YANDEX_MAPS_API_KEY: yandexMapsApiKey } = getPublicEnv();

  return (
    <>
      <LegalServiceJsonLd contacts={data.contacts} />
      <Header
        data={data.header}
        address={data.contacts.address}
        workHours={data.contacts.workHours}
        hoursNote={data.contacts.hoursNote}
        serviceLinks={data.quickLinks}
      />
      <main>
        <Hero data={data.hero} />
        <QuickAccess items={data.quickLinks} />
        <ContractXRay data={data.hiddenRisks} />
        <ServicesSection
          services={data.services}
          intro={data.servicesIntro}
        />
        <Workflow consultation={data.consultation} workflow={data.workflow} />
        <HonestyBanner data={data.honesty} />
        <CasesStack cases={data.cases} />
        <Reviews
          ratings={data.ratings}
          reviews={data.reviews}
          certificates={data.certificates}
        />
        <Faq items={data.faqs} />
        <Contacts
          contacts={data.contacts}
          legal={data.legal}
          yandexMapsApiKey={yandexMapsApiKey}
        />
      </main>
      <FloatingActions contacts={data.contacts} />
    </>
  );
}
