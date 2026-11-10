# Revenue Recovery Studio

Dependency-free HTML/CSS/JavaScript website. `npm run build` copies public/ to dist/.

## Edit and deploy
- Edit public/index.html, styles.css, app.js.
- Configure public/config.js: Formspree endpoint, Cal.com URL, and a dedicated Cloudflare Web Analytics token. These are public identifiers, never secret keys.
- Cloudflare Pages: repository tensae-1/tensae-1.github.io; root directory revenue-recovery-studio; build command npm run build; output dist. Create a NEW Pages project; do not change Growth Desks Labs.
- Production: https://revenue-recovery-studio.pages.dev/. Cloudflare Pages automatically deploys the main branch from this directory. The previous Sites address is a legacy preview, not the production URL.

## Integrations
Formspree uses the dedicated Revenue Recovery Studio form mljbrejj, delivering to the verified studio inbox. The existing Growth Desks Labs form was not modified.
Cal.com uses a NEW dedicated 15-minute Revenue Recovery Consultation event at https://cal.com/growth-desk/revenue-recovery under the existing founder account. Existing Growth Desk events were not changed.
A dedicated Cloudflare Web Analytics token is configured for revenue-recovery-studio.pages.dev. There is one conditional loader; automatic beacon injection is not enabled. The Growth Desks Labs token is not reused.

## Admin preview
Open /?admin=1 to persistently exclude the browser from analytics; all later visits remain excluded. Use the visible Resume counting visits button to re-enable. /?admin=0 also clears exclusion. Preview URLs /?preview=1 also opt out. Local storage failure disables analytics conservatively.
Disable automatic Cloudflare Pages beacon injection when using the configured loader; otherwise the opt-out cannot control the injected script.

## Demonstration
Fictional leads, simulated follow-ups and responses, browser memory only. No CRM or messages are connected. Calculator gives scenario revenue, not proven customer results.

## Verification
See LAUNCH_REPORT.md. A successful Formspree HTTP response proves acceptance, not inbox delivery; only a matching notification verifies delivery. Booking link verification does not prove calendar synchronization.
