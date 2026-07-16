import Link from "next/link";

interface LegalDocumentPageProps {
  title: string;
  body: string;
  entityText: string;
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
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </section>
      <p>{entityText}</p>
    </main>
  );
}
