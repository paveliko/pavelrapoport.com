import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { routing } from "@repo/i18n/routing";
import { inter, lora, jetbrainsMono } from "../fonts";
import "../globals.css";
import { Footer } from "@/components/Footer";
import { GridOverlay } from "@/components/GridOverlay";
import { AxeInit } from "@/components/dev/AxeInit";
import { BreakpointIndicator } from "@/components/dev/BreakpointIndicator";

type Params = { locale: string };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web" });

  const ogLocale =
    locale === "ru" ? "ru_RU" : locale === "ro" ? "ro_RO" : "en_US";

  return {
    title: {
      default: `${t("footer")} — ${t("title")}`,
      template: `%s — ${t("footer")}`,
    },
    description: t("title"),
    openGraph: {
      type: "website",
      locale: ogLocale,
      siteName: t("footer"),
    },
    alternates: {
      languages: {
        en: "/en",
        ru: "/ru",
        ro: "/ro",
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir="ltr"
      className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground font-serif">
        <NextIntlClientProvider messages={messages}>
          <main className="flex-1 flex max-w-(--container-content) w-full mx-auto px-6 md:px-12">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
        {process.env.NODE_ENV === "development" && <GridOverlay />}
        {process.env.NODE_ENV === "development" && <BreakpointIndicator />}
        {process.env.NODE_ENV === "development" && <AxeInit />}
      </body>
    </html>
  );
}
