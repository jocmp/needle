namespace :feeds do
  desc "Refresh all feeds from Mastodon"
  task refresh: :environment do
    Feed.find_each do |feed|
      Rails.logger.info "Refreshing feed: #{feed.handle}"
      FeedFetcher.new(feed).call
    rescue MastodonClient::Error => e
      Rails.logger.error "Failed to refresh feed #{feed.handle}: #{e.message}"
    end
  end
end
