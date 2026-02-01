class RssController < ApplicationController
  skip_before_action :require_login

  def show
    @feed = Feed.includes(:entries).find_by!(uuid: params[:feed_id])
    respond_to do |format|
      format.xml
    end
  end
end
