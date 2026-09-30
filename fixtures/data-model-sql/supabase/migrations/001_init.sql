create table public.profiles (
  id uuid primary key,
  email text not null,
  phone text,
  is_admin boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now()
);
create table if not exists posts (
  id serial primary key,
  author_id uuid references public.profiles(id),
  title text not null,
  body text,
  constraint posts_title_len check (char_length(title) > 0)
);
