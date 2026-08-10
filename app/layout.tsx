import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ipsos Intelligence Foundry",
  description: "Ipsos 消费者模型与决策中台：行业模型、客户空间、证据与结果回流。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Ipsos Intelligence Foundry",
    description: "消费者模型、证据与决策产品中台。",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Intelligence Foundry" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
