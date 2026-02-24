# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::Guests", type: :request do
  let(:wedding) { create(:wedding) }

  describe "GET /api/guests" do
    it "returns guests for wedding when wedding_id given" do
      guest = create(:guest, wedding: wedding)
      get api_guests_path, params: { wedding_id: wedding.id }
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json).to be_an(Array)
      expect(json.map { |g| g["id"] }).to include(guest.id)
    end

    it "returns all guests when no wedding_id" do
      create(:guest, wedding: wedding)
      get api_guests_path
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(1)
    end
  end

  describe "GET /api/guests/:id" do
    it "returns the guest" do
      guest = create(:guest, wedding: wedding, name: "Jane")
      get api_guest_path(guest)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("Jane")
    end

    it "returns 404 for missing guest" do
      get api_guest_path(id: 999_999)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/guests" do
    it "creates a guest" do
      post api_guests_path, params: {
        guest: { wedding_id: wedding.id, name: "New Guest", plus_one_count: 0 },
      }, as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("New Guest")
    end

    it "returns 422 when invalid" do
      post api_guests_path, params: {
        guest: { wedding_id: wedding.id, name: "", plus_one_count: -1 },
      }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /api/guests/:id" do
    it "updates the guest" do
      guest = create(:guest, wedding: wedding, name: "Old")
      patch api_guest_path(guest), params: {
        guest: { wedding_id: wedding.id, name: "Updated", plus_one_count: guest.plus_one_count },
      }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("Updated")
    end
  end

  describe "DELETE /api/guests/:id" do
    it "destroys the guest" do
      guest = create(:guest, wedding: wedding)
      delete api_guest_path(guest)
      expect(response).to have_http_status(:no_content)
      expect(Guest.find_by(id: guest.id)).to be_nil
    end
  end
end
