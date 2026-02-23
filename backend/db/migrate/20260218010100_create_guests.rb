class CreateGuests < ActiveRecord::Migration[7.1]
  def change
    create_table :guests do |t|
      t.references :wedding, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.string :email
      t.string :phone
      t.integer :plus_one_count, null: false, default: 0
      t.text :dietary_notes

      t.timestamps
    end
  end
end
