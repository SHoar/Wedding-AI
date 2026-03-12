# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::AskStream", type: :request do
  let(:wedding) { create(:wedding) }

  describe "GET /api/weddings/:wedding_id/ask/stream" do
    let(:stream_path) { "/api/weddings/#{wedding.id}/ask/stream" }

    it "returns 422 when question is blank" do
      get stream_path, params: { question: "  " }

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body["error"]).to include("blank")
    end

    it "returns 404 when wedding does not exist" do
      get "/api/weddings/999999/ask/stream", params: { question: "Hi?" }
      expect(response).to have_http_status(:not_found)
    end

    it "returns circuit breaker message when circuit is open" do
      allow(CircuitBreaker).to receive(:open?).and_return(true)

      get stream_path, params: { question: "Hello?" }

      expect(response.body).to include("temporarily unavailable")
    end

    it "streams an error event when AI service fails" do
      ai_service_url = ENV.fetch("AI_SERVICE_URL", "http://localhost:8000")
      stub_request(:post, "#{ai_service_url}/ask/stream")
        .to_return(status: 502, body: "Bad Gateway")

      get stream_path, params: { question: "Hello?" }

      expect(response.body).to include("error")
      expect(response.body).to include("502")
    end
  end
end
