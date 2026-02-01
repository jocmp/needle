class User < ApplicationRecord
  has_secure_password

  has_many :subscriptions, dependent: :destroy
  has_many :feeds, through: :subscriptions

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
end
