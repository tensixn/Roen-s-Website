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

## Contact form setup

The form uses [Formspree](https://formspree.io) as its backend. The free plan gives 50 submissions/month.

1. Create a [Formspree](https://formspree.io) account and add a new form with your email (`neorwoes@gmail.com`).
2. Copy the form ID from the generated endpoint — it looks like `https://formspree.io/f/abcdwxyz`, where `abcdwxyz` is the ID.
3. In `index.html`, replace `YOUR_FORM_ID` in the contact form's `action`:

   ```html
   <form id="contactForm" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

4. Confirm your email address via the verification mail Formspree sends, or deliveries will be silently dropped.

Until the real ID is in place, submitting the form shows a "form isn't wired up yet" notice instead of a cryptic error.

## Notes

- `Roen_Seow_Resume.pdf` is linked from the hero and the playground `resume` command.
- Theme (`roen_theme`), intro-seen (`roen_intro_seen`), and bubble pops (`roen_bubble_pops`) are stored in `localStorage`/`sessionStorage`.
- Analytics only load on the deployed site (`/_vercel/insights/script.js` is a Vercel-injected path; it 404s locally, which is harmless).
