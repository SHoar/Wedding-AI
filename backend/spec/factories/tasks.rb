# frozen_string_literal: true

FactoryBot.define do
  factory :task do
    association :wedding
    title { Faker::Lorem.sentence(word_count: 3) }
    status { :pending }
    priority { :medium }
  end
end
