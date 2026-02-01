require 'rails_helper'

RSpec.describe Entry, type: :model do
  describe 'validations' do
    it 'requires a threads_post_id' do
      entry = build(:entry, threads_post_id: nil)
      expect(entry).not_to be_valid
    end

    it 'requires a unique threads_post_id' do
      create(:entry, threads_post_id: 'abc123')
      entry = build(:entry, threads_post_id: 'abc123')
      expect(entry).not_to be_valid
    end
  end

  describe 'default scope' do
    it 'orders by published_at desc' do
      feed = create(:feed)
      old_entry = create(:entry, feed: feed, published_at: 1.day.ago)
      new_entry = create(:entry, feed: feed, published_at: Time.current)

      expect(feed.entries.first).to eq(new_entry)
      expect(feed.entries.last).to eq(old_entry)
    end
  end
end
