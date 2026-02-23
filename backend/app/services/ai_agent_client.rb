require "json"
require "net/http"
require "uri"

class AiAgentClient
  class RequestError < StandardError; end

  def initialize(base_url: ENV.fetch("AI_SERVICE_URL", "http://localhost:8000"), timeout: 30)
    @base_uri = URI(base_url)
    @timeout = timeout
  end

  def ask(question:, wedding:, guests:, tasks:, guestbook_entries:)
    payload = {
      question: question,
      wedding: wedding,
      guests: guests,
      tasks: tasks,
      guestbook_entries: guestbook_entries,
    }

    response = post_json("/ask", payload)

    answer = response["answer"]
    raise RequestError, "AI service returned an empty answer." if answer.blank?

    answer
  end

  private

  attr_reader :base_uri, :timeout

  def post_json(path, payload)
    uri = base_uri.dup
    uri.path = path

    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/json"
    request["Accept"] = "application/json"
    request.body = JSON.generate(payload)

    response = Net::HTTP.start(
      uri.host,
      uri.port,
      use_ssl: uri.scheme == "https",
      open_timeout: timeout,
      read_timeout: timeout,
    ) { |http| http.request(request) }

    unless response.is_a?(Net::HTTPSuccess)
      raise RequestError, "AI service request failed (#{response.code}): #{response.body}"
    end

    JSON.parse(response.body)
  rescue JSON::ParserError => e
    raise RequestError, "AI service response was not valid JSON: #{e.message}"
  rescue StandardError => e
    raise RequestError, e.message
  end
end
