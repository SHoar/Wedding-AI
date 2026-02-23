class CreateWeddings < ActiveRecord::Migration[7.1]
  def change
    create_table :weddings do |t|
      t.string :name, null: false
      t.date :date, null: false
      t.string :venue_name, null: false

      t.timestamps
    end
  end
end
