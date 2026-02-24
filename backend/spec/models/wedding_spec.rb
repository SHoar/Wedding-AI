# frozen_string_literal: true

require "rails_helper"

RSpec.describe Wedding, type: :model do
  describe "associations" do
    it { is_expected.to have_many(:guests).dependent(:destroy) }
    it { is_expected.to have_many(:guestbook_entries).dependent(:destroy) }
    it { is_expected.to have_many(:tasks).dependent(:destroy) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:venue_name) }
    it { is_expected.to validate_presence_of(:date) }
  end

  describe "#guests_for_ask" do
    it "returns guests relation ordered by created_at" do
      wedding = create(:wedding)
      g1 = create(:guest, wedding: wedding)
      g2 = create(:guest, wedding: wedding)
      expect(wedding.guests_for_ask).to contain_exactly(g1, g2)
      expect(wedding.guests_for_ask.to_sql).to include("created_at")
    end
  end

  describe "#tasks_for_ask and #guestbook_entries_for_ask" do
    it "return associations ordered by created_at" do
      wedding = create(:wedding)
      create(:task, wedding: wedding)
      create(:guestbook_entry, wedding: wedding)
      expect(wedding.tasks_for_ask).to eq(wedding.tasks.order(:created_at))
      expect(wedding.guestbook_entries_for_ask).to eq(wedding.guestbook_entries.order(:created_at))
    end
  end

  describe "#as_api_json" do
    it "returns hash with id, name, date, venue_name, timestamps" do
      wedding = create(:wedding, name: "Test Wedding", venue_name: "Venue A")
      json = wedding.as_api_json
      expect(json[:id]).to eq(wedding.id)
      expect(json[:name]).to eq("Test Wedding")
      expect(json[:venue_name]).to eq("Venue A")
      expect(json).to have_key(:created_at)
      expect(json).to have_key(:updated_at)
    end
  end
end
