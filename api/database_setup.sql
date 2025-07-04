-- Drop existing tables in correct order (due to foreign key constraints)
DROP TABLE IF EXISTS blog_content;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS blog_authors;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(100) NOT NULL UNIQUE,
    customer_first_name VARCHAR(100) NOT NULL,
    customer_last_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'completed',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(30) DEFAULT 'Paystack'
);

-- Create tickets table (for individual ticket items)
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL UNIQUE,
    transaction_reference VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    ticket_type VARCHAR(100) NOT NULL,
    price_per_ticket DECIMAL(10, 2) NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    holder_name VARCHAR(200) NOT NULL,
    holder_email VARCHAR(100) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (transaction_reference) REFERENCES transactions(reference)
);

CREATE INDEX idx_transaction_reference ON tickets(transaction_reference);
CREATE INDEX idx_ticket_id ON tickets(ticket_id);
CREATE INDEX idx_holder_email ON tickets(holder_email);

-- Create blog authors table
CREATE TABLE IF NOT EXISTS blog_authors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(255),
    role VARCHAR(100),
    bio TEXT,
    social_links JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create blog posts table with updated fields
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords VARCHAR(255),
    bgimage VARCHAR(255),
    bgimage_alt VARCHAR(255),
    author_id INT NOT NULL,
    date DATE NOT NULL,
    cta_text VARCHAR(255),
    cta_link VARCHAR(255),
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES blog_authors(id)
);

-- Create blog content table
CREATE TABLE IF NOT EXISTS blog_content (
    id INT PRIMARY KEY AUTO_INCREMENT,
    blog_post_id INT NOT NULL,
    content_type ENUM('paragraph', 'image', 'heading', 'quote', 'cta') NOT NULL,
    content_order INT NOT NULL,
    content_text TEXT,
    image_url VARCHAR(255),
    image_alt VARCHAR(255),
    image_width INT,
    image_height INT,
    FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    INDEX (blog_post_id, content_order)
);

-- Insert author (KakaWorld Editorial Team instead of Soft Jo)
INSERT INTO blog_authors (id, name, display_name, avatar_url, role, social_links) VALUES (
    1,
    'KakaWorld Editorial',
    'KakaWorld Editorial',
    'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747056280/tdlogowhite_fvgocv.png',
    'Editorial Team',
    '{
        "instagram": "https://instagram.com/kakaworld",
        "twitter": "https://twitter.com/kakaworld",
        "linkedin": "https://linkedin.com/company/kakaworld"
    }'
);

-- Insert blog post about Soft Jo
INSERT INTO blog_posts (
    id, slug, title, seo_title, seo_description, seo_keywords,
    bgimage, bgimage_alt, author_id, date, cta_text, cta_link
) VALUES (
    1,
    'meet-soft-jo-journey-content-creation',
    'Meet Soft Jo: From Port Harcourt to Digital Stardom',
    'Soft Jo: Rising Nigerian Content Creator & Event Host | KakaWorld',
    'Follow Chukwudubem Joshua (Soft Jo) on his inspiring journey from humble beginnings in Port Harcourt to becoming one of Nigeria''s most engaging content creators. Discover how he overcame challenges to work with Sydney Talker, Pankeeroy, and Nastyblaq.',
    'Soft Jo,Chukwudubem Joshua,content creator,Nigerian entertainment,Uniport events,Sydney Talker,Pankeeroy,Nastyblaq,Port Harcourt content creator',
    'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747162284/kakalink_elyn4g.jpg',
    'Soft Jo - Content Creator & Event Organizer',
    1,
    '2024-03-20',
    'Buy ticket now',
    'https://kakaworld.com/events/soft-jo-campus-invasion-2025'
);

-- Insert blog content with the new paragraphs and images
INSERT INTO blog_content (blog_post_id, content_type, content_order, content_text, image_url, image_alt, image_width, image_height) VALUES
(1, 'image', 1, NULL, 'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747162284/kakalink_elyn4g.jpg', 'Soft Jo creating content', 800, 400),

(1, 'paragraph', 2, 'Chukwudubem Joshua — or as most people know him, Soft Jo — is a content creator from Delta State. He started getting noticed around 2020 in Port Harcourt. It wasn''t loud, but people started paying attention. Over time, he built a small audience that grew into something bigger. Over time, he started to work with big names like Sydney Talker, Pankeeroy, and Nastyblaq. And in 2023, he hosted one of Uniport''s biggest events. But none of that came easy.', NULL, NULL, NULL, NULL),

(1, 'paragraph', 3, 'Before the recognition, there was struggle.', NULL, NULL, NULL, NULL),

(1, 'paragraph', 4, '"I was just freeballing it," he says. No gear, no crew — just a borrowed phone and whoever was around. Sometimes he''d wait hours just to get one scene done. But he kept showing up. He''s been creating content since 2017 — not because it was trending, but because something about it just stuck. Something about it felt like home.', NULL, NULL, NULL, NULL),

(1, 'paragraph', 5, 'In 2018, he had to move from Lagos to Port Harcourt for school. Everything changed. "It was tough at first," he says, "but God was gracious."', NULL, NULL, NULL, NULL),

(1, 'paragraph', 6, 'People were starting to pay attention. But as the spotlights grew brighter, life hit hard — he lost his dad, and had to face a kind of pain he wasn''t prepared for.', NULL, NULL, NULL, NULL),

(1, 'image', 7, NULL, 'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747162284/kakalink_elyn4g.jpg', 'Soft Jo reflecting on his journey', 800, 400),

(1, 'quote', 8, 'That was when I realized… this is real life now. I have to take charge.', NULL, NULL, NULL, NULL),

(1, 'paragraph', 9, 'Every video since then has been part of something bigger. Not just to make people laugh — but to make people feel seen. "Now I see my work as self-improvement," he says. "A way to be better than I was yesterday."', NULL, NULL, NULL, NULL),

(1, 'paragraph', 10, 'Some of his best content comes from real-life stuff — the kind you don''t always post about. He''s had to learn how to trust the process. How to stay patient. How to keep going even when a video doesn''t perform the way he hoped. "It''s tough," he says. "You put your heart in something, and the numbers might not match. But I keep posting. I stay visible."', NULL, NULL, NULL, NULL),

(1, 'paragraph', 11, 'The truth? It''s not always smooth. But he''s not chasing perfection. He''s chasing growth. And it shows.', NULL, NULL, NULL, NULL),

(1, 'paragraph', 12, 'The love from fans, the messages, the comments — that''s what keeps him going. That''s the fuel. And he''s got plans — bigger than skits. "Soon, we''re moving into short films," he says. "I''ve got surprises. Just relax and enjoy the ride."', NULL, NULL, NULL, NULL),

(1, 'image', 13, NULL, 'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747162284/kakalink_elyn4g.jpg', 'Soft Jo announcing Campus Invasion 2025', 800, 400),

(1, 'heading', 14, 'One of those surprises? Soft Jo Campus Invasion 2025.', NULL, NULL, NULL, NULL),

(1, 'paragraph', 15, 'This isn''t just content. This is someone showing that real stories, even the tough ones, can still bring light.', NULL, NULL, NULL, NULL),

(1, 'paragraph', 16, 'Something real is coming.', NULL, NULL, NULL, NULL),

(1, 'paragraph', 17, 'And Soft Jo''s bringing it with him to Uniport.', NULL, NULL, NULL, NULL),

(1, 'cta', 18, 'Ready to be part of something real? Join Soft Jo at Campus Invasion 2025!', NULL, NULL, NULL, NULL);

-- Create indexes for better performance
CREATE INDEX idx_blog_posts_date ON blog_posts(date);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_content_order ON blog_content(blog_post_id, content_order);