class FeedFetcher
  class Error < StandardError; end

  def initialize(feed)
    @feed = feed
    @client = MastodonClient.new
  end

  def call
    account = fetch_account
    update_feed_profile(account)
    statuses = fetch_statuses(account["id"])
    create_entries(statuses)
    @feed.update!(last_fetched_at: Time.current)
    @feed
  end

  private

  def fetch_account
    @client.lookup_account(@feed.threads_handle)
  end

  def update_feed_profile(account)
    @feed.update!(
      threads_user_id: account["id"],
      name: account["display_name"].presence || account["username"],
      profile_picture_url: account["avatar"]
    )
  end

  def fetch_statuses(account_id)
    @client.fetch_statuses(account_id)
  end

  def create_entries(statuses)
    statuses.each do |status|
      entry = @feed.entries.find_or_initialize_by(threads_post_id: status["id"])
      entry.assign_attributes(
        content: extract_content(status),
        media_url: extract_media_url(status),
        media_type: extract_media_type(status),
        published_at: Time.parse(status["created_at"])
      )
      entry.save!
    end
  end

  def extract_content(status)
    # Mastodon returns HTML content, strip tags for plain text
    content = status["content"] || ""
    ActionController::Base.helpers.strip_tags(content)
  end

  def extract_media_url(status)
    return nil unless status["media_attachments"]&.any?
    status["media_attachments"].first["url"]
  end

  def extract_media_type(status)
    return nil unless status["media_attachments"]&.any?
    status["media_attachments"].first["type"]
  end
end
