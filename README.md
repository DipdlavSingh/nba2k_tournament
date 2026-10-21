# NBA 2K26 Duos Tournament

A website for a 2v2 NBA 2K26 tournament. Teams of two play a single round robin, and the top two seeds meet in a best-of-3 Final.

- **Public home page:** a leaderboard with W/L, win %, PF/PA, point differential, average margin, streak and last 5 games. It also shows the Finals series, upcoming games, latest results, and every team with its members.
- **Players:** sign up with a username and password, then upload a profile picture and set a display name, gamertag and tagline. Once paired, either teammate can set the team name, NBA team and team tagline. Players can see all of their team's games and scores.
- **Admin** (`/admin`):
  - pairs players into teams
  - generates the round robin schedule and sets tip-off times
  - enters final scores
  - creates the Finals (seeded from the leaderboard, or overridden by hand)
  - edits or deletes any player, team or game
  - resets passwords
  - posts an announcement banner
  - opens or closes registration

## Tiebreakers

Teams are ranked by:

1. Win %
2. Head-to-head win % among all teams tied on win %
3. Point differential
4. Points scored
5. Fewest points allowed
6. Team name (the admin can override the Finals seeding from the Admin overview)

The leaderboard tags each team that was placed by a tiebreaker (for example `TB·PD`).

## Run locally

```bash
npm install
cp .env.example .env.local   # set ADMIN_USERNAME / ADMIN_PASSWORD
npm run seed:local           # optional demo data (every demo player's password is "password")
npm run dev
```

If no Supabase variables are set, data is saved to `.data/db.json`.

## Deploy for free (Vercel + Supabase)

1. **Supabase:** create a free project at [supabase.com](https://supabase.com). Open **SQL Editor**, paste in the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. Then go to **Project Settings → API** and copy the Project URL and the `service_role` key.
2. **GitHub:** push this folder to a GitHub repository.
3. **Vercel:** at [vercel.com](https://vercel.com), choose **Add New → Project** and import the repo. The framework is detected as Next.js. Add these environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET` (a long random string)
4. Deploy. Share the `*.vercel.app` URL with players and log in at `/admin`.

Notes:

- The service role key stays on the server and is never sent to the browser. Row level security is enabled with no policies, so the public anon key can't read anything.
- Profile pictures are cropped and shrunk to about 30 KB in the browser and stored in the database. No storage bucket is needed.
- Free Supabase projects pause after about a week with no activity. Click **Restore** in the dashboard if that happens.
- Team badges are drawn in each NBA team's colours rather than using the official logos, which are trademarked.
