create type public."NotificationChannel" as enum('in_app', 'email', 'push');

create type public."NotificationType" as enum('info', 'warning', 'error');

create table if not exists
  public."Notification" (
    id uuid unique not null default extensions.uuid_generate_v4 (),
    "userId" text not null references public."User" (id) on delete cascade,
    type public."NotificationType" not null default 'info',
    body varchar(5000) not null,
    link varchar(255),
    channel public."NotificationChannel" not null default 'in_app',
    dismissed boolean not null default false,
    "expiresAt" timestamptz default (now() + interval '1 month'),
    "createdAt" timestamptz not null default now()
  );

alter publication supabase_realtime
add table public."Notification";

alter table public."Notification" REPLICA IDENTITY FULL;

create index "Notification_userId_dismissed_idx" on "Notification" ("userId", dismissed, "expiresAt");
