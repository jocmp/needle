require 'rails_helper'

RSpec.describe FeedFetcher do
  include ActiveSupport::Testing::TimeHelpers

  let(:feed) { create(:feed, threads_handle: 'zuck@threads.net') }

  before do
    stub_request(:get, "https://mastodon.social/api/v1/accounts/lookup")
      .with(query: { acct: 'zuck@threads.net' })
      .to_return(
        status: 200,
        body: {
          id: '123',
          username: 'zuck',
          display_name: 'Mark Zuckerberg',
          avatar: 'https://example.com/avatar.jpg'
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )

    stub_request(:get, "https://mastodon.social/api/v1/accounts/123/statuses")
      .with(query: hash_including('limit' => '40'))
      .to_return(
        status: 200,
        body: [
          {
            id: 'post1',
            content: '<p>Hello world</p>',
            created_at: '2024-01-01T12:00:00Z',
            media_attachments: []
          },
          {
            id: 'post2',
            content: '<p>Another post</p>',
            created_at: '2024-01-02T12:00:00Z',
            media_attachments: [
              { url: 'https://example.com/image.jpg', type: 'image' }
            ]
          }
        ].to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  describe '#call' do
    it 'updates feed profile information' do
      described_class.new(feed).call

      feed.reload
      expect(feed.name).to eq('Mark Zuckerberg')
      expect(feed.threads_user_id).to eq('123')
      expect(feed.profile_picture_url).to eq('https://example.com/avatar.jpg')
    end

    it 'creates entries from statuses' do
      expect { described_class.new(feed).call }
        .to change { feed.entries.count }.by(2)
    end

    it 'strips HTML from content' do
      described_class.new(feed).call

      entry = feed.entries.find_by(threads_post_id: 'post1')
      expect(entry.content).to eq('Hello world')
    end

    it 'extracts media information' do
      described_class.new(feed).call

      entry = feed.entries.find_by(threads_post_id: 'post2')
      expect(entry.media_url).to eq('https://example.com/image.jpg')
      expect(entry.media_type).to eq('image')
    end

    it 'updates last_fetched_at timestamp' do
      freeze_time do
        described_class.new(feed).call
        expect(feed.reload.last_fetched_at).to eq(Time.current)
      end
    end

    it 'does not duplicate entries on subsequent fetches' do
      described_class.new(feed).call
      expect { described_class.new(feed).call }
        .not_to change { feed.entries.count }
    end
  end
end
