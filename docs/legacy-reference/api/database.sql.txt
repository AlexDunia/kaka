CREATE DATABASE IF NOT EXISTS event_management;
USE event_management;

DROP TABLE IF EXISTS events;
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    subCategories TEXT, -- JSON array of subcategory IDs
    date DATETIME,
    location VARCHAR(255),
    mainImage VARCHAR(255), -- Cloudinary link
    bannerImage VARCHAR(255), -- Cloudinary link
    price DECIMAL(10,2),
    totalTickets INT,
    availableTickets INT,
    featured BOOLEAN DEFAULT FALSE,
    organizer VARCHAR(255),
    duration VARCHAR(50),
    ticketTypes TEXT, -- JSON array of ticket types
    faqs TEXT, -- JSON array of FAQs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS categories;
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

DROP TABLE IF EXISTS subcategories;
CREATE TABLE IF NOT EXISTS subcategories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id VARCHAR(50),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Insert default categories
INSERT INTO categories (id, name) VALUES
('music', 'Music'),
('comedy', 'Comedy'),
('art', 'Arts & Culture'),
('sports', 'Sports'),
('food', 'Food & Drink'),
('tech', 'Technology'),
('business', 'Business'),
('health', 'Health & Wellness'),
('education', 'Education'),
('community', 'Community');

-- Insert default subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('sub1', 'Workshop', 'education'),
('sub2', 'Conference', 'business'),
('sub3', 'Meetup', 'community'),
('sub4', 'Webinar', 'tech'),
('sub5', 'Party', 'community'),
('sub6', 'Exhibition', 'art'),
('sub7', 'Concert', 'music'),
('sub8', 'Tournament', 'sports'),
('sub9', 'Tasting', 'food'),
('sub10', 'Hackathon', 'tech'),
('sub11', 'Networking', 'business'),
('sub12', 'Retreat', 'health'); 