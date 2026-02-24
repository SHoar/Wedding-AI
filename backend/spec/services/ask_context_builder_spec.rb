# frozen_string_literal: true

require "rails_helper"

RSpec.describe AskContextBuilder do
  describe ".build" do
    it "returns wedding, guests, tasks, guestbook_entries hashes for AI context" do
      wedding = create(:wedding, name: "Test Wedding", venue_name: "Venue X")
      guest = create(:guest, wedding: wedding, name: "Jane")
      task = create(:task, wedding: wedding, title: "Book venue")
      entry = create(:guestbook_entry, wedding: wedding, guest_name: "Bob", message: "Hi")

      result = described_class.build(wedding)

      expect(result[:wedding]).to include(id: wedding.id, name: "Test Wedding", venue_name: "Venue X")
      expect(result[:guests].size).to eq(1)
      expect(result[:guests].first).to include(:id, name: "Jane")
      expect(result[:tasks].size).to eq(1)
      expect(result[:tasks].first).to include(:id, title: "Book venue")
      expect(result[:guestbook_entries].size).to eq(1)
      expect(result[:guestbook_entries].first).to include(:id, guest_name: "Bob", message: "Hi")
    end
  end
end
