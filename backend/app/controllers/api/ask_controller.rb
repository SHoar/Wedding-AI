module Api
  class AskController < BaseController
    AI_ASK_CACHE_TTL = 60.seconds

    def create
      wedding = Wedding.includes(:guests, :tasks, :guestbook_entries).find(params[:wedding_id])
      question = params[:question].to_s.strip

      if question.blank?
        return render json: { error: "Question cannot be blank." }, status: :unprocessable_entity
      end

      client = AiAgentClient.new
      route = QuestionRouter.route(question)

      if route == :ask_docs
        cache_key = "ai_ask_docs/#{Digest::SHA256.hexdigest(question)}"
        answer = Rails.cache.read(cache_key)
        unless answer
          if CircuitBreaker.open?
            answer = fallback_answer(cache_key)
          else
            begin
              answer = client.ask_docs(question: question)
              CircuitBreaker.record_success
              Rails.cache.write(cache_key, answer, expires_in: AI_ASK_CACHE_TTL)
            rescue AiAgentClient::RequestError
              CircuitBreaker.record_failure
              raise
            end
          end
        end
      else
        context = AskContextBuilder.build(wedding)
        cache_key = ai_ask_cache_key(wedding.id, question, context)
        answer = Rails.cache.read(cache_key)
        unless answer
          if CircuitBreaker.open?
            answer = fallback_answer(cache_key)
          else
            begin
              answer = client.ask(question: question, **context)
              CircuitBreaker.record_success
              Rails.cache.write(cache_key, answer, expires_in: AI_ASK_CACHE_TTL)
            rescue AiAgentClient::RequestError
              CircuitBreaker.record_failure
              raise
            end
          end
        end
      end

      render json: { answer: answer }
    rescue AiAgentClient::RequestError => e
      render json: { error: e.message }, status: :bad_gateway
    end

    private

    def ai_ask_cache_key(wedding_id, question, context)
      digest = Digest::SHA256.hexdigest([question, context.to_json].join("\n"))
      "ai_ask/#{wedding_id}/#{digest}"
    end

    def fallback_answer(cache_key)
      Rails.cache.read(cache_key) || "AI is temporarily unavailable. Please try again shortly."
    end
  end
end
