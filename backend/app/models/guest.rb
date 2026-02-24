class Guest < ApplicationRecord
  belongs_to :wedding

  scope :for_wedding, ->(wedding_id) { wedding_id.present? ? where(wedding_id: wedding_id) : all }

  validates :name, presence: true
  validates :plus_one_count, numericality: { greater_than_or_equal_to: 0 }

  def as_api_json
    {
      id: id,
      wedding_id: wedding_id,
      name: name,
      email: email,
      phone: phone,
      plus_one_count: plus_one_count,
      dietary_notes: dietary_notes,
      created_at: created_at,
      updated_at: updated_at,
    }
  end
end
