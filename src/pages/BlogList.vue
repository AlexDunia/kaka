<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import blogService from '@/services/blogService'
import { useSeo } from '@/composables/useSeo'

const router = useRouter()
const { updatePageTitle, updateMetaDescription, updateSocialMeta } = useSeo()

const posts = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    posts.value = await blogService.getAllPosts()

    // Update SEO metadata
    updatePageTitle('Blog - Event Planning Tips & Insights')
    updateMetaDescription(
      'Discover valuable insights and tips about event planning, venue selection, and event marketing strategies.',
    )
    updateSocialMeta({
      title: 'Blog - Event Planning Tips & Insights | KakaWorld',
      description:
        'Discover valuable insights and tips about event planning, venue selection, and event marketing strategies.',
      url: window.location.href,
      image: 'https://picsum.photos/1200/630',
    })
  } catch (e) {
    error.value = 'Failed to load blog posts'
    console.error('Error loading blog posts:', e)
  } finally {
    loading.value = false
  }
})

const navigateToPost = (slug) => {
  router.push(`/blog/${slug}`)
}
</script>

<template>
  <div class="blog-list">
    <h1 class="blog-title">Event Planning Blog</h1>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="skeleton" v-for="i in 3" :key="i" :style="{ '--index': i }">
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-meta"></div>
          <div class="skeleton-content-line"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <!-- Blog Posts -->
    <div v-else class="posts">
      <article
        v-for="(post, index) in posts"
        :key="post.id"
        class="post-card"
        :style="{ '--index': index }"
      >
        <!-- Image Section -->
        <div class="post-image-container" @click="navigateToPost(post.slug)">
          <img :src="post.bgimage" :alt="post.bgimage_alt" class="post-image" />
        </div>
        <!-- Content Section -->
        <div class="post-content">
          <h2 class="post-title" @click="navigateToPost(post.slug)">{{ post.title }}</h2>
          <div class="read-more" @click="navigateToPost(post.slug)">Read More →</div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.blog-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.blog-title {
  font-size: 2.5rem;
  margin-bottom: 2.5rem;
  color: #fff;
  text-align: center;
  font-weight: 700;
  background: linear-gradient(120deg, #fff, #4fc3f7);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: slideUp 0.8s ease-out;
  position: relative;
}

.blog-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #4fc3f7, transparent);
  border-radius: 2px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.posts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  perspective: 1000px;
}

.post-card {
  background: rgba(37, 35, 46, 0.4);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  transform-style: preserve-3d;
  animation: cardAppear 0.6s ease-out backwards;
  animation-delay: calc(var(--index, 0) * 0.1s);
  position: relative;
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(30px) rotateX(5deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 15px 30px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(79, 195, 247, 0.2);
  border-color: rgba(79, 195, 247, 0.2);
}

.post-image-container {
  width: 100%;
  height: 220px;
  overflow: hidden;
  position: relative;
}

.post-image-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.post-card:hover .post-image-container::after {
  opacity: 1;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  filter: brightness(0.95);
}

.post-card:hover .post-image {
  transform: scale(1.05);
  filter: brightness(1.05);
}

.post-content {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.post-title {
  font-size: 1.35rem;
  margin: 0 0 1.2rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  line-height: 1.3;
  font-weight: 600;
}

.post-title:hover {
  color: #4fc3f7;
  transform: translateX(3px);
}

.read-more {
  color: #4fc3f7;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.read-more:hover {
  transform: translateX(3px);
  opacity: 1;
  color: #81d4fa;
}

/* Loading State */
.loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

.skeleton {
  background: rgba(37, 35, 46, 0.4);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  animation: skeletonAppear 0.6s ease-out backwards;
  animation-delay: calc(var(--index, 0) * 0.1s);
}

@keyframes skeletonAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.skeleton::before {
  content: '';
  display: block;
  height: 220px;
  background: linear-gradient(90deg, #232323 0%, #2c2c2c 50%, #232323 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-content {
  padding: 1.5rem;
}

.skeleton-title,
.skeleton-meta,
.skeleton-content-line {
  background: linear-gradient(90deg, #232323 0%, #2c2c2c 50%, #232323 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.skeleton-title {
  height: 1.8rem;
  width: 80%;
}

.skeleton-meta {
  height: 1rem;
  width: 60%;
}

.skeleton-content-line {
  height: 1rem;
  width: 100%;
}

/* Error State */
.error {
  text-align: center;
  color: #ff5252;
  padding: 1.5rem;
  font-size: 1.1rem;
  background: rgba(255, 82, 82, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 82, 82, 0.2);
  backdrop-filter: blur(10px);
  animation: fadeIn 0.6s ease-out;
}

@media (max-width: 768px) {
  .blog-list {
    width: 92%;
    margin: 0 auto;
    padding: 1.25rem;
  }

  .blog-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .posts {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .post-image-container {
    height: 200px;
  }

  .post-title {
    font-size: 1.25rem;
  }

  .post-content {
    padding: 1.25rem;
  }

  .read-more {
    font-size: 0.85rem;
  }
}
</style>
