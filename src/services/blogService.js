class BlogService {
  constructor() {
    // Point to your PHP server explicitly
    this.apiUrl = '/api/blogs.php' // Adjust this URL to match your PHP server
  }

  // Get all blog posts
  async getAllPosts() {
    try {
      console.log('Fetching all posts from:', this.apiUrl) // Debug log
      const response = await fetch(this.apiUrl)
      if (!response.ok) {
        const text = await response.text()
        console.error('Server response:', text)
        throw new Error('Failed to fetch blog posts')
      }
      const result = await response.json()
      console.log('Received posts:', result) // Debug log
      return result.data
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      throw error
    }
  }

  // Get a single blog post by slug
  async getPostBySlug(slug) {
    try {
      // Make sure we don't double-slash
      const url = `${this.apiUrl}/${encodeURIComponent(slug)}`.replace(/([^:]\/)\/+/g, '$1')
      console.log('Fetching post from:', url) // Debug log
      const response = await fetch(url)
      if (!response.ok) {
        const text = await response.text()
        console.error('Server response:', text)
        throw new Error('Failed to fetch blog post')
      }
      const result = await response.json()
      console.log('Received post:', result) // Debug log
      return result.data
    } catch (error) {
      console.error('Error fetching blog post:', error)
      throw error
    }
  }
}

export default new BlogService()
