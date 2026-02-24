# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::GuestbookEntries", type: :request do
  let(:wedding) { create(:wedding) }

  describe "GET /api/guestbook_entries" do
    it "returns entries for wedding when wedding_id given" do
      entry = create(:guestbook_entry, wedding: wedding)
      get api_guestbook_entries_path, params: { wedding_id: wedding.id }
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.map { |e| e["id"] }).to include(entry.id)
    end
  end

  describe "GET /api/guestbook_entries/:id" do
    it "returns the entry" do
      entry = create(:guestbook_entry, wedding: wedding, guest_name: "Bob", message: "Congrats!")
      get api_guestbook_entry_path(entry)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["guest_name"]).to eq("Bob")
    end
  end

  describe "POST /api/guestbook_entries" do
    it "creates an entry" do
      post api_guestbook_entries_path, params: {
        guestbook_entry: {
          wedding_id: wedding.id,
          guest_name: "Alice",
          message: "Best wishes!",
          is_public: true,
        },
      }, as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["guest_name"]).to eq("Alice")
    end

    it "returns 422 when invalid" do
      post api_guestbook_entries_path, params: {
        guestbook_entry: { wedding_id: wedding.id, guest_name: "", message: "" },
      }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "DELETE /api/guestbook_entries/:id" do
    it "destroys the entry" do
      entry = create(:guestbook_entry, wedding: wedding)
      delete api_guestbook_entry_path(entry)
      expect(response).to have_http_status(:no_content)
      expect(GuestbookEntry.find_by(id: entry.id)).to be_nil
    end
  end
end
