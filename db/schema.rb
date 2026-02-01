# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_01_001924) do
  create_table "entries", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "feed_id", null: false
    t.string "media_type"
    t.string "media_url"
    t.datetime "published_at"
    t.string "threads_post_id"
    t.datetime "updated_at", null: false
    t.index ["feed_id"], name: "index_entries_on_feed_id"
    t.index ["threads_post_id"], name: "index_entries_on_threads_post_id", unique: true
  end

  create_table "feeds", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "last_fetched_at"
    t.string "name"
    t.string "profile_picture_url"
    t.string "threads_handle", null: false
    t.string "threads_user_id"
    t.datetime "updated_at", null: false
    t.string "uuid", null: false
    t.index ["threads_handle"], name: "index_feeds_on_threads_handle", unique: true
    t.index ["uuid"], name: "index_feeds_on_uuid", unique: true
  end

  create_table "subscriptions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "feed_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["feed_id"], name: "index_subscriptions_on_feed_id"
    t.index ["user_id", "feed_id"], name: "index_subscriptions_on_user_id_and_feed_id", unique: true
    t.index ["user_id"], name: "index_subscriptions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "password_digest"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "entries", "feeds"
  add_foreign_key "subscriptions", "feeds"
  add_foreign_key "subscriptions", "users"
end
