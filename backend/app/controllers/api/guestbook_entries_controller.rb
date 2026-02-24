module Api
  class GuestbookEntriesController < BaseController
    def index
      entries = GuestbookEntry.for_wedding(params[:wedding_id]).order(created_at: :desc)
      render json: entries.map(&:as_api_json)
    end

    def show
      entry = GuestbookEntry.find(params[:id])
      render json: entry.as_api_json
    end

    def create
      wedding_id = guestbook_entry_params[:wedding_id]
      entry = GuestbookEntry.new(guestbook_entry_params.except(:wedding_id))
      entry.wedding = resolve_wedding!(wedding_id)

      if entry.save
        render json: entry.as_api_json, status: :created
      else
        render_validation_errors(entry)
      end
    end

    def update
      entry = GuestbookEntry.find(params[:id])
      entry.wedding = resolve_wedding!(guestbook_entry_params[:wedding_id]) if guestbook_entry_params[:wedding_id].present?

      if entry.update(guestbook_entry_params.except(:wedding_id))
        render json: entry.as_api_json
      else
        render_validation_errors(entry)
      end
    end

    def destroy
      entry = GuestbookEntry.find(params[:id])
      entry.destroy!
      head :no_content
    end

    private

    def guestbook_entry_params
      params.require(:guestbook_entry).permit(
        :wedding_id,
        :guest_name,
        :message,
        :is_public,
      )
    end
  end
end
