# Tasks Page

The Tasks page lets you create and track wedding to-dos: vendor, venue, and checklist items. You can set priority and update status.

## What this page does

- **Create task**: Form with title (required), priority (Low / Medium / High), and an “Add task” button. New tasks appear at the top of the list.
- **Wedding tasks list**: Each task is shown with title, priority, and status. You can change status (e.g. pending → in progress → done).

## Key actions

- **Add task**: Enter a title, set priority, click “Add task”. Title is required.
- **Update status**: Use the controls on a task card to move it to a different status (e.g. mark done). The list updates after a successful API call.

## Priority and status

- **Priority**: Low (0), Medium (1), High (2). Used for ordering and planning.
- **Status**: pending, in_progress, done (or completed). The Dashboard uses these to compute “Tasks completed” and “Open action items”.

## API used

- `GET /api/tasks` — List all tasks. Used when the page loads.
- `POST /api/tasks` — Create a task. Body: `title`, `priority`, `status`.
- `PATCH /api/tasks/:id` — Update a task (e.g. status). Body: `status` (or other fields).

## Tips

- Task title is required. Priority defaults to Medium if not set.
- The Dashboard shows completion as “X/Y tasks” and “Z% completion” based on tasks in “done” or “completed” status.
- Use status updates to keep the Dashboard “Open action items” count accurate.
