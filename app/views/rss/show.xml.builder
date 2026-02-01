xml.instruct! :xml, version: "1.0"
xml.rss version: "2.0", "xmlns:atom" => "http://www.w3.org/2005/Atom" do
  xml.channel do
    xml.title @feed.display_name
    xml.description "Threads posts from @#{@feed.threads_handle.split('@').first}"
    xml.link "https://www.threads.net/@#{@feed.threads_handle.split('@').first}"
    xml.tag! "atom:link", href: feed_rss_url(@feed), rel: "self", type: "application/rss+xml"
    xml.lastBuildDate @feed.last_fetched_at&.rfc2822 || Time.current.rfc2822

    @feed.entries.limit(50).each do |entry|
      xml.item do
        xml.title truncate(entry.content, length: 100)
        xml.description do
          xml.cdata! entry.content
        end
        xml.pubDate entry.published_at&.rfc2822
        xml.guid entry.threads_post_id, isPermaLink: false
        xml.link "https://www.threads.net/@#{@feed.threads_handle.split('@').first}/post/#{entry.threads_post_id}"

        if entry.media_url.present? && entry.media_type == "image"
          xml.enclosure url: entry.media_url, type: "image/jpeg"
        end
      end
    end
  end
end
