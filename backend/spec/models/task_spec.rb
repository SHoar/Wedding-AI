# frozen_string_literal: true

require "rails_helper"

RSpec.describe Task, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:wedding) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:title) }
  end

  describe "enums" do
    it { is_expected.to define_enum_for(:status).with_values(pending: 0, in_progress: 1, done: 2) }
    it { is_expected.to define_enum_for(:priority).with_values(low: 0, medium: 1, high: 2) }
  end

  describe "#as_api_json" do
    it "returns hash with task attributes" do
      task = create(:task, title: "Book venue", status: :in_progress)
      json = task.as_api_json
      expect(json[:id]).to eq(task.id)
      expect(json[:title]).to eq("Book venue")
      expect(json[:status]).to eq("in_progress")
    end
  end
end
