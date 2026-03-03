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
      base_url = ENV.fetch("AI_SERVICE_URL", "http://localhost:8000")
      uri = URI("#{base_url}/ask/stream")
      timeout = ENV.fetch("AI_SERVICE_TIMEOUT", "90").to_i

      Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: timeout, read_timeout: timeout) do |http|
        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/json"
        request["Accept"] = "text/event-stream"
        request.body = payload.to_json

        http.request(request) do |response|
          unless response.is_a?(Net::HTTPSuccess)
            yield "data: #{JSON.generate({ type: 'error', content: "AI service error: #{response.code}" })}\n\n"
            return
          end

          response.read_body(&block)
        end
      end
    rescue StandardError => e
      yield "data: #{JSON.generate({ type: 'error', content: e.message })}\n\n"
    end
  end
end
