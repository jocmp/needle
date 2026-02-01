require 'rails_helper'

RSpec.describe "Feeds", type: :request do
  let(:user) { create(:user) }

  before do
    post login_path, params: { email: user.email, password: 'password123' }
  end

  describe "GET /feeds" do
    it "returns http success" do
      get feeds_path
      expect(response).to have_http_status(:success)
    end

    it "lists user's feeds" do
      feed = create(:feed)
      create(:subscription, user: user, feed: feed)

      get feeds_path
      expect(response.body).to include(feed.display_name)
    end
  end

  describe "GET /feeds/new" do
    it "returns http success" do
      get new_feed_path
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /feeds" do
    before do
      stub_request(:get, "https://mastodon.social/api/v1/accounts/lookup")
        .with(query: { acct: 'zuck@threads.net' })
        .to_return(
          status: 200,
          body: { id: '123', username: 'zuck', display_name: 'Mark Zuckerberg', avatar: '' }.to_json,
          headers: { 'Content-Type' => 'application/json' }
        )

      stub_request(:get, "https://mastodon.social/api/v1/accounts/123/statuses")
        .with(query: hash_including('limit' => '40'))
        .to_return(
          status: 200,
          body: [].to_json,
          headers: { 'Content-Type' => 'application/json' }
        )
    end

    it "creates a new feed and subscription" do
      expect {
        post feeds_path, params: { handle: '@zuck' }
      }.to change { Feed.count }.by(1)
        .and change { user.subscriptions.count }.by(1)

      expect(response).to redirect_to(feed_path(Feed.last))
    end

    it "subscribes to existing feed without creating duplicate" do
      # Create feed with normalized handle (what the model produces)
      existing_feed = create(:feed, threads_handle: 'zuck@threads.net')

      expect {
        post feeds_path, params: { handle: '@zuck' }
      }.to change { Feed.count }.by(0)
        .and change { user.subscriptions.count }.by(1)

      expect(user.feeds).to include(existing_feed)
    end

    context "when account not found" do
      before do
        stub_request(:get, "https://mastodon.social/api/v1/accounts/lookup")
          .with(query: { acct: 'nonexistent@threads.net' })
          .to_return(status: 404)
      end

      it "renders new with error" do
        post feeds_path, params: { handle: 'nonexistent' }
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include("could not be located")
      end
    end
  end

  describe "GET /feeds/:id" do
    let(:feed) { create(:feed) }

    before do
      create(:subscription, user: user, feed: feed)
    end

    it "returns http success" do
      get feed_path(feed)
      expect(response).to have_http_status(:success)
    end

    it "shows feed entries" do
      entry = create(:entry, feed: feed, content: "Test post content")
      get feed_path(feed)
      expect(response.body).to include("Test post content")
    end
  end

  describe "DELETE /feeds/:id" do
    let(:feed) { create(:feed) }

    before do
      create(:subscription, user: user, feed: feed)
    end

    it "removes the subscription" do
      expect {
        delete feed_path(feed)
      }.to change { user.subscriptions.count }.by(-1)

      expect(response).to redirect_to(feeds_path)
    end
  end
end
