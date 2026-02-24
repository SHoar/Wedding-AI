# frozen_string_literal: true

FactoryBot.define do
  factory :guest do
    association :wedding
    name { Faker::Name.name }
    email { Faker::Internet.email }
    phone { Faker::PhoneNumber.phone_number }
    plus_one_count { 0 }
    dietary_notes { nil }
  end
end
