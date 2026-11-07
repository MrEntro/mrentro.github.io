# Hosting

One build, several hosts. GitHub Pages is primary; Cloudflare Pages, a private VPS (Docker) and
shared hosting (Apache/LiteSpeed over SSH, e.g. Hostinger) are prepared and **off** until you
configure them. Workflow: `.github/workflows/deploy.yml`.

## How it works

1. `build`: `npx quartz build` (with `SITE_URL` if set), then `node deploy/targets.mjs public out <sha>`:
   - `public/build.txt`: the commit SHA, served by every host (smoke tests compare it);
   - `out/cloudflare/`: site + `_headers`;
   - `out/apache/`: site + `.htaccess` (headers, clean URLs, 404, HTTPS redirect, no dotfiles).
2. One deploy job per host, each skipped unless enabled, each ending with
   `deploy/smoke-remote.sh <url> <sha>` (home page 200, build stamp, security headers + strict CSP).

Headers and the CSP have one source, `deploy/headers.mjs`. The nginx image uses the same values
(`security-headers.conf` + `csp.mjs`); `deploy/targets.test.mjs` checks all of them agree.

## Switches (Settings → Secrets and variables → Actions)

| Host             | Variable (Variables tab)           | Secrets                                                               | Other variables                                             |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| GitHub Pages     | `DEPLOY_PAGES` (on unless `false`) | none                                                                  | none                                                        |
| Cloudflare Pages | `DEPLOY_CLOUDFLARE=true`           | `CLOUDFLARE_API_TOKEN` (Pages: Edit), `CLOUDFLARE_ACCOUNT_ID`         | `CLOUDFLARE_PROJECT` (default `mrentro`), `CLOUDFLARE_URL`  |
| VPS (Docker)     | `DEPLOY_VPS=true`                  | `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`              | `VPS_PATH` (compose dir, default `mrentro-site`), `VPS_URL` |
| Shared hosting   | `DEPLOY_SFTP=true`                 | `SFTP_HOST`, `SFTP_USER`, `SFTP_KEY`, `SFTP_KNOWN_HOSTS`, `SFTP_PATH` | `SFTP_PORT` (default 22), `SFTP_URL`                        |
| All              |                                    |                                                                       | `SITE_URL`: host for absolute URLs (default `mrentro.com`)  |

Turning a host off: set its variable to `false` (or delete it). Nothing else changes.

## Per host

### GitHub Pages (primary)

As before: the `public/` artifact is deployed by `actions/deploy-pages`. Pages cannot set response
headers, so it gets no CSP header (the smoke test runs with `--no-headers`). Custom domain and DNS:
see the brief (`mrentro.com`, apex A/AAAA to the Pages IPs, `www` CNAME, grey cloud).

### Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages → **Direct Upload**, project name
   `mrentro` (or set `CLOUDFLARE_PROJECT`).
2. API token: My Profile → API Tokens → Create → template _Edit Cloudflare Workers_ or a custom
   token with **Account → Cloudflare Pages → Edit** only. Add it as `CLOUDFLARE_API_TOKEN`, the
   account ID (dashboard sidebar) as `CLOUDFLARE_ACCOUNT_ID`.
3. Set `CLOUDFLARE_URL` (e.g. `https://mrentro.pages.dev`) and `DEPLOY_CLOUDFLARE=true`.
4. Cutover (optional): Pages project → Custom domains → add `mrentro.com`. This changes DNS for the
   apex (proxied, orange cloud). Then set `DEPLOY_PAGES=false` and remove the GitHub Pages custom
   domain. Rollback: re-add the GitHub records (grey cloud) and the Pages custom domain.

`_headers` values over 2000 characters are ignored by Cloudflare; `targets.mjs` warns if the CSP
grows past that (many highlighted code blocks add style hashes).

### VPS (Docker)

1. On the VPS: Docker + compose plugin; a deploy user in the `docker` group; copy `compose.yaml`
   and `deploy/Caddyfile` into `~/mrentro-site` (`VPS_PATH`); enable the commented `caddy`
   service and drop the `ports` mapping of `site` once DNS points at the VPS.
2. The image is public on GHCR after the first run (`ghcr.io/mrentro/mrentro-site:<sha>`): set
   the package visibility to public, or `docker login ghcr.io` on the VPS with a read-only token.
3. SSH key: `ssh-keygen -t ed25519 -f mrentro-deploy -N ''`; public key into the deploy user's
   `authorized_keys`; private key as `VPS_SSH_KEY`. `ssh-keyscan -t ed25519 <host>` (verify the
   fingerprint out of band) as `VPS_KNOWN_HOSTS`.
4. Set `VPS_HOST`, `VPS_USER`, `VPS_URL`, then `DEPLOY_VPS=true`.

The job builds the image, runs the container smoke test, pushes it, then runs
`SITE_IMAGE=<image> docker compose pull site && docker compose up -d --no-build site` on the VPS.
Rollback: rerun an older Deploy run, or `SITE_IMAGE=<older tag> docker compose up -d` by hand.

### Shared hosting (Hostinger, Apache/LiteSpeed)

1. hPanel → Advanced → SSH Access: enable SSH, note host, port (Hostinger uses 65002) and user.
2. Add the public half of a dedicated ed25519 key; private key as `SFTP_KEY`; `ssh-keyscan -p
<port> <host>` as `SFTP_KNOWN_HOSTS`.
3. `SFTP_PATH`: the web root, e.g. `domains/mrentro.com/public_html` (relative to the home dir).
   `rsync --delete` only ever touches that directory; empty, `/`, `.` or paths with `..` are refused.
4. Set `SFTP_HOST`, `SFTP_USER`, `SFTP_PORT`, `SFTP_URL`, then `DEPLOY_SFTP=true`.

The `.htaccess` needs `mod_headers` and `mod_rewrite` (available on Hostinger). Checked locally
against `httpd:2.4` (headers, clean URLs, 404, HTTPS redirect, dotfiles 403).

## Cost notes

GitHub Pages and Cloudflare Pages: free for this site. VPS: the server itself (a small instance
is enough; nginx serves static files). Shared hosting: the plan you already pay for. GHCR storage
for public images is free.
