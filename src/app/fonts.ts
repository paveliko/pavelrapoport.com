import localFont from "next/font/local";

export const inter = localFont({
  src: "./fonts/inter-var.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

export const lora = localFont({
  src: [
    { path: "./fonts/lora-var.woff2", style: "normal" },
    { path: "./fonts/lora-italic-var.woff2", style: "italic" },
  ],
  variable: "--font-lora",
  display: "swap",
  weight: "400 700",
});

export const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-var.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: "100 800",
});
