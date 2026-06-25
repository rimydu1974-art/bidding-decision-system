import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bidding-decision-system.vercel.app"),
  title: {
    default: "投标AI - 智能投标决策支持系统 | AI标书生成 | 风险评估",
    template: "%s | 投标AI - 智能投标决策支持系统",
  },
  description:
    "3分钟生成投标决策评估表，AI智能分析招标文件，提前发现废标风险，自动评分预测，AI标书生成，企业知识库管理。面向投标企业老板的智能投标工具。",
  keywords: [
    "投标",
    "招标",
    "投标决策",
    "招标分析",
    "AI标书",
    "标书生成",
    "投标风险评估",
    "评分预测",
    "投标工具",
    "招标文件分析",
    "废标风险",
    "投标助手",
    "智能投标",
    "投标AI",
    "标书编写",
  ],
  authors: [{ name: "投标AI" }],
  creator: "投标AI",
  publisher: "投标AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://bidding-decision-system.vercel.app",
    siteName: "投标AI - 智能投标决策支持系统",
    title: "投标AI - 3分钟生成投标决策评估，提前发现废标风险",
    description:
      "AI智能分析招标文件，自动识别风险点，评分预测，标书生成。面向投标企业老板的智能投标工具。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "投标AI - 智能投标决策支持系统",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "投标AI - 智能投标决策支持系统",
    description: "3分钟生成投标决策评估表，AI智能分析招标文件，提前发现废标风险",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://bidding-decision-system.vercel.app",
  },
  verification: {},
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "投标AI - 智能投标决策支持系统",
  url: "https://bidding-decision-system.vercel.app",
  description:
    "3分钟生成投标决策评估表，AI智能分析招标文件，提前发现废标风险，自动评分预测，AI标书生成。",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "299",
    priceCurrency: "CNY",
    offerCount: 3,
  },
  featureList: [
    "AI招标文件分析",
    "投标风险评估",
    "评分预测",
    "AI标书生成",
    "企业知识库",
    "项目管理",
  ],
  screenshot: "https://bidding-decision-system.vercel.app/screenshot.png",
  softwareVersion: "1.0",
  datePublished: "2026-06-20",
  dateModified: "2026-06-25",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="canonical" href="https://bidding-decision-system.vercel.app" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
