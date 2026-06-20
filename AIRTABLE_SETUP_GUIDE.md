# Connecting Airtable to the H.E.R.O. Command Center

This upgrade adds real cross-device sync through Airtable. Because Airtable
doesn't allow direct browser-to-Airtable requests, and because we don't want
your Airtable token sitting in a public HTML file, this version routes through
a small secure function that runs on Netlify's servers. That means deployment
changes slightly from the simple drag-and-drop you've used before — but it's
a one-time setup.

## What's in this package

```
deploy_package/
├── index.html                  ← your Command Center app
├── netlify.toml                ← tells Netlify where the functions live
├── package.json                ← lists the one dependency the file-storage function needs
└── netlify/
    └── functions/
        ├── airtable.js          ← the secure Airtable proxy function
        └── files.js             ← stores uploaded Culture Index reports (Netlify Blobs)
```

Unzip `HERO_Command_Center_Deploy.zip` somewhere on your computer before you
start. Keep everything together in the same folder structure shown above —
Netlify needs `netlify.toml`, `package.json`, and the `netlify/functions/`
folder to be siblings of `index.html`, not separated.

## Step 1 — Create your Airtable base

1. Go to airtable.com and sign up for a free account if you haven't already.
2. Create a new base called **HERO Command Center**.
3. Inside it, create 5 tables named exactly: `Members`, `Candidates`,
   `Activities`, `Reviews`, `MOTM`.
4. In each of those 5 tables, create two fields: `key` (Single line text) and
   `payload` (Long text). You can delete the other default fields/columns.
5. Open the base and look at the URL — copy the part that starts with `app`
   (e.g. `appXXXXXXXXXXXXXX`). That's your **Base ID**.
6. Go to airtable.com/create/tokens → Create new token → give it
   `data.records:read` and `data.records:write` scopes → under Access, select
   only your HERO Command Center base → Create token → copy it. That's your
   **token** (starts with `pat`).

## Step 2 — Install the Netlify CLI

You'll need Node.js installed on your computer (nodejs.org) if you don't have
it already. Then, open a terminal (Command Prompt/PowerShell on Windows,
Terminal on Mac) and run:

```
npm install -g netlify-cli
netlify login
```

This opens a browser window to connect the CLI to your Netlify account.

## Step 3 — Link this folder to your existing site

`cd` into the unzipped `deploy_package` folder, then run:

```
netlify link
```

Choose **"Use current git remote"** if asked, or more likely
**"Search by site name"** — search for your existing site (the one behind
`commandcenterhero.netlify.app`) and select it. This connects your local
folder to the site you already created, instead of making a new one.

## Step 4 — Install the file storage dependency

Still in that same terminal, in the `deploy_package` folder, run:

```
npm install
```

This downloads the one small library the new "Culture Index report" file
storage feature needs (`@netlify/blobs`). You only need to do this once per
update — the CLI bundles it into the function automatically on deploy after
that. No Netlify Blobs account or setup needed; it's built into your site
automatically once deployed.

## Step 5 — Set your Airtable credentials as secrets

```
netlify env:set AIRTABLE_TOKEN paste_your_token_here
netlify env:set AIRTABLE_BASE paste_your_base_id_here
```

These values are stored securely by Netlify — they are never written into
your HTML file and never visible to site visitors.

(Alternative: you can also set these two variables through the Netlify
dashboard instead — Site configuration → Environment variables → Add a
variable. Either way works.)

## Step 6 — Deploy

```
netlify deploy --prod
```

This uploads `index.html` *and* builds/deploys both functions together. When
it finishes, it gives you the live URL — it should be the same
`commandcenterhero.netlify.app` address as before.

## Step 7 — Confirm it worked

Open the live site. Near the top, where it used to say
"💾 Auto-saving to browser," it should now say **"☁️ Synced via Airtable."**
Open the same site on a second device — your data should now appear there
too.

To check the file storage piece: open a member's Profile tab, upload a
Culture Index report photo or PDF, and look for the small
**"☁️ cloud-stored"** label next to it. If you see that, files will be visible
from any device. If you don't see it (just the green "On file" badge with no
cloud label), the file saved to that browser only — usually means Step 4 was
skipped, or the deploy needs to be redone after running `npm install`.

## Future updates

Any time you want to push a new version of `index.html`, just run
`netlify deploy --prod` again from inside this same folder. You only need to
re-run `npm install` if this guide tells you a new dependency was added —
otherwise just deploy.

## If something goes wrong

- **Deploy gets stuck on "post-processing":** this version's `netlify.toml`
  already tells Netlify to skip asset optimization (it doesn't understand the
  JSX in this app's inline script and can hang trying to minify it). If a
  previous deploy is stuck, cancel it from the Deploys tab and redeploy — it
  should now skip that step entirely and finish quickly.
- **Status still says "Auto-saving to browser" after deploying:** double-check
  the environment variables were set on the correct site (`netlify env:list`
  will show you what's currently set) and that you ran `netlify deploy --prod`
  (not just `netlify deploy`, which creates a draft preview instead of
  updating your live site).
- **You want to see function errors:** the Netlify dashboard has a
  "Functions" tab on your site that shows real-time logs from `airtable.js`
  and `files.js` — useful if something looks wrong after setup.
- **Culture Index report uploads don't show "cloud-stored":** make sure you
  ran `npm install` inside `deploy_package` before your most recent
  `netlify deploy --prod`. The feature still works without it (it just keeps
  the file on that one browser/device instead of syncing it).
