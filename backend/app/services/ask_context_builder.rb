# frozen_string_literal: true

class AskContextBuilder
  def self.build(wedding)
    new(wedding).build
  end

  def initialize(wedding)
    @wedding = wedding
  end

  def build
    {
      wedding: wedding_context,
      guests: @wedding.guests_for_ask.map { |g| guest_context(g) },
      tasks: @wedding.tasks_for_ask.map { |t| task_context(t) },
      guestbook_entries: @wedding.guestbook_entries_for_ask.map { |e| guestbook_context(e) },
    }
  end

  private

  def wedding_context
    {
      id: @wedding.id,
      name: @wedding.name,
      date: @wedding.date&.iso8601,
      venue_name: @wedding.venue_name,
    }
  end

  def guest_context(guest)
    {
      id: guest.id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      plus_one_count: guest.plus_one_count,
      dietary_notes: guest.dietary_notes,
    }
  end

  def task_context(task)
    {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
    }
  end

  def guestbook_context(entry)
    {
      id: entry.id,
      guest_name: entry.guest_name,
      message: entry.message,
      is_public: entry.is_public,
    }
  end
end
