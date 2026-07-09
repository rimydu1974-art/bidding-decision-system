-- PostgreSQL schema generated from Prisma schema
-- Bidding Decision System

-- =====================================================
-- Users table
-- =====================================================
CREATE TABLE "User" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" text NOT NULL UNIQUE,
    "name" text,
    "password" text NOT NULL,
    "phone" text,
    "wechatOpenId" text UNIQUE,
    "avatar" text,
    "role" text NOT NULL DEFAULT 'user',
    "status" text NOT NULL DEFAULT 'active',
    "plan" text NOT NULL DEFAULT 'free',
    "planExpiresAt" timestamp(3),
    "tempExpiresAt" timestamp(3),
    "aiQuotaUsed" integer NOT NULL DEFAULT 0,
    "aiQuotaResetAt" timestamp(3) NOT NULL DEFAULT now(),
    "userApiKey" text,
    "userApiProvider" text,
    "apiKeyVerified" boolean NOT NULL DEFAULT false,
    "feishuConnected" boolean NOT NULL DEFAULT false,
    "feishuSpaceId" text,
    "feishuSpaceName" text,
    "feishuLastSyncAt" timestamp(3),
    "totalAiCalls" integer NOT NULL DEFAULT 0,
    "totalOrders" integer NOT NULL DEFAULT 0,
    "totalSpent" double precision NOT NULL DEFAULT 0,
    "lastLoginAt" timestamp(3),
    "lastAiUsageAt" timestamp(3),
    "lastPaymentAt" timestamp(3),
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

-- =====================================================
-- Sessions table
-- =====================================================
CREATE TABLE "Session" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "token" text NOT NULL UNIQUE,
    "expiresAt" timestamp(3) NOT NULL,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Assessments table
-- =====================================================
CREATE TABLE "Assessment" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "projectName" text NOT NULL,
    "projectCode" text,
    "budget" double precision NOT NULL DEFAULT 0,
    "riskLevel" text NOT NULL DEFAULT 'medium',
    "recommendation" text NOT NULL DEFAULT 'caution',
    "fileName" text NOT NULL,
    "fileContent" text,
    "aiResult" text NOT NULL DEFAULT '{}',
    "basicInfo" text NOT NULL DEFAULT '{}',
    "risks" text NOT NULL DEFAULT '[]',
    "tasks" text NOT NULL DEFAULT '[]',
    "scoringRules" text NOT NULL DEFAULT '{}',
    "qualificationReqs" text NOT NULL DEFAULT '[]',
    "technicalResponse" text NOT NULL DEFAULT '[]',
    "riskAggregation" text NOT NULL DEFAULT '{}',
    "bidDeadline" timestamp(3),
    "bidOpeningTime" timestamp(3),
    "queryDeadline" timestamp(3),
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- KnowledgeItems table
-- =====================================================
CREATE TABLE "KnowledgeItem" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "title" text NOT NULL,
    "category" text NOT NULL DEFAULT '未分类',
    "subcategory" text,
    "content" text NOT NULL DEFAULT '',
    "tags" text NOT NULL DEFAULT '[]',
    "fileType" text NOT NULL DEFAULT 'text',
    "fileName" text,
    "fileUrl" text,
    "source" text NOT NULL DEFAULT 'manual',
    "sourceId" text,
    "metadata" text NOT NULL DEFAULT '{}',
    "usageCount" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "KnowledgeItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Projects table
-- =====================================================
CREATE TABLE "Project" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "industry" text,
    "status" text NOT NULL DEFAULT 'active',
    "hasBidAnalysis" boolean NOT NULL DEFAULT false,
    "members" text NOT NULL DEFAULT '[]',
    "tasks" text NOT NULL DEFAULT '[]',
    "metadata" text NOT NULL DEFAULT '{}',
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- PricingPlans table
-- =====================================================
CREATE TABLE "PricingPlan" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" text NOT NULL,
    "displayName" text NOT NULL,
    "price" double precision NOT NULL,
    "period" text NOT NULL DEFAULT 'month',
    "description" text,
    "features" text NOT NULL DEFAULT '[]',
    "highlight" boolean NOT NULL DEFAULT false,
    "sortOrder" integer NOT NULL DEFAULT 0,
    "isActive" boolean NOT NULL DEFAULT true,
    "metadata" text NOT NULL DEFAULT '{}',
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

-- =====================================================
-- Orders table
-- =====================================================
CREATE TABLE "Order" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "orderNo" text NOT NULL UNIQUE,
    "planName" text NOT NULL,
    "projectId" text,
    "amount" double precision NOT NULL,
    "paymentMethod" text,
    "paymentStatus" text NOT NULL DEFAULT 'pending',
    "paidAt" timestamp(3),
    "expiresAt" timestamp(3) NOT NULL,
    "metadata" text NOT NULL DEFAULT '{}',
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- ProjectUnlocks table
-- =====================================================
CREATE TABLE "ProjectUnlock" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "projectId" text NOT NULL,
    "amount" double precision NOT NULL DEFAULT 19,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "ProjectUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectUnlock_userId_projectId_key" UNIQUE ("userId", "projectId")
);

-- =====================================================
-- PasswordResets table
-- =====================================================
CREATE TABLE "PasswordReset" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" text NOT NULL,
    "token" text NOT NULL UNIQUE,
    "expiresAt" timestamp(3) NOT NULL,
    "used" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "PasswordReset_email_idx" ON "PasswordReset"("email");
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");

-- =====================================================
-- AIUsages table
-- =====================================================
CREATE TABLE "AIUsage" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "model" text NOT NULL,
    "promptTokens" integer NOT NULL DEFAULT 0,
    "completionTokens" integer NOT NULL DEFAULT 0,
    "totalTokens" integer NOT NULL DEFAULT 0,
    "cost" double precision NOT NULL DEFAULT 0,
    "useUserApiKey" boolean NOT NULL DEFAULT false,
    "fileHash" text,
    "projectId" text,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "AIUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AIUsage_userId_idx" ON "AIUsage"("userId");
CREATE INDEX "AIUsage_model_idx" ON "AIUsage"("model");
CREATE INDEX "AIUsage_createdAt_idx" ON "AIUsage"("createdAt");

-- =====================================================
-- UserBehaviors table
-- =====================================================
CREATE TABLE "UserBehavior" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "action" text NOT NULL,
    "projectId" text,
    "metadata" text NOT NULL DEFAULT '{}',
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "UserBehavior_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UserBehavior_userId_idx" ON "UserBehavior"("userId");
CREATE INDEX "UserBehavior_action_idx" ON "UserBehavior"("action");
CREATE INDEX "UserBehavior_createdAt_idx" ON "UserBehavior"("createdAt");

-- =====================================================
-- FileHashes table
-- =====================================================
CREATE TABLE "FileHash" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "hash" text NOT NULL UNIQUE,
    "fileName" text NOT NULL,
    "fileSize" integer NOT NULL,
    "projectId" text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "FileHash_hash_idx" ON "FileHash"("hash");

-- =====================================================
-- UserFeedbacks table
-- =====================================================
CREATE TABLE "UserFeedback" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "reason" text NOT NULL,
    "content" text,
    "page" text NOT NULL,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "UserFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UserFeedback_userId_idx" ON "UserFeedback"("userId");

-- =====================================================
-- SystemSettings table
-- =====================================================
CREATE TABLE "SystemSetting" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "key" text NOT NULL UNIQUE,
    "value" text NOT NULL,
    "category" text NOT NULL DEFAULT 'general',
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

-- =====================================================
-- ProjectIndustries table
-- =====================================================
CREATE TABLE "ProjectIndustry" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "industry" text NOT NULL UNIQUE,
    "count" integer NOT NULL DEFAULT 0,
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

-- =====================================================
-- RuleConfigs table
-- =====================================================
CREATE TABLE "RuleConfig" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "category" text NOT NULL,
    "name" text NOT NULL,
    "keywords" text NOT NULL DEFAULT '[]',
    "patterns" text NOT NULL DEFAULT '[]',
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "RuleConfig_category_idx" ON "RuleConfig"("category");

-- =====================================================
-- ExtractionLogs table
-- =====================================================
CREATE TABLE "ExtractionLog" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "assessmentId" text NOT NULL,
    "userId" text NOT NULL,
    "ruleResult" text NOT NULL DEFAULT '{}',
    "aiResult" text NOT NULL DEFAULT '{}',
    "discrepancies" text NOT NULL DEFAULT '[]',
    "extractionTime" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "ExtractionLog_assessmentId_idx" ON "ExtractionLog"("assessmentId");
CREATE INDEX "ExtractionLog_userId_idx" ON "ExtractionLog"("userId");

-- =====================================================
-- PaymentOrders table
-- =====================================================
CREATE TABLE "PaymentOrder" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderNo" text NOT NULL UNIQUE,
    "userEmail" text NOT NULL,
    "planName" text NOT NULL,
    "projectId" text,
    "amount" double precision NOT NULL,
    "paymentMethod" text,
    "paymentStatus" text NOT NULL DEFAULT 'pending',
    "screenshotUrl" text,
    "reviewedAt" timestamp(3),
    "reviewedBy" text,
    "reviewNote" text,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "PaymentOrder_orderNo_idx" ON "PaymentOrder"("orderNo");
CREATE INDEX "PaymentOrder_userEmail_idx" ON "PaymentOrder"("userEmail");
CREATE INDEX "PaymentOrder_paymentStatus_idx" ON "PaymentOrder"("paymentStatus");

-- =====================================================
-- AdminNotifications table
-- =====================================================
CREATE TABLE "AdminNotification" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "type" text NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "orderId" text,
    "isRead" boolean NOT NULL DEFAULT false,
    "readAt" timestamp(3),
    "createdAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "AdminNotification_isRead_idx" ON "AdminNotification"("isRead");
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- =====================================================
-- Materials table (Layer 1: Enterprise Material Library)
-- =====================================================
CREATE TABLE "Material" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "title" text NOT NULL,
    "category" text NOT NULL,
    "content" text NOT NULL DEFAULT '',
    "tags" text NOT NULL DEFAULT '[]',
    "fileType" text NOT NULL DEFAULT 'text',
    "fileName" text,
    "fileUrl" text,
    "metadata" text NOT NULL DEFAULT '{}',
    "usageCount" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "Material_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Material_userId_idx" ON "Material"("userId");
CREATE INDEX "Material_category_idx" ON "Material"("category");

-- =====================================================
-- IndustryRules table (Layer 2: Industry Rule Library)
-- =====================================================
CREATE TABLE "IndustryRule" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "category" text NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "industry" text,
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "IndustryRule_category_idx" ON "IndustryRule"("category");
CREATE INDEX "IndustryRule_industry_idx" ON "IndustryRule"("industry");

-- =====================================================
-- ScoringRules table (Layer 3: Scoring Rule Library)
-- =====================================================
CREATE TABLE "ScoringRule" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "category" text NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "industry" text,
    "weight" double precision NOT NULL DEFAULT 0,
    "maxScore" double precision NOT NULL DEFAULT 100,
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "ScoringRule_category_idx" ON "ScoringRule"("category");
CREATE INDEX "ScoringRule_industry_idx" ON "ScoringRule"("industry");

-- =====================================================
-- WasteRules table (Layer 4: Waste/Bid Rejection Rule Library)
-- =====================================================
CREATE TABLE "WasteRule" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "category" text NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "industry" text,
    "severity" text NOT NULL DEFAULT 'critical',
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "WasteRule_category_idx" ON "WasteRule"("category");
CREATE INDEX "WasteRule_industry_idx" ON "WasteRule"("industry");

-- =====================================================
-- Cases table (Layer 5: Case Center)
-- =====================================================
CREATE TABLE "Case" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" text NOT NULL,
    "source" text NOT NULL,
    "industry" text,
    "content" text NOT NULL,
    "summary" text,
    "status" text NOT NULL DEFAULT 'published',
    "isPublic" boolean NOT NULL DEFAULT false,
    "expertComment" text,
    "tags" text NOT NULL DEFAULT '[]',
    "views" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "Case_source_idx" ON "Case"("source");
CREATE INDEX "Case_status_idx" ON "Case"("status");
CREATE INDEX "Case_isPublic_idx" ON "Case"("isPublic");

-- =====================================================
-- CaseSubmissions table
-- =====================================================
CREATE TABLE "CaseSubmission" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL,
    "title" text NOT NULL,
    "industry" text,
    "content" text NOT NULL,
    "anonymized" text,
    "status" text NOT NULL DEFAULT 'pending',
    "rejectReason" text,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now(),
    CONSTRAINT "CaseSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CaseSubmission_userId_idx" ON "CaseSubmission"("userId");
CREATE INDEX "CaseSubmission_status_idx" ON "CaseSubmission"("status");

-- =====================================================
-- ThinkTankArticles table (Layer 6: Bidding Think Tank)
-- =====================================================
CREATE TABLE "ThinkTankArticle" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "category" text NOT NULL,
    "content" text NOT NULL,
    "summary" text,
    "tags" text NOT NULL DEFAULT '[]',
    "coverImage" text,
    "isPublished" boolean NOT NULL DEFAULT false,
    "views" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "ThinkTankArticle_slug_idx" ON "ThinkTankArticle"("slug");
CREATE INDEX "ThinkTankArticle_category_idx" ON "ThinkTankArticle"("category");
CREATE INDEX "ThinkTankArticle_isPublished_idx" ON "ThinkTankArticle"("isPublished");

-- =====================================================
-- Regulations table
-- =====================================================
CREATE TABLE "Regulation" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" text NOT NULL,
    "region" text NOT NULL,
    "category" text NOT NULL,
    "content" text NOT NULL,
    "sourceFile" text,
    "publishDate" text,
    "isActive" boolean NOT NULL DEFAULT true,
    "views" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp(3) NOT NULL DEFAULT now(),
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX "Regulation_region_idx" ON "Regulation"("region");
CREATE INDEX "Regulation_category_idx" ON "Regulation"("category");
