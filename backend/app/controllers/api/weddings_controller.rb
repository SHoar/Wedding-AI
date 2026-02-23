module Api
  class WeddingsController < BaseController
    def index
      weddings = Wedding.order(date: :asc)
      render json: weddings.map(&:as_api_json)
    end

    def show
      wedding = Wedding.find(params[:id])
      render json: wedding.as_api_json
    end

    def create
      wedding = Wedding.new(wedding_params)
      if wedding.save
        render json: wedding.as_api_json, status: :created
      else
        render_validation_errors(wedding)
      end
    end

    def update
      wedding = Wedding.find(params[:id])
      if wedding.update(wedding_params)
        render json: wedding.as_api_json
      else
        render_validation_errors(wedding)
      end
    end

    def destroy
      wedding = Wedding.find(params[:id])
      wedding.destroy!
      head :no_content
    end

    private

    def wedding_params
      params.require(:wedding).permit(:name, :date, :venue_name)
    end
  end
end
