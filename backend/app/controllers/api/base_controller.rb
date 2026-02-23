module Api
  class BaseController < ApplicationController
    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

    private

    def render_not_found(error)
      render json: { error: error.message }, status: :not_found
    end

    def render_validation_errors(record)
      render json: { errors: record.errors.to_hash(true) }, status: :unprocessable_entity
    end

    def resolve_wedding!(wedding_id)
      return Wedding.find(wedding_id) if wedding_id.present?

      Wedding.first || Wedding.create!(
        name: "Alex & Jordan Wedding",
        date: Date.current + 90.days,
        venue_name: "Rose Garden Estate",
      )
    end
  end
end
