require 'rails_helper'

RSpec.describe MastodonClient do
  let(:client) { described_class.new }

  describe '#lookup_account' do
    it 'returns account data for a valid handle' do
      stub_request(:get, "https://mastodon.social/api/v1/accounts/lookup")
        .with(query: { acct: 'zuck@threads.net' })
        .to_return(
          status: 200,
          body: { id: '123', username: 'zuck', display_name: 'Mark Zuckerberg' }.to_json,
          headers: { 'Content-Type' => 'application/json' }
        )

      result = client.lookup_account('zuck')
      expect(result['id']).to eq('123')
      expect(result['display_name']).to eq('Mark Zuckerberg')
    end

    it 'normalizes handle with @ prefix' do
      stub_request(:get, "https://mastodon.social/api/v1/accounts/lookup")
        .with(query: { acct: 'zuck@threads.net' })
        .to_return(
          status: 200,
          body: { id: '123' }.to_json,
          headers: { 'Content-Type' => 'application/json' }
        )

      client.lookup_account('@zuck')
    end

    it 'extracts handle from threads.net URL' do
      stub_request(:get, "https://mastodon.social/api/v1/accounts/lookup")
        .with(query: { acct: 'zuck@threads.net' })
        .to_return(
          status: 200,
          body: { id: '123' }.to_json,
          headers: { 'Content-Type' => 'application/json' }
        )

      client.lookup_account('https://www.threads.net/@zuck')
    end

    it 'raises AccountNotFound for non-existent accounts' do
      stub_request(:get, "https://mastodon.social/api/v1/accounts/lookup")
        .with(query: { acct: 'nonexistent@threads.net' })
        .to_return(status: 404)

      expect { client.lookup_account('nonexistent') }
        .to raise_error(MastodonClient::AccountNotFound)
    end
  end

  describe '#fetch_statuses' do
    it 'returns statuses for an account' do
      stub_request(:get, "https://mastodon.social/api/v1/accounts/123/statuses")
        .with(query: hash_including('limit' => '40'))
        .to_return(
          status: 200,
          body: [
            { id: 'post1', content: '<p>Hello world</p>', created_at: '2024-01-01T12:00:00Z' }
          ].to_json,
          headers: { 'Content-Type' => 'application/json' }
        )

      result = client.fetch_statuses('123')
      expect(result.length).to eq(1)
      expect(result.first['content']).to eq('<p>Hello world</p>')
    end

    it 'raises FetchError on failure' do
      stub_request(:get, "https://mastodon.social/api/v1/accounts/123/statuses")
        .with(query: hash_including('limit' => '40'))
        .to_return(status: 500)

      expect { client.fetch_statuses('123') }
        .to raise_error(MastodonClient::FetchError)
    end
  end
end
