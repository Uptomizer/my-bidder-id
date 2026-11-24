FROM php:8.4-apache

# 1. Install system dependencies, PostgreSQL driver, GD (with WebP/JPEG/PNG), and Node.js 22
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libwebp-dev \
    libfreetype6-dev \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        gd \
        bcmath \
        zip \
        opcache \
        pcntl \
    && a2enmod rewrite headers \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 3. Configure PHP upload & memory limits for auction image compression
RUN { \
    echo "upload_max_filesize = 20M"; \
    echo "post_max_size = 25M"; \
    echo "memory_limit = 256M"; \
    echo "max_execution_time = 120"; \
} > /usr/local/etc/php/conf.d/uploads.ini

# 4. Configure Apache DocumentRoot to Laravel's /public folder
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# 5. Install PHP dependencies first (layer caching)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# 6. Install Node dependencies (layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# 7. Copy application source code, generate autoloader, and build Vite React assets
COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && npm run build \
    && rm -rf node_modules

# 8. Ensure storage & bootstrap/cache directories exist and have writable permissions
RUN mkdir -p storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        storage/app/public/auctions \
        storage/app/public/payments \
        bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 10000

# 9. Startup command: bind Apache to dynamic $PORT (Render/Koyeb), create storage symlink, and start server
CMD ["sh", "-c", "PORT=${PORT:-10000}; sed -i \"s/Listen 80/Listen ${PORT}/g\" /etc/apache2/ports.conf; sed -i \"s/:80/:${PORT}/g\" /etc/apache2/sites-available/*.conf; php artisan storage:link --force || true; php artisan config:clear; php artisan route:clear; apache2-foreground"]
