#!/bin/bash

# TenFingers - Let's Encrypt Initialization Script
# Creates dummy certificates and obtains real ones from Let's Encrypt
# Based on: https://github.com/wmnnd/nginx-certbot

set -e

# Load environment variables from .env.production
if [ -f ".env.production" ]; then
    set -a
    source .env.production
    set +a
fi

domains="DOMAIN_PLACEHOLDER"
rsa_key_size=4096
email="EMAIL_PLACEHOLDER" # Adding a valid address is strongly recommended
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

echo "### Downloading recommended TLS parameters ..."
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  sh -c '\
    if [ ! -e /etc/letsencrypt/options-ssl-nginx.conf ]; then \
      wget -q -O /etc/letsencrypt/options-ssl-nginx.conf https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf; \
    fi && \
    if [ ! -e /etc/letsencrypt/ssl-dhparams.pem ]; then \
      wget -q -O /etc/letsencrypt/ssl-dhparams.pem https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem; \
    fi \
  '" certbot
echo

echo "### Creating dummy certificate for $domains ..."
path="/etc/letsencrypt/live/$domains"
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  sh -c '\
    mkdir -p $path && \
    openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
      -keyout $path/privkey.pem \
      -out $path/fullchain.pem \
      -subj /CN=localhost \
  '" certbot
echo


echo "### Starting nginx ..."
docker-compose -f docker-compose.prod.yml up --force-recreate -d nginx
echo

echo "### Deleting dummy certificate for $domains ..."
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot
echo


echo "### Requesting Let's Encrypt certificate for $domains ..."

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    -d $domains \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Reloading nginx ..."
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo ""
echo "### SSL setup complete! ###"
echo "Your site should now be accessible via HTTPS at https://$domains"
