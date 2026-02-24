# frozen_string_literal: true

require "rails_helper"

RSpec.describe Guest, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:wedding) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_numericality_of(:plus_one_count).is_greater_than_or_equal_to(0) }
  end

  describe ".for_wedding" do
    it "returns guests for the given wedding_id when present" do
      wedding = create(:wedding)
      guest = create(:guest, wedding: wedding)
      expect(Guest.for_wedding(wedding.id)).to contain_exactly(guest)
    end

    it "returns all guests when wedding_id is blank" do
      create(:guest)
      create(:guest)
      expect(Guest.for_wedding(nil).count).to eq(2)
      expect(Guest.for_wedding("").count).to eq(2)
    end
  end

  describe "#as_api_json" do
    it "returns hash with guest attributes" do
      guest = create(:guest, name: "Jane Doe", plus_one_count: 1)
      json = guest.as_api_json
      expect(json[:id]).to eq(guest.id)
      expect(json[:name]).to eq("Jane Doe")
      expect(json[:plus_one_count]).to eq(1)
      expect(json).to have_key(:wedding_id)
    end
  end
end
