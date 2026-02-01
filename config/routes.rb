Rails.application.routes.draw do
  # Authentication
  get "login", to: "sessions#new"
  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"

  get "signup", to: "registrations#new"
  post "signup", to: "registrations#create"

  # Feeds
  resources :feeds, only: [:index, :new, :create, :show, :destroy] do
    member do
      post :refresh
    end
    get "entries.xml", to: "rss#show", as: :rss
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # PWA
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  root "feeds#index"
end
