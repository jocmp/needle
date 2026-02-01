FactoryBot.define do
  factory :entry do
    feed
    sequence(:threads_post_id) { |n| "post_#{n}" }
    content { "This is a test post" }
    published_at { Time.current }
  end
end
