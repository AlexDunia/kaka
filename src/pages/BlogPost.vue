<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import blogService from '@/services/blogService'
import { useSeo } from '@/composables/useSeo'

const route = useRoute()
const router = useRouter()
const { updatePageTitle, updateMetaDescription, updateSocialMeta } = useSeo()

const post = ref(null)
const loading = ref(true)
const error = ref(null)

// Load blog post
const loadBlogPost = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch(`/api/blog-posts/${route.params.id}`)
    if (!response.ok) {
      throw new Error('Failed to load blog post')
    }

    const data = await response.json()
    post.value = data

    // Update SEO metadata
    updatePageTitle(post.value.title)
    updateMetaDescription(post.value.excerpt || post.value.content.substring(0, 155))
    updateSocialMeta({
      title: post.value.title,
      description: post.value.excerpt || post.value.content.substring(0, 155),
      image: post.value.image,
      url: window.location.href,
    })
  } catch (e) {
    error.value = 'Failed to load blog post. Please try again later.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBlogPost()
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const goBack = () => {
  router.push('/blog')
}

const shareUrl = computed(() => encodeURIComponent(window.location.href))
const shareText = computed(() =>
  encodeURIComponent(post.value?.title || 'Check out this blog post!'),
)

// Add new computed property for reading time
const estimatedReadingTime = computed(() => {
  if (!post.value?.content || !Array.isArray(post.value.content)) return '0 min read'

  // Get all paragraph blocks
  const paragraphBlocks = post.value.content.filter((block) => block?.type === 'paragraph')

  // Count total words from all paragraph blocks
  const totalWords = paragraphBlocks.reduce((count, block) => {
    return count + (block?.content?.split(/\s+/).length || 0)
  }, 0)

  // Calculate minutes based on 200 words per minute
  const minutes = Math.ceil(totalWords / 200)

  return `${minutes} min read`
})
</script>

<template>
  <div class="blog-post">
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="goBack" class="back-button">← Back to Blog</button>
    </div>

    <template v-else>
      <!-- Fixed Share Bar -->
      <div class="blog-share-bar" v-if="post">
        <div class="author-meta">
          <span class="author-avatar">
            <img
              v-if="post.author?.avatar_url"
              :src="post.author.avatar_url"
              :alt="post.author.display_name || post.author.name"
              class="author-img"
            />
            <svg
              v-else
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="16" cy="16" r="16" fill="#444" />
              <text
                x="16"
                y="21"
                text-anchor="middle"
                fill="#fff"
                font-size="16"
                font-family="Arial"
                font-weight="bold"
              >
                {{ post.author?.display_name?.[0] || post.author?.name?.[0] || '?' }}
              </text>
            </svg>
          </span>
          <div class="author-info">
            <span class="post-author">{{ post.author?.display_name || post.author?.name }}</span>
            <span class="author-role" v-if="post.author?.role">{{ post.author.role }}</span>
          </div>
          <span class="dot">•</span>
          <span class="post-date">{{ formatDate(post.date) }}</span>
          <span class="dot">•</span>
          <span class="reading-time">
            <svg
              class="clock-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="9" stroke-width="2" />
              <path d="M12 7v5l3 3" stroke-width="2" stroke-linecap="round" />
            </svg>
            {{ estimatedReadingTime }}
          </span>
        </div>
        <div class="share-links">
          <span>Share:</span>
          <a
            :href="`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`"
            target="_blank"
            rel="noopener"
            aria-label="Share on Twitter"
            class="share-btn twitter"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.73 0-4.942 2.21-4.942 4.932 0 .386.045.763.127 1.124C7.728 8.89 4.1 7.13 1.671 4.149c-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.237-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.868 9.868 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A9.936 9.936 0 0 0 24 4.557z"
              />
            </svg>
          </a>
          <a
            :href="`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`"
            target="_blank"
            rel="noopener"
            aria-label="Share on Facebook"
            class="share-btn facebook"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"
              />
            </svg>
          </a>
          <a
            :href="`https://wa.me/?text=${shareText}%20${shareUrl}`"
            target="_blank"
            rel="noopener"
            aria-label="Share on WhatsApp"
            class="share-btn whatsapp"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.363.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.617h-.001a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.991c-.003 5.45-4.437 9.884-9.88 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05.001C5.495.001.001 5.495.001 12.053c0 2.123.555 4.198 1.607 6.032L.057 23.925a1.001 1.001 0 0 0 1.225 1.225l5.858-1.607a11.888 11.888 0 0 0 5.91 1.511h.005c6.557 0 11.95-5.393 11.953-11.951a11.87 11.87 0 0 0-3.489-8.413"
              />
            </svg>
          </a>
          <a
            :href="`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareText}`"
            target="_blank"
            rel="noopener"
            aria-label="Share on LinkedIn"
            class="share-btn linkedin"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.784 1.764-1.75 1.764zm13.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.036 0 3.6 2 3.6 4.59v5.606z"
              />
            </svg>
          </a>
        </div>
      </div>

      <!-- Back Button -->
      <button @click="goBack" class="back-button">← Back to Blog</button>

      <!-- Loading State -->
      <div v-if="loading" class="loading">
        <div class="skeleton-header">
          <div class="skeleton-title"></div>
          <div class="skeleton-meta"></div>
        </div>
        <div class="skeleton-content">
          <div class="skeleton-block" v-for="i in 3" :key="i"></div>
        </div>
      </div>

      <!-- Content -->
      <article v-else-if="post" class="blog-content">
        <h1 class="blog-title">{{ post.title }}</h1>

        <!-- Dynamic Content -->
        <template v-if="Array.isArray(post.content)">
          <div v-for="(block, index) in post.content" :key="index" class="content-block">
            <!-- Paragraph -->
            <p v-if="block?.type === 'paragraph'" class="text-block">
              {{ block.content }}
            </p>

            <!-- Image -->
            <figure v-else-if="block?.type === 'image'" class="image-block">
              <div class="image-container">
                <img :src="block.url" :alt="block.alt || ''" class="blog-image" />
              </div>
              <figcaption v-if="block.alt" class="image-caption">{{ block.alt }}</figcaption>
            </figure>

            <!-- Heading -->
            <h2 v-else-if="block?.type === 'heading'" class="section-heading">
              {{ block.content }}
            </h2>

            <!-- Quote -->
            <blockquote v-else-if="block?.type === 'quote'" class="quote-block">
              {{ block.content }}
            </blockquote>

            <!-- Call to Action -->
            <div v-else-if="block?.type === 'cta'" class="cta-block">
              <p class="cta-text">{{ block.content }}</p>
              <a
                href="https://kakaworld.co/events/soft-jos-campus-invasion-the-experience"
                class="cta-button"
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy here
              </a>
            </div>
          </div>
        </template>

        <!-- Add author bio at the end of the article -->
        <div v-if="post.author?.bio" class="author-bio">
          <div class="author-bio-header">
            <img
              v-if="post.author.avatar_url"
              :src="post.author.avatar_url"
              :alt="post.author.display_name || post.author.name"
              class="author-bio-img"
            />
            <div class="author-bio-info">
              <h3>{{ post.author.display_name || post.author.name }}</h3>
              <p class="author-bio-role">{{ post.author.role }}</p>
            </div>
          </div>
          <p class="author-bio-text">{{ post.author.bio }}</p>
          <div v-if="post.author.social_links" class="author-social-links">
            <a
              v-for="(url, platform) in post.author.social_links"
              :key="platform"
              :href="url"
              target="_blank"
              rel="noopener noreferrer"
              class="author-social-link"
            >
              {{ platform }}
            </a>
          </div>
        </div>
      </article>
    </template>
  </div>
</template>

<style scoped>
.blog-post {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  color: #fff;
  background: transparent;
  padding-top: 110px;
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

.error-message {
  text-align: center;
  color: #ff5252;
  padding: 2rem;
  font-size: 1.2rem;
  background: rgba(255, 82, 82, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 82, 82, 0.2);
  backdrop-filter: blur(10px);
}

.back-button {
  background: none;
  border: none;
  color: #4fc3f7;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  margin-bottom: 2rem;
  display: inline-flex;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  letter-spacing: 0.02em;
  position: relative;
  border-radius: 6px;
}

.back-button:hover {
  color: #81d4fa;
  background: rgba(79, 195, 247, 0.1);
  transform: translateX(-4px);
}

.back-button::before {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 0;
  left: 50%;
  background: #4fc3f7;
  transition: all 0.3s ease;
}

.back-button:hover::before {
  width: 80%;
  left: 10%;
}

.blog-share-bar {
  position: fixed;
  top: 97px;
  left: 0;
  width: 100%;
  z-index: 100;
  background: rgba(18, 18, 18, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.7rem 1.5rem;
  gap: 2.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.blog-share-bar.hidden {
  transform: translateY(-100%);
}

.author-meta {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: #b0b0b0;
  font-size: 1.05rem;
  font-weight: 400;
  transition: transform 0.3s ease;
}

.author-meta:hover {
  transform: translateY(-2px);
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
}

.author-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: #222;
  transition: transform 0.3s ease;
}

.author-avatar:hover .author-img {
  transform: scale(1.1);
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.post-author {
  color: #fff;
  font-weight: 500;
  transition: color 0.2s ease;
}

.author-info:hover .post-author {
  color: #4fc3f7;
}

.author-role {
  font-size: 0.8rem;
  color: #888;
  transition: color 0.2s ease;
}

.dot {
  font-size: 1.2em;
  color: #666;
  margin: 0 0.5rem;
}

.reading-time {
  color: #b0b0b0;
  font-size: 1.05rem;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: color 0.2s ease;
}

.reading-time:hover {
  color: #fff;
}

.clock-icon {
  opacity: 0.85;
  transition: transform 0.3s ease;
}

.reading-time:hover .clock-icon {
  transform: rotate(360deg);
}

.share-links {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1rem;
  color: #b0b0b0;
}

.share-links span {
  font-weight: 500;
  color: #b0b0b0;
}

.share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 0.1rem;
  position: relative;
  overflow: hidden;
}

.share-btn::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: currentColor;
  border-radius: 50%;
  transform: scale(0);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.share-btn:hover::before {
  transform: scale(1);
  opacity: 0.1;
}

.share-btn svg {
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.share-btn:hover svg {
  transform: scale(1.1);
}

.share-btn.twitter:hover {
  background: #1da1f2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(29, 161, 242, 0.3);
}

.share-btn.facebook:hover {
  background: #1877f3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 119, 243, 0.3);
}

.share-btn.whatsapp:hover {
  background: #25d366;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
}

.share-btn.linkedin:hover {
  background: #0077b5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 119, 181, 0.3);
}

.blog-title {
  font-size: 2.7rem;
  color: #fff;
  font-weight: 800;
  margin: 2rem 0;
  line-height: 1.15;
  animation: slideUp 0.8s ease-out;
  background: linear-gradient(120deg, #fff, #4fc3f7);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
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

.content-block {
  margin-bottom: 2.2rem;
  animation: fadeIn 0.6s ease-out backwards;
  animation-delay: calc(var(--index, 0) * 0.1s);
}

.text-block {
  color: #f5f5f5;
  font-size: 1.18rem;
  font-weight: 400;
  margin: 0;
  letter-spacing: 0.01em;
  line-height: 1.7;
  transition: color 0.2s ease;
}

.text-block:hover {
  color: #fff;
}

.image-block {
  margin: 2.5rem 0 1.2rem 0;
  text-align: center;
  perspective: 1000px;
}

.image-container {
  width: 100%;
  max-width: 800px;
  height: 400px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.image-container:hover {
  transform: translateY(-5px) rotateX(2deg);
  box-shadow: 0 15px 35px rgba(79, 195, 247, 0.2);
}

.blog-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-container:hover .blog-image {
  transform: scale(1.05);
}

.image-caption {
  text-align: center;
  color: #b0b0b0;
  font-size: 0.98rem;
  margin-top: 1rem;
  font-style: italic;
  transition: color 0.2s ease;
}

.image-block:hover .image-caption {
  color: #fff;
}

.section-heading {
  font-size: 1.8rem;
  color: #fff;
  margin: 2.5rem 0 1.5rem;
  position: relative;
  padding-left: 1rem;
}

.section-heading::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: #4fc3f7;
  border-radius: 2px;
  transform: scaleY(0.6);
  transition: transform 0.3s ease;
}

.section-heading:hover::before {
  transform: scaleY(1);
}

.quote-block {
  border-left: 4px solid #4fc3f7;
  padding: 1.5rem 2rem;
  font-style: italic;
  margin: 2rem 0;
  color: #b0b0b0;
  font-size: 1.1rem;
  background: rgba(79, 195, 247, 0.05);
  border-radius: 0 8px 8px 0;
  transition: all 0.3s ease;
}

.quote-block:hover {
  color: #fff;
  background: rgba(79, 195, 247, 0.1);
  transform: translateX(5px);
}

.loading {
  padding: 2rem 0;
}

.skeleton-header {
  margin-bottom: 2rem;
}

.skeleton-title,
.skeleton-meta,
.skeleton-block {
  background: linear-gradient(90deg, #222 0%, #333 50%, #222 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 1rem;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-title {
  height: 3rem;
  width: 80%;
}

.skeleton-meta {
  height: 1rem;
  width: 40%;
}

.skeleton-block {
  height: 100px;
  margin-bottom: 2rem;
}

.author-bio {
  margin-top: 4rem;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.author-bio::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(79, 195, 247, 0.05), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.author-bio:hover::before {
  transform: translateX(100%);
}

.author-bio:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.author-bio-header {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.author-bio-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(79, 195, 247, 0.2);
  transition: all 0.3s ease;
}

.author-bio:hover .author-bio-img {
  border-color: rgba(79, 195, 247, 0.4);
  transform: scale(1.05);
}

.author-bio-info h3 {
  margin: 0;
  color: #fff;
  font-size: 1.4rem;
  transition: color 0.2s ease;
}

.author-bio:hover .author-bio-info h3 {
  color: #4fc3f7;
}

.author-bio-role {
  color: #888;
  margin: 0.4rem 0 0;
  font-size: 1rem;
}

.author-bio-text {
  color: #ddd;
  line-height: 1.8;
  font-size: 1.1rem;
  transition: color 0.2s ease;
}

.author-bio:hover .author-bio-text {
  color: #fff;
}

.author-social-links {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.author-social-link {
  color: #4fc3f7;
  text-decoration: none;
  text-transform: capitalize;
  padding: 0.5rem 1rem;
  background: rgba(79, 195, 247, 0.1);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.author-social-link:hover {
  background: rgba(79, 195, 247, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.15);
}

.cta-block {
  margin: 4rem 0;
  padding: 3rem;
  background: linear-gradient(135deg, rgba(2, 13, 19, 0.8), rgba(2, 13, 19, 0.6));
  border-radius: 16px;
  text-align: center;
  border: 1px solid rgba(79, 195, 247, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.cta-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(79, 195, 247, 0.05), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.cta-block:hover::before {
  transform: translateX(100%);
}

.cta-block:hover {
  transform: translateY(-3px);
  border-color: rgba(79, 195, 247, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.cta-text {
  color: #fff;
  font-size: 1.8rem;
  margin-bottom: 2rem;
  line-height: 1.4;
  font-weight: 600;
  transition: transform 0.3s ease;
}

.cta-block:hover .cta-text {
  transform: scale(1.02);
}

.cta-button {
  display: inline-block;
  background: #4fc3f7;
  color: #000;
  padding: 1rem 2.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.cta-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-100%) rotate(45deg);
  transition: transform 0.6s ease;
}

.cta-button:hover::before {
  transform: translateX(100%) rotate(45deg);
}

.cta-button:hover {
  background: #81d4fa;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 195, 247, 0.3);
}

@media (max-width: 768px) {
  .blog-share-bar {
    display: none;
  }

  .blog-post {
    width: 92%;
    margin: 0 auto;
    padding: 1rem;
    padding-top: 1rem;
  }

  .blog-title {
    font-size: 2rem;
  }

  .post-meta {
    font-size: 0.9rem;
  }

  .text-block {
    font-size: 1.1rem;
  }

  .share-links {
    font-size: 0.9rem;
  }

  .read-more {
    font-size: 0.9rem;
  }

  .content-blocks {
    font-size: 1rem;
  }

  .image-caption {
    font-size: 0.9rem;
  }

  .image-container {
    height: 250px;
    max-width: 100%;
  }

  .reading-time {
    font-size: 0.9rem;
  }

  .clock-icon {
    width: 12px;
    height: 12px;
  }

  .author-bio {
    padding: 1.5rem;
    margin-top: 3rem;
  }

  .author-bio-img {
    width: 60px;
    height: 60px;
  }

  .cta-block {
    margin: 2.5rem 0;
    padding: 2rem 1.5rem;
  }

  .cta-text {
    font-size: 1.4rem;
    margin-bottom: 1.8rem;
  }

  .cta-button {
    padding: 0.9rem 2rem;
    font-size: 1rem;
  }

  .share-btn {
    width: 2.1rem;
    height: 2.1rem;
  }
}
</style>
