// Replace this event's previous selection rather than incrementing a stale cart.
// Other events stay in the cart and are not silently added to this checkout.
export function commitEventSelection(cart, profile, selection) {
  if (!profile.canBuy || !selection.length) return false
  if (new Set(selection.map((item) => item.key)).size !== selection.length) return false
  const current = new Map(profile.tickets.map((ticket) => [ticket.key, ticket]))
  if (
    selection.some((item) => {
      const ticket = current.get(item.key)
      return (
        !ticket?.available ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > ticket.max
      )
    })
  )
    return false
  for (const item of [...cart.items])
    if (Number(item.eventId) === Number(profile.id)) cart.removeItem(item.eventId, item.ticketId)
  for (const item of selection) {
    const ticket = current.get(item.key)
    cart.addItem({
      demo: profile.demo === true,
      eventId: profile.id,
      eventTitle: profile.title,
      eventDate: profile.date,
      eventLocation: profile.venue,
      eventImage: profile.cover,
      ticketType: ticket.name,
      ticketId: ticket.id,
      quantity: item.quantity,
      pricePerTicket: ticket.price,
      totalPrice: ticket.price * item.quantity,
    })
  }
  return true
}
