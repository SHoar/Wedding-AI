# frozen_string_literal: true

require "json"
require "net/http"
require "uri"

module Api
  class AskStreamController < BaseController
    include ActionController::Live

    def stream
      wedding = Wedding.includes(:guests, :tasks, :guestbook_entries).find(params[:wedding_id])
      question = params[:question].to_s.strip

      if question.blank?
        response.status = 422
        response.stream.write({ error: "Question cannot be blank." }.to_json)
        response.stream.close
        return
      end

      if CircuitBreaker.open?
        response.headers["Content-Type"] = "text/event-stream"
        response.headers["Cache-Control"] = "no-cache"
        response.stream.write(
          "data: #{JSON.generate({ type: 'error', content: 'AI is temporarily unavailable. Please try again shortly.' })}\n\n"
        )
        response.stream.close
        return
      end

      context = AskContextBuilder.build(wedding)
      payload = {
        question: question,
        wedding: context[:wedding],
        guests: context[:guests],
        tasks: context[:tasks],
        guestbook_entries: context[:guestbook_entries],
      }

      response.headers["Content-Type"] = "text/event-stream"
      response.headers["Cache-Control"] = "no-cache"
      response.headers["X-Accel-Buffering"] = "no"

      stream_ask_to_ai(payload) do |chunk|
        response.stream.write(chunk)
      end
    rescue ActiveRecord::RecordNotFound
      response.status = 404
      response.stream.write({ error: "Wedding not found." }.to_json) if response.stream
    ensure
      response.stream.close if response.stream
    end

    private

    def stream_ask_to_ai(payload, &block)
      client = AiAgentClient.new
      uri = client.stream_uri

      Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https",
        open_timeout: client.timeout_value, read_timeout: client.timeout_value) do |http|
        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/json"
        request["Accept"] = "text/event-stream"
        request.body = payload.to_json

        http.request(request) do |ai_response|
          unless ai_response.is_a?(Net::HTTPSuccess)
            CircuitBreaker.record_failure
            yield "data: #{JSON.generate({ type: 'error', content: "AI service error: #{ai_response.code}" })}\n\n"
            return
          end

          CircuitBreaker.record_success
          ai_response.read_body(&block)
        end
      end
    rescue StandardError => e
      CircuitBreaker.record_failure
      yield "data: #{JSON.generate({ type: 'error', content: e.message })}\n\n"
    end
  end
end
