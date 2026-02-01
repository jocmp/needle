class RegistrationsController < ApplicationController
  skip_before_action :require_login, only: [ :new, :create ]
  before_action :require_registration_enabled

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)

    if @user.save
      session[:user_id] = @user.id
      redirect_to feeds_path, notice: "Account created successfully"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end

  def require_registration_enabled
    return if Rails.configuration.needle.registration_enabled

    redirect_to login_path, alert: "Registration is not available at this time."
  end
end
