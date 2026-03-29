import { type Locale, getDictionary } from "@/lib/i18n";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  return (
    <div className="py-unit-2">
      <h1 className="font-sans text-2xl font-medium leading-snug text-ink mb-unit">
        /notes
      </h1>
      <div className="border-t border-grid pt-unit">
        <p className="font-serif text-base text-ink-light leading-[1.7]">
          {dict.allPosts}
        </p>
      </div>
    </div>
  );
}
