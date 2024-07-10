create table if not exists
  public.blocks (
    blockerId uuid references public.accounts (id) on delete cascade not null,
    blockingId uuid references public.accounts (id) on delete cascade not null,
    primary key (blockerId, blockingId)
  );
