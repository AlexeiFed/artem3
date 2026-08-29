import Link from "next/link";

interface LegalDocumentPageProps {
  title: string;
  body: string;
  entityText: string;
}

export function isLegalSectionHeading(text: string): boolean {
  const trimmed = text.trim();
  return (
    /^\d+\.\s+\S.+$/u.test(trimmed) &&
    !/^\d+\.\d+/u.test(trimmed) &&
    !trimmed.includes("\n")
  );
}

export function LegalDocumentPage({
  title,
  body,
  entityText,
}: LegalDocumentPageProps) {
  const paragraphs = body
    .split(/\n{2,}/u)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <main className="legal-page shell">
      <Link href="/" className="back-link">
        ← На главную
      </Link>
      <p className="eyebrow">Правовая информация</p>
      <h1>{title}</h1>
      <section>
        {paragraphs.map((paragraph, index) =>
          isLegalSectionHeading(paragraph) ? (
            <h2 key={index}>{paragraph}</h2>
          ) : (
            <p key={index}>{paragraph}</p>
          ),
        )}
      </section>
      <p>{entityText}</p>
    </main>
  );
}
