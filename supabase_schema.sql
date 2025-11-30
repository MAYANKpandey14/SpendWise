-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  avatar text,
  currency text default 'INR',
  locale text default 'en-US',
  updated_at timestamp with time zone
);

-- Expenses table
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  currency text not null,
  category_id text not null,
  date date not null,
  merchant text not null,
  description text,
  receipt_url text,
  created_at bigint default extract(epoch from now())
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.expenses enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Policies for expenses
create policy "Users can view their own expenses."
  on public.expenses for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own expenses."
  on public.expenses for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own expenses."
  on public.expenses for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own expenses."
  on public.expenses for delete
  using ( auth.uid() = user_id );

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar, currency, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    'INR',
    'en-US'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();