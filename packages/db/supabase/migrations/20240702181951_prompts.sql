create table if not exists
  public.prompts (
    id uuid unique not null default extensions.uuid_generate_v4 (),
    content text unique,
    
    primary key (id)
  );
