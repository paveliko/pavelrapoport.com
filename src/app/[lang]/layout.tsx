import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import { LangSetter } from "@/components/LangSetter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GridOverlay } from "@/components/GridOverlay";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  return {
    title: {
      default: `${dict.footer} — ${dict.title}`,
      template: `%s — ${dict.footer}`,
    },
    description: dict.title,
    openGraph: {
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "en_US",
      siteName: dict.footer,
    },
    alternates: {
      languages: {
        ru: "/ru",
        en: "/en",
      },
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;

  return (
    <>
      <LangSetter lang={lang} />
      <Header lang={locale} />
      <main className="flex-1 max-w-(--container-content) w-full mx-auto px-6 md:px-12">
        {children}
      </main>
      <Footer lang={locale} />
      {process.env.NODE_ENV === "development" && <GridOverlay />}
    </>
  );
}
