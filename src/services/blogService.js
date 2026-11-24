// Phase 1A provides no Laravel blog endpoints.
const unavailable = async () => {
  throw new Error('Event stories are not available yet.')
}
export default { getAllPosts: unavailable, getPostBySlug: unavailable }
