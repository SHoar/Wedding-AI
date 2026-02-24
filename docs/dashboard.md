# Dashboard Page

The Dashboard is the home page of the Wedding AI app. It gives a quick overview of your wedding planning data.

## What this page does

- Shows **stat cards**: guest records count, projected attendance (guests + plus ones), tasks completed (e.g. 3/10, 30% completion), and dietary requests.
- Displays a **day-of timeline**: fixed sample times and locations (Ceremony, Cocktail Hour, Reception, First Dance, Send-off).
- Shows **guest status**: profiles with contact info, guestbook signatures count, open action items.
- Lists **recent guestbook notes**: up to three latest entries with guest name and message.

## How data is loaded

The Dashboard uses the active wedding ID and calls the API in parallel:

- `GET /api/guests` — all guests
- `GET /api/tasks` — all tasks
- `GET /api/weddings/:wedding_id/guestbook_entries` — guestbook entries for the wedding

Metrics (total guests, projected attendance, completion rate, dietary count) are computed from that data in the browser.

## Key actions

- No direct “actions” on the Dashboard; it is read-only. Use the nav to go to Guests, Guestbook, Tasks, or AI Q&A to make changes.

## Tips

- If you see “Wedding id …” and “refreshing...”, the app is still resolving the active wedding or loading data.
- The timeline is a static example; actual schedule data would come from wedding/venue configuration in a future version.
