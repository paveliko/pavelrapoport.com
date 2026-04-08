import { describe, it, expect } from "vitest";
import { locales, defaultLocale, categories } from "../config";
import fs from "node:fs";
import path from "node:path";

const messagesDir = path.resolve(__dirname, "../../messages");

describe("@repo/i18n config", () => {
  it("has 3 locales: en, ru, he", () => {
    expect(locales).toEqual(["en", "ru", "he"]);
  });

  it("default locale is en", () => {
    expect(defaultLocale).toBe("en");
  });

  it("exports categories", () => {
    expect(categories.length).toBeGreaterThan(0);
  });
});

describe("@repo/i18n messages", () => {
  const messageFiles = ["common.json", "web.json"];

  for (const locale of locales) {
    for (const file of messageFiles) {
      it(`${locale}/${file} is valid JSON`, () => {
        const filePath = path.join(messagesDir, locale, file);
        expect(fs.existsSync(filePath)).toBe(true);
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        expect(Object.keys(content).length).toBeGreaterThan(0);
      });
    }
  }

  it("every key in en/common.json exists in ru/ and he/", () => {
    const enKeys = Object.keys(
      JSON.parse(
        fs.readFileSync(path.join(messagesDir, "en", "common.json"), "utf-8")
      )
    ).sort();

    for (const locale of ["ru", "he"] as const) {
      const localeKeys = Object.keys(
        JSON.parse(
          fs.readFileSync(
            path.join(messagesDir, locale, "common.json"),
            "utf-8"
          )
        )
      ).sort();
      expect(localeKeys).toEqual(enKeys);
    }
  });

  it("every key in en/web.json exists in ru/ and he/", () => {
    const enKeys = Object.keys(
      JSON.parse(
        fs.readFileSync(path.join(messagesDir, "en", "web.json"), "utf-8")
      )
    ).sort();

    for (const locale of ["ru", "he"] as const) {
      const localeKeys = Object.keys(
        JSON.parse(
          fs.readFileSync(
            path.join(messagesDir, locale, "web.json"),
            "utf-8"
          )
        )
      ).sort();
      expect(localeKeys).toEqual(enKeys);
    }
  });
});
