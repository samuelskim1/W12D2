
json.tea do
  json.partial! 'tea', tea: @tea
  json.transactionIds @tea.transaction_ids
end

# transactions = @tea.transactions.includes(:user)

json.transactions do
  # @tea.transactions.each do |transaction|
  @transactions.each do |transaction|
    json.set! transaction.id do
      json.extract! transaction, :id, :quantity
      json.customer transaction.user.username
    end
  end
end