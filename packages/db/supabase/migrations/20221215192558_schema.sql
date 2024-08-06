create type public."UserRole" as ENUM('USER', 'ADMIN');
create type public."TokenType" as ENUM('REFRESH_TOKEN', 'VERIFY_EMAIL', 'RESET_PASSWORD');

create table if not exists
  public."User" (
    "id" uuid unique not null default extensions.uuid_generate_v4 (),
    "email" text,
    "emailVerified" timestamp with time zone,
    "passwordHash" text,
    "displayName" text,
    "displayImage" text,
    "disabled" boolean,
    "weeklyDigestEmail" boolean not null default false,
    "role" "UserRole" not null default 'USER',
    "createdAt" timestamptz not null default now(),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  );

create table if not exists
  public."Account" (
    "id" uuid unique not null default extensions.uuid_generate_v4 (),
    "provider" text not null,
    "providerAccountId" text not null,
    "refreshToken" text,
    "accessToken" text,
    "expiresAt" integer,
    "userId" uuid references public."User" ("id") on delete cascade not null,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
  );

create table if not exists
  public."Token" (
    "id" uuid unique not null default extensions.uuid_generate_v4 (),
    "token" text not null,
    "type" "TokenType" not null,
    "expiresAt" timestamp with time zone,
    "sentTo" text,
    "usedAt" timestamp with time zone,
    "userId" uuid references public."User" ("id") on delete cascade not null,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamp with time zone,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
  );

create table if not exists
  public."Post" (
    "id" uuid unique not null default extensions.uuid_generate_v4 (),
    "content" text not null,
    "createdBy" text,
    "baseLikeCount" integer,
    "parentId" text,
    "userId" uuid references public."User" ("id") on delete cascade not null,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamp with time zone,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
  );

create table if not exists
  public."Like" (
    "postId" uuid references public."Post" ("id") on delete cascade not null,
    "userId" uuid references public."User" ("id") on delete cascade not null,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamp with time zone,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("postId","userId")
  );

create table if not exists
  public."Flag" (
    "comment" text,
    "resolved" boolean not null default false,
    "postId" uuid references public."Post" ("id") on delete cascade not null,
    "userId" uuid references public."User" ("id") on delete cascade not null,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamp with time zone,

    CONSTRAINT "Flag_pkey" PRIMARY KEY ("postId","userId")
  );

create table if not exists
  public."Block" (
    "blockerId" uuid references public."User" ("id") on delete cascade not null,
    "blockingId" uuid references public."User" ("id") on delete cascade not null,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("blockerId","blockingId")
  );

create table if not exists
  public."Prompt" (
    "id" uuid unique not null default extensions.uuid_generate_v4 (),
    "content" text not null,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
  );

create table if not exists
  public."EnrolledEvent" (
    "id" uuid unique not null default extensions.uuid_generate_v4 (),
    "name" text not null,
    "slug" text not null,
    "start" timestamp with time zone,
    "end" timestamp with time zone,

    "userId" uuid references public."User" ("id") on delete cascade not null,

    CONSTRAINT "EnrolledEvent_pkey" PRIMARY KEY ("id")
  );
