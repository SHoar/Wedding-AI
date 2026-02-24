# frozen_string_literal: true

FactoryBot.define do
  factory :wedding do
    name { "Alex & Jordan Wedding" }
    date { 90.days.from_now.to_date }
    venue_name { "Rose Garden Estate" }
  end
end
