class CreateTasks < ActiveRecord::Migration[7.1]
  def change
    create_table :tasks do |t|
      t.references :wedding, null: false, foreign_key: true, index: true
      t.string :title, null: false
      t.integer :status, null: false, default: 0
      t.integer :priority, null: false, default: 1

      t.timestamps
    end
  end
end
