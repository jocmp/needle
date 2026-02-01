require 'rails_helper'

RSpec.describe Feed, type: :model do
  describe 'validations' do
    it 'requires a threads_handle' do
      feed = build(:feed, threads_handle: nil)
      expect(feed).not_to be_valid
    end

    it 'requires a unique threads_handle' do
      create(:feed, threads_handle: 'zuck@threads.net')
      feed = build(:feed, threads_handle: 'zuck@threads.net')
      expect(feed).not_to be_valid
    end
  end

  describe 'callbacks' do
    it 'generates a uuid before validation' do
      feed = build(:feed, uuid: nil)
      feed.valid?
      expect(feed.uuid).to be_present
    end

    it 'normalizes the threads handle' do
      feed = build(:feed, threads_handle: '@Zuck')
      feed.valid?
      expect(feed.threads_handle).to eq('zuck@threads.net')
    end

    it 'extracts handle from URL' do
      feed = build(:feed, threads_handle: 'https://www.threads.net/@zuck')
      feed.valid?
      expect(feed.threads_handle).to eq('zuck@threads.net')
    end
  end

  describe '#display_name' do
    it 'returns name if present' do
      feed = build(:feed, name: 'Mark Zuckerberg', threads_handle: 'zuck@threads.net')
      expect(feed.display_name).to eq('Mark Zuckerberg')
    end

    it 'returns formatted handle if name is blank' do
      feed = build(:feed, name: nil, threads_handle: 'zuck@threads.net')
      expect(feed.display_name).to eq('@zuck')
    end
  end

  describe '#to_param' do
    it 'returns the uuid' do
      feed = create(:feed)
      expect(feed.to_param).to eq(feed.uuid)
    end
  end
end
