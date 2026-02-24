# Origins allowed for CORS. With Docker, frontend at :8080 proxies /api/ to backend (same-origin);
# allow these origins for direct backend access or preflight.
frontend_origins = ENV.fetch("FRONTEND_ORIGINS", "")
                      .split(",")
                      .map(&:strip)
                      .reject(&:blank?)

legacy_frontend_origin = ENV["FRONTEND_ORIGIN"]&.strip
frontend_origins << legacy_frontend_origin if legacy_frontend_origin.present?

frontend_origins += [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://host.docker.internal:8080",
]
frontend_origins.uniq!

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*frontend_origins)

    resource "*",
             headers: :any,
             methods: %i[get post put patch delete options head],
             expose: ["Authorization"]
  end
end
