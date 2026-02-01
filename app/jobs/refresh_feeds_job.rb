class RefreshFeedsJob < ApplicationJob
  queue_as :default

  def perform
    Feed.find_each do |feed|
      RefreshFeedJob.perform_later(feed.id)
    end
  end
end
