# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::Weddings", type: :request do
  describe "GET /api/weddings" do
    it "returns weddings ordered by date" do
      create(:wedding, name: "Second", date: 2.days.from_now.to_date)
      create(:wedding, name: "First", date: 1.day.from_now.to_date)
      get api_weddings_path
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json).to be_an(Array)
      expect(json.size).to eq(2)
      expect(json.first["name"]).to eq("First")
    end
  end

  describe "GET /api/weddings/:id" do
    it "returns the wedding" do
      wedding = create(:wedding, name: "My Wedding")
      get api_wedding_path(wedding)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("My Wedding")
    end

    it "returns 404 for missing wedding" do
      get api_wedding_path(id: 999_999)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/weddings" do
    it "creates a wedding" do
      post api_weddings_path, params: {
        wedding: { name: "New Wedding", date: 1.year.from_now.to_date, venue_name: "Beach" },
      }, as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("New Wedding")
    end

    it "returns 422 when invalid" do
      post api_weddings_path, params: {
        wedding: { name: "", date: nil, venue_name: "" },
      }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body).to have_key("errors")
    end
  end

  describe "PATCH /api/weddings/:id" do
    it "updates the wedding" do
      wedding = create(:wedding, name: "Old")
      patch api_wedding_path(wedding), params: {
        wedding: { name: "Updated", date: wedding.date, venue_name: wedding.venue_name },
      }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("Updated")
    end
  end

  describe "DELETE /api/weddings/:id" do
    it "destroys the wedding" do
      wedding = create(:wedding)
      delete api_wedding_path(wedding)
      expect(response).to have_http_status(:no_content)
      expect(Wedding.find_by(id: wedding.id)).to be_nil
    end
  end
end
