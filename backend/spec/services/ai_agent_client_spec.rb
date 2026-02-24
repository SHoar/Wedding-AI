# frozen_string_literal: true

require "rails_helper"

RSpec.describe AiAgentClient do
  let(:base_url) { "http://ai-service.test" }
  let(:client) { described_class.new(base_url: base_url) }

  let(:wedding) { { id: 1, name: "Wedding", date: "2025-06-01", venue_name: "Venue" } }
  let(:guests) { [] }
  let(:tasks) { [] }
  let(:guestbook_entries) { [] }

  describe "#ask" do
    it "returns the answer when the AI service returns 200 with answer" do
      stub_request(:post, "#{base_url}/ask")
        .with(
          body: hash_including(
            "question" => "How many guests?",
            "wedding" => hash_including("name" => "Wedding")
          ),
          headers: { "Content-Type" => "application/json" }
        )
        .to_return(status: 200, body: { answer: "You have 0 guests." }.to_json, headers: { "Content-Type" => "application/json" })

      result = client.ask(
        question: "How many guests?",
        wedding: wedding,
        guests: guests,
        tasks: tasks,
        guestbook_entries: guestbook_entries
      )

      expect(result).to eq("You have 0 guests.")
    end

    it "raises RequestError when response is not success" do
      stub_request(:post, "#{base_url}/ask")
        .to_return(status: 502, body: "Bad Gateway")

      expect {
        client.ask(
          question: "Hi",
          wedding: wedding,
          guests: guests,
          tasks: tasks,
          guestbook_entries: guestbook_entries
        )
      }.to raise_error(AiAgentClient::RequestError, /502/)
    end

    it "raises RequestError when answer is blank" do
      stub_request(:post, "#{base_url}/ask")
        .to_return(status: 200, body: { answer: "" }.to_json, headers: { "Content-Type" => "application/json" })

      expect {
        client.ask(
          question: "Hi",
          wedding: wedding,
          guests: guests,
          tasks: tasks,
          guestbook_entries: guestbook_entries
        )
      }.to raise_error(AiAgentClient::RequestError, /empty answer/)
    end

    it "raises RequestError when response is not valid JSON" do
      stub_request(:post, "#{base_url}/ask")
        .to_return(status: 200, body: "not json", headers: { "Content-Type" => "text/plain" })

      expect {
        client.ask(
          question: "Hi",
          wedding: wedding,
          guests: guests,
          tasks: tasks,
          guestbook_entries: guestbook_entries
        )
      }.to raise_error(AiAgentClient::RequestError, /not valid JSON/)
    end
  end
end
