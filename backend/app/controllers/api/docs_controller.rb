# frozen_string_literal: true

module Api
  class DocsController < ApplicationController
    def index
      docs = doc_entries
      render json: docs
    end

    def show
      filename = safe_filename(params[:filename])
      path = docs_dir.join(filename)

      unless path.file? && path.realpath.to_s.start_with?(docs_dir.realpath.to_s)
        return render json: { error: "Not found" }, status: :not_found
      end

      content = File.read(path)
      render plain: content, content_type: "text/markdown"
    end

    private

    def docs_dir
      base = ENV["DOCS_DIR"].presence || Rails.root.join("..", "docs").to_s
      Pathname.new(base).expand_path
    end

    def doc_entries
      dir = docs_dir
      return [] unless dir.directory?

      dir.each_child.with_object([]) do |path, entries|
        next unless path.extname == ".md"

        slug = path.basename(".md").to_s
        title = title_from_markdown(path)
        entries << { slug: slug, title: title }
      end.sort_by { |e| e[:title].downcase }
    end

    def title_from_markdown(path)
      first_line = File.readline(path).strip
      first_line.delete_prefix("#").strip
    rescue StandardError
      path.basename(".md").to_s
    end

    def safe_filename(filename)
      return "" if filename.blank?

      basename = File.basename(filename, ".*")
      ext = File.extname(filename)
      ext = ".md" if ext.blank?
      "#{basename}#{ext}"
    end
  end
end
