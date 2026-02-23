class Wedding < ApplicationRecord
  has_many :guests, dependent: :destroy
  has_many :guestbook_entries, dependent: :destroy
  has_many :tasks, dependent: :destroy

  validates :name, presence: true
  validates :venue_name, presence: true
  validates :date, presence: true

  def as_api_json
    {
      id: id,
      name: name,
      date: date,
      venue_name: venue_name,
      created_at: created_at,
      updated_at: updated_at,
    }
  end
end
