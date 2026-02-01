class RefreshFeedJob < ApplicationJob
  queue_as :default

  def perform(feed_id)
    feed = Feed.find_by(id: feed_id)
    return unless feed

    FeedFetcher.new(feed).call
  rescue MastodonClient::Error => e
    Rails.logger.error "Failed to refresh feed #{feed_id}: #{e.message}"
  end
end
