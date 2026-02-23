class CreateGuestbookEntries < ActiveRecord::Migration[7.1]
  def change
    create_table :guestbook_entries do |t|
      t.references :wedding, null: false, foreign_key: true, index: true
      t.string :guest_name, null: false
      t.text :message, null: false
      t.boolean :is_public, null: false, default: true

      t.timestamps
    end
  end
end
