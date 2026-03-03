Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false
  config.public_file_server.enabled = ENV["RAILS_SERVE_STATIC_FILES"].present?
  config.force_ssl = ENV.fetch("FORCE_SSL", "false") == "true"
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info").to_sym
  config.log_tags = [:request_id]
  config.active_support.report_deprecations = false

  config.cache_store = if ENV["REDIS_URL"].present?
    [:redis_cache_store, { url: ENV["REDIS_URL"] }]
  else
    :memory_store
  end
end
