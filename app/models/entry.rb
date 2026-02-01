class Entry < ApplicationRecord
  belongs_to :feed

  validates :threads_post_id, presence: true, uniqueness: true

  default_scope { order(published_at: :desc) }
end
