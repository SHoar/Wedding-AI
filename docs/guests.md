# Guests Page

The Guests page lets you manage your wedding guest list: add guests and view everyone you’ve added.

## What this page does

- **Add a guest**: Form with name, email, phone, plus ones count, and dietary notes. Name is required.
- **Guest list**: All guests are listed; each card shows the guest’s details. Count is shown (e.g. “5 guests currently tracked”).

## Key actions

- **Add a guest**: Fill the form and click “Add guest”. The new guest appears at the top of the list. On error, a message appears below the form.
- **View guests**: List loads automatically when you open the page.

## Form fields

- **Name** (required): Full name.
- **Email**: Email address.
- **Phone**: Phone number.
- **Plus ones**: Number (0 or more).
- **Dietary notes**: Free text (e.g. “Vegetarian”, “No nuts”).

## API used

- `GET /api/guests` — List all guests. Used when the page loads.
- `POST /api/guests` — Create a guest. Body: `name`, `email`, `phone`, `plus_one_count`, `dietary_notes`.

## Tips

- Guest name is required; other fields are optional.
- Dietary notes are useful for catering and appear on the Dashboard under “Dietary requests”.
- Projected attendance on the Dashboard is guest count plus sum of all plus-one counts.
