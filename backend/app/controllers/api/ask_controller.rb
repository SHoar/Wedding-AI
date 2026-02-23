module Api
  class AskController < BaseController
    def create
      wedding = Wedding.find(params[:wedding_id])
      question = params[:question].to_s.strip

      if question.blank?
        return render json: { error: "Question cannot be blank." }, status: :unprocessable_entity
      end

      answer = AiAgentClient.new.ask(
        question: question,
        wedding: wedding_context(wedding),
        guests: wedding.guests.order(:created_at).map { |guest| guest_context(guest) },
        tasks: wedding.tasks.order(:created_at).map { |task| task_context(task) },
        guestbook_entries: wedding.guestbook_entries.order(:created_at).map { |entry| guestbook_context(entry) },
      )

      render json: { answer: answer }
    rescue AiAgentClient::RequestError => e
      render json: { error: e.message }, status: :bad_gateway
    end

    private

    def wedding_context(wedding)
      {
        id: wedding.id,
        name: wedding.name,
        date: wedding.date&.iso8601,
        venue_name: wedding.venue_name,
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
end
