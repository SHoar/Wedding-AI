# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::Ask", type: :request do
  let(:wedding) { create(:wedding) }

  describe "POST /api/weddings/:wedding_id/ask" do
    let(:ask_path) { "/api/weddings/#{wedding.id}/ask" }

    it "returns answer when AI client succeeds" do
      allow_any_instance_of(AiAgentClient).to receive(:ask).and_return("Here is the answer.")

      post ask_path, params: { question: "How many guests?" }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["answer"]).to eq("Here is the answer.")
    end

    it "sends wedding, guests, tasks, guestbook_entries to AI client" do
      guest = create(:guest, wedding: wedding)
      task = create(:task, wedding: wedding)
      entry = create(:guestbook_entry, wedding: wedding)

      expect_any_instance_of(AiAgentClient).to receive(:ask) do |_client, **kwargs|
        expect(kwargs[:question]).to eq("Who is invited?")
        expect(kwargs[:wedding]).to include(:id, :name, :date, :venue_name)
        expect(kwargs[:guests].size).to eq(1)
        expect(kwargs[:guests].first).to include(:id, :name)
        expect(kwargs[:tasks].size).to eq(1)
        expect(kwargs[:guestbook_entries].size).to eq(1)
        "Answer"
      end

      post ask_path, params: { question: "Who is invited?" }, as: :json
      expect(response).to have_http_status(:ok)
    end

    it "returns 422 when question is blank" do
      post ask_path, params: { question: "   " }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["error"]).to include("blank")
    end

    it "returns 502 when AI client raises RequestError" do
      allow_any_instance_of(AiAgentClient).to receive(:ask).and_raise(
        AiAgentClient::RequestError.new("AI service unavailable")
      )

      post ask_path, params: { question: "Hello?" }, as: :json

      expect(response).to have_http_status(:bad_gateway)
      expect(response.parsed_body["error"]).to eq("AI service unavailable")
    end

    it "returns 404 when wedding does not exist" do
      post "/api/weddings/999999/ask", params: { question: "Hi?" }, as: :json
      expect(response).to have_http_status(:not_found)
    end
  end
end
