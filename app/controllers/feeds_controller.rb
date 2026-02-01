class FeedsController < ApplicationController
  before_action :set_feed, only: [ :show, :destroy, :refresh ]

  def index
    @feeds = current_user.feeds.includes(:entries)
  end

  def new
    @feed = Feed.new
  end

  def create
    handle = normalize_handle(params[:handle])
    @feed = Feed.find_or_initialize_by(threads_handle: handle)

    ActiveRecord::Base.transaction do
      if @feed.new_record?
        @feed.save!
        FeedFetcher.new(@feed).call
      end

      current_user.subscriptions.find_or_create_by!(feed: @feed)
    end

    redirect_to @feed, notice: "Feed added successfully"
  rescue ActiveRecord::RecordInvalid => e
    @feed.errors.add(:base, e.message)
    render :new, status: :unprocessable_content
  rescue MastodonClient::AccountNotFound
    @feed.destroy if @feed.persisted? && @feed.subscriptions.empty?
    @feed = Feed.new(threads_handle: handle)
    @feed.errors.add(:base, "This account could not be located. The proprietor may not have enabled federation in their Threads settings.")
    render :new, status: :unprocessable_content
  rescue MastodonClient::FetchError => e
    @feed.destroy if @feed.persisted? && @feed.subscriptions.empty?
    @feed = Feed.new(threads_handle: handle)
    @feed.errors.add(:base, "Error fetching feed: #{e.message}")
    render :new, status: :unprocessable_content
  end

  def show
    @entries = @feed.entries.limit(50)
  end

  def destroy
    subscription = current_user.subscriptions.find_by(feed: @feed)
    subscription&.destroy
    redirect_to feeds_path, notice: "Unsubscribed from feed"
  end

  def refresh
    FeedFetcher.new(@feed).call
    redirect_to @feed, notice: "Feed refreshed"
  rescue MastodonClient::Error => e
    redirect_to @feed, alert: "Error refreshing: #{e.message}"
  end

  private

  def set_feed
    @feed = current_user.feeds.find_by!(uuid: params[:id])
  end

  # Normalize to same format as Feed model: username@threads.net (lowercase)
  def normalize_handle(input)
    handle = input.to_s.strip

    # Extract username from mastodon.social URL: https://mastodon.social/@user@threads.net
    if handle.include?("mastodon.social/@")
      match = handle.match(%r{mastodon\.social/@([^@\s]+)@threads\.net})
      handle = match[1] if match
    # Extract from threads.net or threads.com URL: https://www.threads.net/@username
    elsif handle.match?(%r{threads\.(net|com)/})
      match = handle.match(%r{threads\.(?:net|com)/@?([^/\?\s]+)})
      handle = match[1] if match
    else
      # Plain handle like @username or username@threads.net
      handle = handle.delete_prefix("@")
      handle = handle.split("@").first if handle.include?("@")
    end

    # Return normalized format
    "#{handle.downcase}@threads.net"
  end
end
