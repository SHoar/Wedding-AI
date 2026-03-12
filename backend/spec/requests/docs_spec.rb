# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::Docs", type: :request do
  let(:docs_dir) { Rails.root.join("..", "docs") }

  describe "GET /api/docs" do
    it "returns a list of doc entries" do
      get "/api/docs"
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to be_an(Array)
      body.each do |entry|
        expect(entry).to include("slug", "title")
      end
    end
  end

  describe "GET /api/docs/:filename" do
    it "returns markdown content for a valid doc" do
      md_files = docs_dir.glob("*.md")
      skip("No docs found") if md_files.empty?

      slug = md_files.first.basename(".md").to_s
      get "/api/docs/#{slug}"
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/markdown")
      expect(response.body).not_to be_empty
    end

    it "returns 404 for a nonexistent doc" do
      get "/api/docs/nonexistent_file_xyz"
      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for path traversal attempts" do
      get "/api/docs/..%2F..%2Fetc%2Fpasswd"
      expect(response).to have_http_status(:not_found)
    end
  end
end
