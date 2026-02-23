module Api
  class GuestsController < BaseController
    def index
      guests = if params[:wedding_id].present?
                 Guest.where(wedding_id: params[:wedding_id])
               else
                 Guest.all
               end

      render json: guests.order(created_at: :desc).map(&:as_api_json)
    end

    def show
      guest = Guest.find(params[:id])
      render json: guest.as_api_json
    end

    def create
      wedding_id = guest_params[:wedding_id]
      guest = Guest.new(guest_params.except(:wedding_id))
      guest.wedding = resolve_wedding!(wedding_id)

      if guest.save
        render json: guest.as_api_json, status: :created
      else
        render_validation_errors(guest)
      end
    end

    def update
      guest = Guest.find(params[:id])
      attributes = guest_params.except(:wedding_id)
      guest.wedding = resolve_wedding!(guest_params[:wedding_id]) if guest_params[:wedding_id].present?

      if guest.update(attributes)
        render json: guest.as_api_json
      else
        render_validation_errors(guest)
      end
    end

    def destroy
      guest = Guest.find(params[:id])
      guest.destroy!
      head :no_content
    end

    private

    def guest_params
      params.require(:guest).permit(
        :wedding_id,
        :name,
        :email,
        :phone,
        :plus_one_count,
        :dietary_notes,
      )
    end
  end
end
