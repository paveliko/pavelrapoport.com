export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

export const categories = ["build", "signal", "layers", "notes"] as const;
export type Category = (typeof categories)[number];

const dict = {
  ru: {
    title: "Старший фронтенд-инженер",
    footer: "Павел Рапопорт",
    minRead: "мин чтения",
    allPosts: "Все записи",
    back: "Назад",
    prevPost: "Предыдущий пост",
    nextPost: "Следующий пост",
  },
  en: {
    title: "Senior Frontend Engineer",
    footer: "Pavel Rapoport",
    minRead: "min read",
    allPosts: "All posts",
    back: "Back",
    prevPost: "Previous post",
    nextPost: "Next post",
  },
} as const;

export type DictKey = keyof (typeof dict)["en"];

export function getDictionary(locale: Locale) {
  return dict[locale];
}

export function t(locale: Locale, key: DictKey) {
  return dict[locale][key];
}
