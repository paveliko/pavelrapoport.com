import { type Locale, getDictionary } from "@/lib/i18n";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);

  return (
    <div className="py-unit-2">
      <h1 className="font-sans text-[2rem] font-semibold leading-tight text-ink mb-2">
        {dict.footer}
      </h1>
      <p className="font-sans text-lg text-muted mb-unit-2">
        {dict.title}
      </p>
      <div className="border-t border-grid pt-unit">
        <p className="font-serif text-base text-ink-light leading-[1.7]">
          {dict.allPosts}
        </p>
      </div>
    </div>
  );
}
