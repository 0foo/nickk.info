# Activate and configure extensions
# https://middlemanapp.com/advanced/configuration/#configuring-extensions

activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

# Layouts
# https://middlemanapp.com/basics/layouts/

# Per-page layout changes
page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false


activate :livereload

page "/", :layout => "home"

activate :blog do |blog|
  # This will add a prefix to all links, template references and source paths
  #blog.prefix = "articles"

  # blog.permalink = "{year}/{month}/{day}/{title}.html"
  # Matcher for blog source files
  blog.sources = "articles/{title}.html"
  # blog.taglink = "tags/{tag}.html"
  blog.layout = "layouts/article" # the layout to use for a single article
  blog.summary_separator = /(READMORE)/
  blog.summary_length = 1000
  # blog.year_link = "{year}.html"
  # blog.month_link = "{year}/{month}.html"
  # blog.day_link = "{year}/{month}/{day}.html"
  # blog.default_extension = ".markdown"

  # blog.tag_template = "tag.html"
  # blog.calendar_template = "calendar.html"

  # Enable pagination
  blog.paginate = false
  blog.per_page = 5
  blog.page_link = "page/{num}"
  blog.publish_future_dated = true

end
