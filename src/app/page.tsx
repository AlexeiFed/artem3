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
import { QuickAccess } from "@/components/site/QuickAccess";
import { ServicesSection } from "@/components/site/ServicesSection";
import { getLandingPageData } from "@/modules/content/preview-landing-data";

export default async function HomePage() {
  const data = await getLandingPageData();

  return (
    <>
      {process.env.NODE_ENV === "development" ? (
        <span className="preview-marker">Preview content</span>
      ) : null}
      <Header data={data.header} />
      <main>
        <Hero data={data.hero} />
        <QuickAccess items={data.quickLinks} />
        <ContractXRay data={data.hiddenRisks} />
        <ServicesSection services={data.services} />
        <Workflow consultation={data.consultation} workflow={data.workflow} />
        <HonestyBanner data={data.honesty} />
        <CasesStack cases={data.cases} />
        <Reviews
          ratings={data.ratings}
          reviews={data.reviews}
          certificates={data.certificates}
        />
        <Faq items={data.faqs} />
        <Contacts contacts={data.contacts} legal={data.legal} />
      </main>
      <FloatingActions contacts={data.contacts} />
    </>
  );
}
