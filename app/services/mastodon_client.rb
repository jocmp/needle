class MastodonClient
  MASTODON_INSTANCE = "https://mastodon.social".freeze

  class Error < StandardError; end
  class AccountNotFound < Error; end
  class FetchError < Error; end

  def initialize(instance_url: MASTODON_INSTANCE)
    @instance_url = instance_url
    @conn = Faraday.new(url: @instance_url) do |f|
      f.request :url_encoded
      f.response :json
      f.response :raise_error
    end
  end

  def lookup_account(handle)
    acct = normalize_handle(handle)
    response = @conn.get("/api/v1/accounts/lookup", { acct: acct })
    response.body
  rescue Faraday::ResourceNotFound
    raise AccountNotFound, "Account not found: #{handle}"
  rescue Faraday::Error => e
    raise FetchError, "Failed to lookup account: #{e.message}"
  end

  def fetch_statuses(account_id, limit: 40, exclude_replies: true, exclude_reblogs: true)
    response = @conn.get("/api/v1/accounts/#{account_id}/statuses", {
      limit: limit,
      exclude_replies: exclude_replies,
      exclude_reblogs: exclude_reblogs
    })
    response.body
  rescue Faraday::Error => e
    raise FetchError, "Failed to fetch statuses: #{e.message}"
  end

  private

  def normalize_handle(handle)
    handle = handle.strip
    handle = handle.delete_prefix("@")

    if handle.include?("threads.net/")
      # Extract from URL like https://www.threads.net/@username
      match = handle.match(%r{threads\.net/@?([^/\?]+)})
      handle = match[1] if match
    end

    # Ensure it has the @threads.net suffix
    handle = "#{handle}@threads.net" unless handle.include?("@")

    handle
  end
end
