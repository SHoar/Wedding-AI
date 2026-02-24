module Api
  class AskController < BaseController
    def create
      wedding = Wedding.includes(:guests, :tasks, :guestbook_entries).find(params[:wedding_id])
      question = params[:question].to_s.strip

      if question.blank?
        return render json: { error: "Question cannot be blank." }, status: :unprocessable_entity
      end

      context = AskContextBuilder.build(wedding)
      answer = AiAgentClient.new.ask(question: question, **context)

      render json: { answer: answer }
    rescue AiAgentClient::RequestError => e
      render json: { error: e.message }, status: :bad_gateway
    end
  end
end
