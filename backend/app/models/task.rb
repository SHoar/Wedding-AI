class Task < ApplicationRecord
  belongs_to :wedding

  scope :for_wedding, ->(wedding_id) { wedding_id.present? ? where(wedding_id: wedding_id) : all }

  enum :status, { pending: 0, in_progress: 1, done: 2 }, default: :pending
  enum :priority, { low: 0, medium: 1, high: 2 }, default: :medium

  validates :title, presence: true

  def as_api_json
    {
      id: id,
      wedding_id: wedding_id,
      title: title,
      status: status,
      status_value: self.class.statuses[status],
      priority: priority,
      priority_value: self.class.priorities[priority],
      created_at: created_at,
      updated_at: updated_at,
    }
  end
end
