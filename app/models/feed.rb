class Feed < ApplicationRecord
  has_many :subscriptions, dependent: :destroy
  has_many :users, through: :subscriptions
  has_many :entries, dependent: :destroy

  validates :uuid, presence: true, uniqueness: true
  validates :threads_handle, presence: true, uniqueness: true

  before_validation :generate_uuid, on: :create
  before_validation :normalize_handle, on: :create

  def to_param
    uuid
  end

  def display_name
    name.presence || "@#{threads_handle.split('@').first}"
  end

  private

  def generate_uuid
    self.uuid ||= SecureRandom.uuid
  end

  def normalize_handle
    return if threads_handle.blank?

    handle = threads_handle.strip.delete_prefix("@")

    if handle.include?("threads.net/")
      match = handle.match(%r{threads\.net/@?([^/\?\s]+)})
      handle = match[1] if match
    end

    handle = "#{handle}@threads.net" unless handle.include?("@")

    self.threads_handle = handle.downcase
  end
end
