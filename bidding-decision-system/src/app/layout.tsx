import type { Metadata } from "next";
import { Geist, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { LOW_PRICE, HIGH_PRICE, OFFER_COUNT } from "@/lib/pricing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.opencheck.com.cn"),
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
    url: "https://www.opencheck.com.cn",
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
    canonical: "https://www.opencheck.com.cn",
  },
  verification: {},
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "投标AI - 智能投标决策支持系统",
  url: "https://www.opencheck.com.cn",
  description:
    "3分钟生成投标决策评估表，AI智能分析招标文件，提前发现废标风险，自动评分预测，AI标书生成。",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  author: {
    "@type": "Organization",
    name: "OpenCheck",
    url: "https://www.opencheck.com.cn",
  },
  offers: {
    "@type": "AggregateOffer",
    lowPrice: String(LOW_PRICE),
    highPrice: String(HIGH_PRICE),
    priceCurrency: "CNY",
    offerCount: OFFER_COUNT,
  },
  featureList: [
    "AI招标文件分析",
    "投标风险评估",
    "评分预测",
    "AI标书生成",
    "企业知识库",
    "项目管理",
  ],
  screenshot: "https://www.opencheck.com.cn/og-image.png",
  softwareVersion: "1.0",
  datePublished: "2026-06-20",
  dateModified: "2026-07-09",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "什么是投标决策支持系统？", acceptedAnswer: { "@type": "Answer", text: "投标决策支持系统是一种AI驱动的工具，通过自动分析招标文件，提取关键信息，评估废标风险，预测评分，帮助企业快速做出是否投标的决策。" } },
    { "@type": "Question", name: "如何快速分析招标文件？", acceptedAnswer: { "@type": "Answer", text: "使用投标AI平台，上传招标文件（PDF/Word），AI自动解析项目名称、预算、资质要求、评分规则、废标条件等关键信息，3分钟生成投标决策评估表。" } },
    { "@type": "Question", name: "常见的废标原因有哪些？", acceptedAnswer: { "@type": "Answer", text: "常见废标原因包括：投标文件未按要求密封、未按时提交、资质不符、报价超出限价、技术方案不满足实质性要求、签字盖章不全、联合体协议缺失等。" } },
    { "@type": "Question", name: "投标评分是怎么计算的？", acceptedAnswer: { "@type": "Answer", text: "投标评分通常由价格分（30-60%）、商务分（10-20%）、技术分（30-60%）组成。价格分按最低价为基准计算，商务分考核企业资质和业绩，技术分评估技术方案和人员配置。" } },
    { "@type": "Question", name: "什么样的项目不建议投标？", acceptedAnswer: { "@type": "Answer", text: "以下情况不建议投标：废标风险高（如资质不满足实质性要求）、预算过低无法覆盖成本、技术难度超出能力范围、竞争对手实力明显占优、招标文件存在明显控标点。" } },
    { "@type": "Question", name: "AI如何帮助做标书？", acceptedAnswer: { "@type": "Answer", text: "投标AI平台可以自动生成技术标和商务标框架，基于招标文件要求提取关键条款，智能填充公司资质、业绩案例、技术方案等内容，大幅减少标书编写时间。" } },
    { "@type": "Question", name: "投标前需要做哪些准备？", acceptedAnswer: { "@type": "Answer", text: "投标前需要：1）获取并仔细阅读招标文件；2）评估资质是否满足实质性要求；3）核算成本和利润空间；4）研究竞争对手；5）准备投标保证金和资质材料；6）组建投标团队并明确分工。" } },
    { "@type": "Question", name: "什么是联合体投标？", acceptedAnswer: { "@type": "Answer", text: "联合体投标是指两个以上法人或其他组织组成联合体，以一个投标人的身份共同投标。联合体各方需签订共同投标协议，明确牵头方和各自分工，并共同承担连带责任。" } },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="canonical" href="https://www.opencheck.com.cn" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
