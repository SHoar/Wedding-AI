# frozen_string_literal: true

# Routes questions to full-context /ask vs docs-only /ask_docs.
# How-to questions (no wedding-specific data needed) go to ask_docs.
class QuestionRouter
  HOW_TO_PATTERN = /\b(how do i|how to|where do i|where can i|what does the|how does)\b/i
  WEDDING_SPECIFIC_PATTERNS = [
    /\b(my wedding|our wedding|our guests|my guests|this wedding)\b/i,
    /\b(wedding (?:name|date|venue)|guest list|task list)\b/i,
  ].freeze

  class << self
    # Returns :ask_docs for docs-only (how-to) or :ask for full wedding context.
    def route(question)
      return :ask unless question.is_a?(String)

      q = question.strip
      return :ask if q.blank?

      return :ask unless q.match?(HOW_TO_PATTERN)

      # If question sounds wedding-specific, use full context
      return :ask if WEDDING_SPECIFIC_PATTERNS.any? { |pat| q.match?(pat) }

      :ask_docs
    end
  end
end
