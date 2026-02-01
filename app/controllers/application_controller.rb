class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  rescue_from ActiveRecord::RecordNotFound, with: :not_found

  before_action :require_login

  helper_method :current_user, :logged_in?

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def logged_in?
    !!current_user
  end

  def require_login
    unless logged_in?
      redirect_to login_path, alert: "Please log in to continue"
    end
  end

  def not_found
    render "errors/not_found", status: :not_found
  end
end
