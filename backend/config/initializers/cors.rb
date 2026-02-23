frontend_origins = ENV.fetch("FRONTEND_ORIGINS", "")
                      .split(",")
                      .map(&:strip)
                      .reject(&:blank?)

legacy_frontend_origin = ENV["FRONTEND_ORIGIN"]&.strip
frontend_origins << legacy_frontend_origin if legacy_frontend_origin.present?

frontend_origins += ["http://localhost:5173", "http://localhost:8080"]
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
