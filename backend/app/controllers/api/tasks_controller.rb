module Api
  class TasksController < BaseController
    def index
      tasks = Task.for_wedding(params[:wedding_id]).order(created_at: :desc)
      render json: tasks.map(&:as_api_json)
    end

    def show
      task = Task.find(params[:id])
      render json: task.as_api_json
    end

    def create
      wedding_id = task_params[:wedding_id]
      task = Task.new(task_params.except(:wedding_id))
      task.wedding = resolve_wedding!(wedding_id)

      if task.save
        render json: task.as_api_json, status: :created
      else
        render_validation_errors(task)
      end
    end

    def update
      task = Task.find(params[:id])
      task.wedding = resolve_wedding!(task_params[:wedding_id]) if task_params[:wedding_id].present?

      if task.update(task_params.except(:wedding_id))
        render json: task.as_api_json
      else
        render_validation_errors(task)
      end
    end

    def destroy
      task = Task.find(params[:id])
      task.destroy!
      head :no_content
    end

    private

    def task_params
      params.require(:task).permit(
        :wedding_id,
        :title,
        :status,
        :priority,
      )
    end
  end
end
