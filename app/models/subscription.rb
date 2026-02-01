class Subscription < ApplicationRecord
  belongs_to :user
  belongs_to :feed

  validates :user_id, uniqueness: { scope: :feed_id }
end
