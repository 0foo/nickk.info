bundle exec jekyll build --verbose;


# Graceful then force, with a wait loop
pkill -TERM -f "jekyll serve" || true
# wait up to 5s for it to die
timeout 5 bash -c 'while pgrep -f "jekyll serve" >/dev/null; do sleep 0.1; done' || true
# if still alive, SIGKILL
pkill -KILL -f "jekyll serve" || true
timeout 2 bash -c 'while pgrep -f "jekyll serve" >/dev/null; do sleep 0.1; done' || true


bundle exec jekyll serve --livereload --future --watch --config _config.dev.yml;