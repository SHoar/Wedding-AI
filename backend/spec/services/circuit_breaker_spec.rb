# frozen_string_literal: true

require "rails_helper"

RSpec.describe CircuitBreaker do
  before do
    described_class.send(:failures).clear
  end

  describe ".open?" do
    it "returns false with no failures" do
      expect(described_class.open?).to be false
    end

    it "returns false with fewer than threshold failures" do
      2.times { described_class.record_failure }
      expect(described_class.open?).to be false
    end

    it "returns true after reaching failure threshold" do
      CircuitBreaker::FAILURE_THRESHOLD.times { described_class.record_failure }
      expect(described_class.open?).to be true
    end

    it "returns false after cooldown period elapses" do
      CircuitBreaker::FAILURE_THRESHOLD.times { described_class.record_failure }
      expect(described_class.open?).to be true

      travel_to(CircuitBreaker::COOLDOWN_SECONDS.seconds.from_now + 1.second) do
        expect(described_class.open?).to be false
      end
    end
  end

  describe ".record_success" do
    it "clears failures, closing the circuit" do
      CircuitBreaker::FAILURE_THRESHOLD.times { described_class.record_failure }
      expect(described_class.open?).to be true

      described_class.record_success
      expect(described_class.open?).to be false
    end
  end

  describe ".record_failure" do
    it "adds a failure timestamp" do
      expect { described_class.record_failure }
        .to change { described_class.send(:failures).size }.by(1)
    end
  end

  describe "window pruning" do
    it "discards failures older than WINDOW_SECONDS" do
      travel_to(2.minutes.ago) do
        3.times { described_class.record_failure }
      end

      expect(described_class.open?).to be false
    end
  end
end
