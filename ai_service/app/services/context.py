"""Build markdown context from AskRequest for the AI."""

from app.schemas import AskRequest


def build_context_markdown(payload: AskRequest) -> str:
    """Convert wedding/guests/tasks/guestbook payload into markdown for summarization."""
    wedding = payload.wedding
    lines = [
        f"Wedding: {wedding.name}",
        f"Date: {wedding.date or 'unknown'}",
        f"Venue: {wedding.venue_name or 'unknown'}",
        "",
        "Guests:",
    ]

    if payload.guests:
        for guest in payload.guests:
            lines.append(
                f"- {guest.name} | email={guest.email or '-'} | phone={guest.phone or '-'} | "
                f"plus_ones={guest.plus_one_count} | dietary={guest.dietary_notes or '-'}"
            )
    else:
        lines.append("- No guest records provided.")

    lines.append("")
    lines.append("Tasks:")
    if payload.tasks:
        for task in payload.tasks:
            lines.append(
                f"- {task.title} | status={task.status or 'pending'} | priority={task.priority or 'medium'}"
            )
    else:
        lines.append("- No tasks provided.")

    lines.append("")
    lines.append("Guestbook:")
    if payload.guestbook_entries:
        for entry in payload.guestbook_entries:
            visibility = "public" if entry.is_public else "private"
            lines.append(f"- {entry.guest_name} ({visibility}): {entry.message}")
    else:
        lines.append("- No guestbook entries provided.")

    return "\n".join(lines)
