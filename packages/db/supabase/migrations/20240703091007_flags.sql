create table if not exists
  public.flags (
    comment text,
    resolved boolean default false,
    post_id uuid references public.posts (id) on delete cascade not null,
    account_id uuid references public.accounts (id) on delete cascade not null,
    updated_at timestamp with time zone,
    created_at timestamptz not null default now(),
    primary key (post_id, account_id)
  );
