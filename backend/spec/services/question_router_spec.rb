# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuestionRouter do
  describe ".route" do
    it "returns :ask_docs for how-to questions without wedding-specific keywords" do
      expect(described_class.route("How do I add a guest?")).to eq(:ask_docs)
      expect(described_class.route("Where do I manage tasks?")).to eq(:ask_docs)
      expect(described_class.route("What does the dashboard show?")).to eq(:ask_docs)
    end

    it "returns :ask for blank or non-string" do
      expect(described_class.route("")).to eq(:ask)
      expect(described_class.route("   ")).to eq(:ask)
      expect(described_class.route(nil)).to eq(:ask)
    end

    it "returns :ask when question mentions wedding-specific data" do
      expect(described_class.route("How do I add a guest to my wedding?")).to eq(:ask)
      expect(described_class.route("What does the dashboard show for our guests?")).to eq(:ask)
    end

    it "returns :ask for data questions that are not how-to" do
      expect(described_class.route("How many guests do we have?")).to eq(:ask)
      expect(described_class.route("Which tasks are still open?")).to eq(:ask)
    end
  end
end
