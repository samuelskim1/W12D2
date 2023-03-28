# json.array! @teas, :id, :flavor, :price, :description

@teas.each do |tea_ele|
  json.set! tea_ele.id do
    # json.id tea.id
    # json.flavor tea.flavor
    # json.price tea.price
    # json.banana tea.description
    # json.extract! tea, :id, :flavor, :price, :description
    json.partial! '/api/teas/tea', tea: tea_ele
  end
end

# {
#   1:
#   2: 
#   3:
#   4:
# }