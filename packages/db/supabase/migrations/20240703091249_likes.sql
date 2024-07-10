create table if not exists
  public.likes (
    post_Id uuid references public.posts (id) on delete cascade not null,
    userId uuid references public.accounts (id) on delete cascade not null,

    createdAt timestamptz not null default now(),
    updatedAt timestamp with time zone,

    primary key (postId, userId)
  );
