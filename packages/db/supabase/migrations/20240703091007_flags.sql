create table if not exists
  public.flags (
    comment text,
    resolved boolean default false,

    postId uuid references public.posts (id) on delete cascade not null,
    userId uuid references public.accounts (id) on delete cascade not null,
    
    createdAt timestamptz not null default now(),
    updatedAt timestamp with time zone,

    primary key (postId, userId)
  );
