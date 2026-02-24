# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::Tasks", type: :request do
  let(:wedding) { create(:wedding) }

  describe "GET /api/tasks" do
    it "returns tasks for wedding when wedding_id given" do
      task = create(:task, wedding: wedding)
      get api_tasks_path, params: { wedding_id: wedding.id }
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.map { |t| t["id"] }).to include(task.id)
    end

    it "returns all tasks when no wedding_id" do
      create(:task, wedding: wedding)
      get api_tasks_path
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(1)
    end
  end

  describe "GET /api/tasks/:id" do
    it "returns the task" do
      task = create(:task, wedding: wedding, title: "Book venue")
      get api_task_path(task)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Book venue")
    end
  end

  describe "POST /api/tasks" do
    it "creates a task" do
      post api_tasks_path, params: {
        task: { wedding_id: wedding.id, title: "New Task", status: "pending", priority: "medium" },
      }, as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("New Task")
    end

    it "returns 422 when invalid" do
      post api_tasks_path, params: {
        task: { wedding_id: wedding.id, title: "" },
      }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /api/tasks/:id" do
    it "updates the task" do
      task = create(:task, wedding: wedding, title: "Old")
      patch api_task_path(task), params: {
        task: { wedding_id: wedding.id, title: "Updated", status: task.status, priority: task.priority },
      }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated")
    end
  end

  describe "DELETE /api/tasks/:id" do
    it "destroys the task" do
      task = create(:task, wedding: wedding)
      delete api_task_path(task)
      expect(response).to have_http_status(:no_content)
      expect(Task.find_by(id: task.id)).to be_nil
    end
  end
end
