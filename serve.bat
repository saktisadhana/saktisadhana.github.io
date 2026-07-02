@echo off
echo Starting Jekyll local server with live reload...
echo Visit http://localhost:4000 when the build finishes.
echo Press Ctrl+C to stop.
echo.
bundle exec jekyll serve --livereload --open-url
