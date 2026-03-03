Rails.application.configure do
  config.enable_reloading = true
  config.eager_load = false
  config.consider_all_requests_local = true
  config.server_timing = true
  config.action_controller.perform_caching = false
  config.cache_store = if ENV["REDIS_URL"].present?
    [:redis_cache_store, { url: ENV["REDIS_URL"] }]
  else
    :null_store
  end
  config.active_storage.service = :local if config.respond_to?(:active_storage)
  config.active_record.migration_error = :page_load
  config.active_record.verbose_query_logs = true
  config.log_level = :debug
  config.active_support.deprecation = :log
end
