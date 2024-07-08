create table if not exists
  public.posts (
    id uuid unique not null default extensions.uuid_generate_v4 (),
    account_id uuid references public.accounts (id) on delete cascade not null,
    content text not null,
    base_like_count int,
    parent_id uuid references public.posts (id) on delete cascade not null,
    updated_at timestamp with time zone,
    created_at timestamptz not null default now(),
    primary key (id)
  );

-- Indexes
create index if not exists idx_posts_account_id on public.posts (account_id);
create index if not exists idx_posts_parent_id on public.posts (parent_id);

-- Foreign key constraint for comments relationship
alter table public.posts
    add constraint fk_posts_parent_id
    foreign key (parent_id)
    references public.posts (id)
    on delete cascade;