Rails.application.config.filter_parameters += [
  :password,
  :token,
  :authorization,
  :openai_api_key,
]
