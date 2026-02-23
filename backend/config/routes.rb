Rails.application.routes.draw do
  get "/up", to: proc { [200, { "Content-Type" => "application/json" }, ['{"status":"ok"}']] }

  namespace :api do
    resources :weddings
    resources :guests
    resources :guestbook_entries
    resources :tasks

    post "/weddings/:wedding_id/ask", to: "ask#create"
    get "/weddings/:wedding_id/guestbook_entries", to: "guestbook_entries#index"
  end
end
