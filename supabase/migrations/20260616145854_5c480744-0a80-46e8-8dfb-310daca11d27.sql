
-- ============ EXTENSIONS & ENUMS ============
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'editor', 'author', 'reader');
create type public.article_status as enum ('draft', 'pending', 'published', 'rejected', 'archived');
create type public.link_policy as enum ('dofollow', 'nofollow');
create type public.submission_status as enum ('pending_payment', 'paid_pending_review', 'approved', 'rejected', 'published');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  website_url text,
  twitter_handle text,
  linkedin_url text, 
  github_url text,
  location text,
  reputation int not null default 0,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view their own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins can view all roles" on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));

-- ============ CATEGORIES ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Categories are viewable by everyone" on public.categories for select using (true);
create policy "Admins can manage categories" on public.categories for all using (public.has_role(auth.uid(), 'admin'));

insert into public.categories (slug, name, description) values
  ('entrepreneurship', 'Entrepreneurship', 'Founder stories and startup journeys'),
  ('success-stories', 'Success Stories', 'Inspiring tales of triumph'),
  ('personal-growth', 'Personal Growth', 'Self-improvement and mindset'),
  ('business', 'Business', 'Strategy, marketing and operations'),
  ('technology', 'Technology', 'Tech trends and digital innovation'),
  ('culture', 'Culture', 'Society, tradition and modern life'),
  ('finance', 'Finance', 'Money, investing and wealth-building'),
  ('interviews', 'Interviews', 'Conversations with leaders');

-- ============ TAGS ============
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);
grant select on public.tags to anon, authenticated;
grant insert on public.tags to authenticated;
grant all on public.tags to service_role;
alter table public.tags enable row level security;
create policy "Tags are viewable by everyone" on public.tags for select using (true);
create policy "Authenticated users can create tags" on public.tags for insert to authenticated with check (true);
create policy "Admins can manage tags" on public.tags for all using (public.has_role(auth.uid(), 'admin'));

-- ============ ARTICLES ============
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  slug text unique not null,
  title text not null,
  subtitle text,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  status public.article_status not null default 'draft',
  meta_title text,
  meta_description text,
  canonical_url text,
  og_image_url text,
  link_policy public.link_policy not null default 'nofollow',
  is_featured boolean not null default false,
  is_sponsored boolean not null default false,
  reading_time int not null default 1,
  view_count int not null default 0,
  like_count int not null default 0,
  comment_count int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index articles_status_published_idx on public.articles(status, published_at desc);
create index articles_author_idx on public.articles(author_id);
create index articles_category_idx on public.articles(category_id);
grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;
alter table public.articles enable row level security;

create policy "Published articles are public" on public.articles for select using (status = 'published' or auth.uid() = author_id or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "Authors create their own articles" on public.articles for insert to authenticated with check (auth.uid() = author_id);
create policy "Authors update their own non-published articles" on public.articles for update using (auth.uid() = author_id or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "Admins delete any, authors delete own drafts" on public.articles for delete using (public.has_role(auth.uid(), 'admin') or (auth.uid() = author_id and status in ('draft','rejected')));

-- ============ ARTICLE TAGS ============
create table public.article_tags (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (article_id, tag_id)
);
grant select on public.article_tags to anon, authenticated;
grant insert, delete on public.article_tags to authenticated;
grant all on public.article_tags to service_role;
alter table public.article_tags enable row level security;
create policy "Article tags viewable by everyone" on public.article_tags for select using (true);
create policy "Authors manage tags on their articles" on public.article_tags for all
  using (exists (select 1 from public.articles a where a.id = article_id and (a.author_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));

-- ============ COMMENTS ============
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_article_idx on public.comments(article_id);
grant select on public.comments to anon, authenticated;
grant insert, update, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "Visible comments are public" on public.comments for select using (is_hidden = false or auth.uid() = author_id or public.has_role(auth.uid(), 'admin'));
create policy "Authenticated users comment" on public.comments for insert to authenticated with check (auth.uid() = author_id);
create policy "Authors edit own comments" on public.comments for update using (auth.uid() = author_id or public.has_role(auth.uid(), 'admin'));
create policy "Authors and admins delete comments" on public.comments for delete using (auth.uid() = author_id or public.has_role(auth.uid(), 'admin'));

-- ============ LIKES ============
create table public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
grant select on public.likes to anon, authenticated;
grant insert, delete on public.likes to authenticated;
grant all on public.likes to service_role;
alter table public.likes enable row level security;
create policy "Likes are public" on public.likes for select using (true);
create policy "Users like as themselves" on public.likes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users unlike their own likes" on public.likes for delete using (auth.uid() = user_id);

-- ============ FOLLOWS ============
create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;
alter table public.follows enable row level security;
create policy "Follows are public" on public.follows for select using (true);
create policy "Users follow as themselves" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "Users unfollow as themselves" on public.follows for delete using (auth.uid() = follower_id);

-- ============ ARTICLE VIEWS ============
create table public.article_views (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  viewed_at timestamptz not null default now()
);
create index article_views_article_idx on public.article_views(article_id, viewed_at desc);
grant select on public.article_views to authenticated;
grant insert on public.article_views to anon, authenticated;
grant all on public.article_views to service_role;
alter table public.article_views enable row level security;
create policy "Anyone records a view" on public.article_views for insert with check (true);
create policy "Authors and admins read views" on public.article_views for select using (
  public.has_role(auth.uid(), 'admin') or exists (select 1 from public.articles a where a.id = article_id and a.author_id = auth.uid())
);

-- ============ NEWSLETTER ============
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, update, delete on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;
create policy "Anyone can subscribe" on public.newsletter_subscribers for insert with check (true);
create policy "Admins read subscribers" on public.newsletter_subscribers for select using (public.has_role(auth.uid(), 'admin'));

-- ============ GUEST POST SUBMISSIONS (paid) ============
create table public.guest_post_submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid references auth.users(id) on delete set null,
  email text not null,
  name text not null,
  website_url text,
  proposed_title text not null,
  pitch text not null,
  draft_content text,
  tier text not null default 'standard',
  price_cents int not null default 4900,
  payment_status text not null default 'unpaid',
  status public.submission_status not null default 'pending_payment',
  admin_notes text,
  published_article_id uuid references public.articles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.guest_post_submissions to anon, authenticated;
grant select, update on public.guest_post_submissions to authenticated;
grant all on public.guest_post_submissions to service_role;
alter table public.guest_post_submissions enable row level security;
create policy "Anyone can submit" on public.guest_post_submissions for insert with check (true);
create policy "Submitter or admin can read" on public.guest_post_submissions for select using (
  auth.uid() = submitter_id or public.has_role(auth.uid(), 'admin')
);
create policy "Admins manage submissions" on public.guest_post_submissions for update using (public.has_role(auth.uid(), 'admin'));

-- ============ HELPER FUNCTIONS ============
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger articles_updated before update on public.articles
  for each row execute function public.update_updated_at_column();
create trigger submissions_updated before update on public.guest_post_submissions
  for each row execute function public.update_updated_at_column();

-- Slugify + reading time
create or replace function public.slugify(v text) returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(v,'')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.articles_before_save() returns trigger language plpgsql as $$
declare base_slug text; final_slug text; counter int := 1;
begin
  if new.slug is null or new.slug = '' then
    base_slug := public.slugify(new.title);
    if base_slug = '' then base_slug := substr(new.id::text, 1, 8); end if;
    final_slug := base_slug;
    while exists (select 1 from public.articles where slug = final_slug and id <> new.id) loop
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    end loop;
    new.slug := final_slug;
  end if;
  new.reading_time := greatest(1, ceil(coalesce(array_length(regexp_split_to_array(coalesce(new.content,''), '\s+'), 1), 0) / 200.0)::int);
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger articles_before_save_trg before insert or update on public.articles
  for each row execute function public.articles_before_save();

-- Like count maintenance
create or replace function public.likes_count_trg() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.articles set like_count = like_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then update public.articles set like_count = greatest(0, like_count - 1) where id = old.article_id;
  end if;
  return null;
end;
$$;
create trigger likes_count_after after insert or delete on public.likes
  for each row execute function public.likes_count_trg();

-- Comment count maintenance
create or replace function public.comments_count_trg() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.articles set comment_count = comment_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then update public.articles set comment_count = greatest(0, comment_count - 1) where id = old.article_id;
  end if;
  return null;
end;
$$;
create trigger comments_count_after after insert or delete on public.comments
  for each row execute function public.comments_count_trg();

-- ============ AUTO PROFILE + ADMIN SEED ============
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare uname text; base_uname text; counter int := 1;
begin
  base_uname := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    public.slugify(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  );
  if base_uname is null or base_uname = '' then base_uname := 'user-' || substr(new.id::text, 1, 8); end if;
  uname := base_uname;
  while exists (select 1 from public.profiles where username = uname) loop
    counter := counter + 1;
    uname := base_uname || '-' || counter;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    uname,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Default reader role
  insert into public.user_roles (user_id, role) values (new.id, 'reader');

  -- Auto-grant admin to seed email
  if lower(new.email) = 'hindisuccessstories1@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
    insert into public.user_roles (user_id, role) values (new.id, 'author') on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
