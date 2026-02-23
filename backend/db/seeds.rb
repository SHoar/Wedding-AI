wedding = Wedding.find_or_create_by!(name: "Alex & Jordan Wedding") do |record|
  record.date = Date.current + 90.days
  record.venue_name = "Rose Garden Estate"
end

Guest.find_or_create_by!(wedding: wedding, name: "Taylor Morgan") do |record|
  record.email = "taylor@example.com"
  record.phone = "+1 555 111 2222"
  record.plus_one_count = 1
  record.dietary_notes = "Vegetarian"
end

GuestbookEntry.find_or_create_by!(wedding: wedding, guest_name: "Sam Lee") do |record|
  record.message = "Wishing you both a lifetime of joy and adventure!"
  record.is_public = true
end

Task.find_or_create_by!(wedding: wedding, title: "Confirm caterer final headcount") do |record|
  record.status = :in_progress
  record.priority = :high
end
