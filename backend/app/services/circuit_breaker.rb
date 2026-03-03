# frozen_string_literal: true

# In-memory circuit breaker for AI service calls.
# Opens after FAILURE_THRESHOLD failures within WINDOW_SECONDS; stays open for COOLDOWN_SECONDS.
class CircuitBreaker
  FAILURE_THRESHOLD = 3
  WINDOW_SECONDS = 60
  COOLDOWN_SECONDS = 30

  class << self
    def open?
      prune!
      return false if failures.size < FAILURE_THRESHOLD

      last_failure = failures.last
      return false unless last_failure

      # Still in cooldown since last failure
      (Time.now - last_failure) < COOLDOWN_SECONDS
    end

    def record_failure
      failures << Time.now
      prune!
    end

    def record_success
      # Optional: clear on success to recover faster. Commented out so we rely on cooldown.
      # failures.clear
    end

    private

    def failures
      @failures ||= []
    end

    def prune!
      cutoff = Time.now - WINDOW_SECONDS
      failures.reject! { |t| t < cutoff }
    end
  end
end
