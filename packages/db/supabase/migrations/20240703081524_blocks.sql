create table if not exists
  public.blocks (
    blocker_id uuid references public.accounts (id) on delete cascade not null,
    blocking_id uuid references public.accounts (id) on delete cascade not null,
    updated_at timestamp with time zone,
    created_at timestamptz not null default now(),
    primary key (blocker_id, blocking_id)
  );
