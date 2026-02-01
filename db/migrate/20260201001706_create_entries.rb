class CreateEntries < ActiveRecord::Migration[8.0]
  def change
    create_table :entries do |t|
      t.references :feed, null: false, foreign_key: true
      t.string :threads_post_id
      t.text :content
      t.string :media_url
      t.string :media_type
      t.datetime :published_at

      t.timestamps
    end
    add_index :entries, :threads_post_id, unique: true
  end
end
