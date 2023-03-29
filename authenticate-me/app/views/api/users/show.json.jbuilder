json.user do
  json.extract! @user, :id, :email, :username, :created_at, :updated_at
end

# this is how our response is being formatted as it is sent back to our frontend
# EX: {user: {id, email, username, created_at, updated_at}}