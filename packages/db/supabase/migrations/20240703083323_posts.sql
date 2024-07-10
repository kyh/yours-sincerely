create table if not exists
  public.posts (
    id uuid unique not null default extensions.uuid_generate_v4 (),
    content text,
    createdBy text,
    baseLikeCount int,

    parentId uuid references public.posts (id) on delete cascade not null,
    userId uuid references public.accounts (id) on delete cascade not null,
    
    createdAt timestamptz not null default now(),
    updatedAt timestamp with time zone,

    primary key (id)
  );

-- Indexes
create index if not exists idx_posts_userId on public.posts (userId);
create index if not exists idx_posts_parentId on public.posts (parentId);

-- Foreign key constraint for comments relationship
alter table public.posts
    add constraint fk_posts_parentId
    foreign key (parentId)
    references public.posts (id)
    on delete cascade;
    