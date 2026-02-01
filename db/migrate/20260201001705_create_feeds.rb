class CreateFeeds < ActiveRecord::Migration[8.0]
  def change
    create_table :feeds do |t|
      t.string :uuid, null: false
      t.string :threads_handle, null: false
      t.string :threads_user_id
      t.string :name
      t.string :profile_picture_url
      t.datetime :last_fetched_at

      t.timestamps
    end
    add_index :feeds, :uuid, unique: true
    add_index :feeds, :threads_handle, unique: true
  end
end
