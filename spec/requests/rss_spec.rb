require 'rails_helper'

RSpec.describe "RSS", type: :request do
  describe "GET /feeds/:feed_id/entries.xml" do
    let(:feed) { create(:feed, name: "Test User", threads_handle: "testuser@threads.net") }

    before do
      create(:entry, feed: feed, content: "First post", published_at: 1.day.ago)
      create(:entry, feed: feed, content: "Second post", published_at: Time.current)
    end

    it "returns RSS XML" do
      get feed_rss_path(feed, format: :xml)

      expect(response).to have_http_status(:success)
      expect(response.content_type).to include("application/xml")
    end

    it "includes feed title" do
      get feed_rss_path(feed, format: :xml)
      expect(response.body).to include("<title>Test User</title>")
    end

    it "includes entries" do
      get feed_rss_path(feed, format: :xml)
      expect(response.body).to include("First post")
      expect(response.body).to include("Second post")
    end

    it "does not require authentication" do
      get feed_rss_path(feed, format: :xml)
      expect(response).to have_http_status(:success)
    end
  end
end
