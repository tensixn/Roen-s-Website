# Roen-s-Website

Personal portfolio site — plain HTML, CSS, and JS. Deployed on Vercel at [roennn.vercel.app](https://roennn.vercel.app).

## Local dev

```bash
npx http-server -p 3000
# then open http://localhost:3000
```

(Any static server works; don't open `index.html` via `file://` — some browsers restrict things like `localStorage` there.)

## Pages

- `index.html` — main site (hero, about, projects, contact)
- `playground.html` — interactive terminal + bubble wand toy

## Contact form

The form uses [Formspree](https://formspree.io) as its backend (free plan: 50 submissions/month). It's already wired up — `index.html` posts to the real endpoint:

```html
<form id="contactForm" class="contact-form" action="https://formspree.io/f/mgavvrro" method="POST">
```

If it ever needs re-pointing (new email, new Formspree account):

1. Create a [Formspree](https://formspree.io) form with your email.
2. Swap the form ID into the `action` above — the ID is the last part of the endpoint (`https://formspree.io/f/abcdwxyz` → `abcdwxyz`).
3. Confirm your email address via the verification mail Formspree sends, or deliveries will be silently dropped.

`script.js` still checks the endpoint for placeholder IDs (`YOUR_FORM_ID`, `FORM_ID`, `XXXXXXX`) — if the real ID ever goes missing, submitting shows a "form isn't wired up yet" notice instead of a cryptic error.

## Notes

- `Roen_Seow_Resume.pdf` is linked from the hero and the playground `resume` command.
- Theme (`roen_theme`), intro-seen (`roen_intro_seen`), and bubble pops (`roen_bubble_pops`) are stored in `localStorage`/`sessionStorage`.
- Analytics only load on the deployed site (`/_vercel/insights/script.js` is a Vercel-injected path; it 404s locally, which is harmless).
