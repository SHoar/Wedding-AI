# frozen_string_literal: true

require "rails_helper"

RSpec.describe GuestbookEntry, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:wedding) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:guest_name) }
    it { is_expected.to validate_presence_of(:message) }
  end

  describe "scopes" do
    describe ".publicly_visible" do
      it "returns only entries where is_public is true" do
        wedding = create(:wedding)
        public_entry = create(:guestbook_entry, wedding: wedding, is_public: true)
        _private_entry = create(:guestbook_entry, wedding: wedding, is_public: false)
        expect(GuestbookEntry.publicly_visible).to contain_exactly(public_entry)
      end
    end
  end

  describe "#as_api_json" do
    it "returns hash with entry attributes" do
      entry = create(:guestbook_entry, guest_name: "Bob", message: "Congrats!")
      json = entry.as_api_json
      expect(json[:id]).to eq(entry.id)
      expect(json[:guest_name]).to eq("Bob")
      expect(json[:message]).to eq("Congrats!")
    end
  end
end
