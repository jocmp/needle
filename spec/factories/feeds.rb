FactoryBot.define do
  factory :feed do
    sequence(:threads_handle) { |n| "user#{n}@threads.net" }
    name { "Test User" }
    profile_picture_url { "https://example.com/avatar.jpg" }
  end
end
