class GuestbookEntry < ApplicationRecord
  belongs_to :wedding

  validates :guest_name, presence: true
  validates :message, presence: true

  scope :publicly_visible, -> { where(is_public: true) }

  def as_api_json
    {
      id: id,
      wedding_id: wedding_id,
      guest_name: guest_name,
      message: message,
      is_public: is_public,
      created_at: created_at,
      updated_at: updated_at,
    }
  end
end
