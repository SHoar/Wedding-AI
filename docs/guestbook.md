# Guestbook Page

The Guestbook page lets guests (or you) leave celebratory messages and see existing entries. Entries can be public or private.

## What this page does

- **Sign the guestbook**: Form with name, message, and a “Publish this entry publicly” checkbox. Name and message are required.
- **Messages list**: All guestbook entries for the active wedding, with guest name and message. Count is shown (e.g. “Messages (3)”).

## Key actions

- **Sign guestbook**: Enter name and message, choose public or private, then click “Sign guestbook”. The new entry appears at the top. On error, a message appears below the form.
- **View entries**: List loads when the page loads or when the active wedding changes.

## Public vs private

- **Public**: Entry can be shown in places like the Dashboard “Recent guestbook notes”.
- **Private**: Stored but not shown in public-facing summaries.

## API used

- `GET /api/weddings/:wedding_id/guestbook_entries` — List guestbook entries for a wedding. Used when the page loads.
- `POST /api/guestbook_entries` — Create an entry. Body: `guest_name`, `message`, `is_public`, `wedding_id`.

## Tips

- The page shows “Posting to wedding id …” so you know which wedding the entry will be attached to.
- If the wedding ID is still resolving, the submit button is disabled until it’s ready.
- The Dashboard shows up to three recent guestbook notes from the same wedding.
