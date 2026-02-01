require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    it 'requires an email' do
      user = build(:user, email: nil)
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("can't be blank")
    end

    it 'requires a unique email' do
      create(:user, email: 'test@example.com')
      user = build(:user, email: 'test@example.com')
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include('has already been taken')
    end

    it 'requires a valid email format' do
      user = build(:user, email: 'invalid')
      expect(user).not_to be_valid
    end
  end

  describe 'associations' do
    it 'has many subscriptions' do
      expect(User.reflect_on_association(:subscriptions).macro).to eq(:has_many)
    end

    it 'has many feeds through subscriptions' do
      expect(User.reflect_on_association(:feeds).macro).to eq(:has_many)
    end
  end
end
