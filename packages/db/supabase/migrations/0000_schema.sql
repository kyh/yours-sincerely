CREATE TYPE "public"."TokenType" AS ENUM (
    'REFRESH_TOKEN',
    'VERIFY_EMAIL',
    'RESET_PASSWORD'
);

CREATE TYPE "public"."UserRole" AS ENUM (
    'USER',
    'ADMIN'
);

CREATE TABLE IF NOT EXISTS "public"."Account" (
    "id" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "providerAccountId" "text" NOT NULL,
    "refreshToken" "text",
    "accessToken" "text",
    "expiresAt" integer,
    "userId" "text" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."Block" (
    "blockerId" "text" NOT NULL,
    "blockingId" "text" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."EnrolledEvent" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "start" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "end" timestamp(3) without time zone NOT NULL,
    "userId" "text" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."Flag" (
    "comment" "text",
    "resolved" boolean DEFAULT false NOT NULL,
    "postId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."Like" (
    "postId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."Post" (
    "id" "text" NOT NULL,
    "content" "text" NOT NULL,
    "createdBy" "text",
    "baseLikeCount" integer,
    "parentId" "text",
    "userId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL 
);

CREATE TABLE IF NOT EXISTS "public"."Prompt" (
    "id" "text" NOT NULL,
    "content" "text" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."Token" (
    "id" "text" NOT NULL,
    "token" "text" NOT NULL,
    "type" "public"."TokenType" NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "sentTo" "text",
    "usedAt" timestamp(3) without time zone,
    "userId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" "text" NOT NULL,
    "email" "text",
    "emailVerified" timestamp(3) without time zone,
    "passwordHash" "text",
    "displayName" "text",
    "displayImage" "text",
    "disabled" boolean,
    "weeklyDigestEmail" boolean DEFAULT false NOT NULL,
    "role" "public"."UserRole" DEFAULT 'USER'::"public"."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY "public"."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Block"
    ADD CONSTRAINT "Block_pkey" PRIMARY KEY ("blockerId", "blockingId");

ALTER TABLE ONLY "public"."EnrolledEvent"
    ADD CONSTRAINT "EnrolledEvent_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Flag"
    ADD CONSTRAINT "Flag_pkey" PRIMARY KEY ("postId", "userId");

ALTER TABLE ONLY "public"."Like"
    ADD CONSTRAINT "Like_pkey" PRIMARY KEY ("postId", "userId");

ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Prompt"
    ADD CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Token"
    ADD CONSTRAINT "Token_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account" USING "btree" ("provider", "providerAccountId");

CREATE INDEX "Account_userId_idx" ON "public"."Account" USING "btree" ("userId");

CREATE INDEX "Block_blockerId_idx" ON "public"."Block" USING "btree" ("blockerId");

CREATE INDEX "Block_blockingId_idx" ON "public"."Block" USING "btree" ("blockingId");

CREATE INDEX "EnrolledEvent_userId_idx" ON "public"."EnrolledEvent" USING "btree" ("userId");

CREATE INDEX "Flag_postId_idx" ON "public"."Flag" USING "btree" ("postId");

CREATE INDEX "Flag_postId_userId_idx" ON "public"."Flag" USING "btree" ("postId", "userId");

CREATE INDEX "Flag_userId_idx" ON "public"."Flag" USING "btree" ("userId");

CREATE INDEX "Like_postId_idx" ON "public"."Like" USING "btree" ("postId");

CREATE INDEX "Like_postId_userId_idx" ON "public"."Like" USING "btree" ("postId", "userId");

CREATE INDEX "Like_userId_idx" ON "public"."Like" USING "btree" ("userId");

CREATE INDEX "Post_createdAt_idx" ON "public"."Post" USING "btree" ("createdAt");

CREATE INDEX "Post_id_userId_idx" ON "public"."Post" USING "btree" ("id", "userId");

CREATE INDEX "Post_parentId_idx" ON "public"."Post" USING "btree" ("parentId");

CREATE INDEX "Post_userId_idx" ON "public"."Post" USING "btree" ("userId");

CREATE UNIQUE INDEX "Token_token_type_key" ON "public"."Token" USING "btree" ("token", "type");

CREATE INDEX "Token_userId_idx" ON "public"."Token" USING "btree" ("userId");

CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING "btree" ("email");

ALTER TABLE ONLY "public"."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id");

ALTER TABLE ONLY "public"."Block"
    ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."Block"
    ADD CONSTRAINT "Block_blockingId_fkey" FOREIGN KEY ("blockingId") REFERENCES "public"."User"("id") ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."EnrolledEvent"
    ADD CONSTRAINT "EnrolledEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id");

ALTER TABLE ONLY "public"."Flag"
    ADD CONSTRAINT "Flag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Flag"
    ADD CONSTRAINT "Flag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id");

ALTER TABLE ONLY "public"."Like"
    ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Like"
    ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id");

ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Post"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id");

ALTER TABLE ONLY "public"."Token"
    ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id");
