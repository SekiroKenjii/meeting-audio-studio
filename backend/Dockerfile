FROM php:8.2-fpm

# Set working directory
WORKDIR /var/www/html

# Install system dependencies including FFmpeg for audio compression and Redis client
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    git \
    libonig-dev \
    libpng-dev \
    libpq-dev \
    libxml2-dev \
    redis-tools \
    supervisor \
    unzip \
    zip \
    && docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2.8.10 /usr/bin/composer /usr/bin/composer

# Copy custom PHP configuration for file uploads
COPY php.ini /usr/local/etc/php/conf.d/uploads.ini

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Expose ports for Laravel app, Reverb WebSocket, and Horizon dashboard
EXPOSE 8000 8081 8082

# Make startup script executable
RUN chmod +x start.sh

# Start all services
CMD ["./start.sh"]
