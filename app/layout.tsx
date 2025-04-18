
import "../styles/globals.css";
import React from "react";

export const metadata = {
  title: "Eco Survey",
  description: "Инженерные изыскания",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
