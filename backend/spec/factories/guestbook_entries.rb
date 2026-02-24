# frozen_string_literal: true

FactoryBot.define do
  factory :guestbook_entry do
    association :wedding
    guest_name { Faker::Name.name }
    message { Faker::Lorem.paragraph(sentence_count: 2) }
    is_public { true }
  end
end
