import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ipsos Consumer Intelligence",
  description: "Ipsos 消费者洞察与模型平台：客户项目、研究数据、预测模型与决策应用。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Ipsos Consumer Intelligence",
    description: "消费者洞察、预测模型与决策应用。",
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
