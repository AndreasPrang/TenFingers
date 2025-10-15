#!/bin/bash

##############################################################################
# TenFingers - Automated Domain Setup Script
#
# This script automates the complete domain setup process:
# 1. Reads domain from .env file
# 2. Generates nginx configuration
# 3. Requests SSL certificate
# 4. Starts all services
#
# Usage: ./setup-domain.sh
##############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_info "Please copy .env.production.example to .env and configure it."
    exit 1
fi

# Load environment variables
print_info "Loading environment variables from .env..."
source .env

# Check required variables
if [ -z "$DOMAIN" ]; then
    print_error "DOMAIN variable not set in .env file!"
    exit 1
fi

if [ -z "$ADMIN_EMAIL" ]; then
    print_error "ADMIN_EMAIL variable not set in .env file!"
    exit 1
fi

print_success "Configuration loaded:"
print_info "  Domain: $DOMAIN"
print_info "  Admin Email: $ADMIN_EMAIL"

##############################################################################
# Step 1: Generate Nginx Configuration
##############################################################################

print_header "Step 1: Generating Nginx Configuration"

if [ ! -f nginx.conf.template ]; then
    print_error "nginx.conf.template not found!"
    exit 1
fi

print_info "Generating nginx.conf from template..."
sed "s/{{DOMAIN}}/$DOMAIN/g" nginx.conf.template > nginx.conf
print_success "nginx.conf generated successfully"

##############################################################################
# Step 2: Check DNS
##############################################################################

print_header "Step 2: Checking DNS Configuration"

print_info "Checking if $DOMAIN points to this server..."
CURRENT_IP=$(curl -s ifconfig.me || curl -s icanhazip.com)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

print_info "Server IP: $CURRENT_IP"
print_info "Domain IP: $DOMAIN_IP"

if [ "$CURRENT_IP" != "$DOMAIN_IP" ]; then
    print_warning "DNS does not point to this server yet!"
    print_warning "Current server IP: $CURRENT_IP"
    print_warning "Domain resolves to: $DOMAIN_IP"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Please configure DNS and run this script again."
        exit 1
    fi
else
    print_success "DNS is correctly configured!"
fi

##############################################################################
# Step 3: Stop Services
##############################################################################

print_header "Step 3: Stopping Services"

print_info "Stopping nginx and frontend to free port 80..."
docker-compose -f docker-compose.prod.yml stop nginx frontend 2>/dev/null || true
print_success "Services stopped"

##############################################################################
# Step 4: Request SSL Certificate
##############################################################################

print_header "Step 4: Requesting SSL Certificate"

CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

# Check if certificate already exists
if docker-compose -f docker-compose.prod.yml run --rm certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
    print_success "SSL certificate for $DOMAIN already exists!"
    print_info "Skipping certificate request..."
else
    print_info "Requesting new SSL certificate for $DOMAIN..."

    docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
        --standalone \
        --email "$ADMIN_EMAIL" \
        --agree-tos \
        --no-eff-email \
        --cert-name "$DOMAIN" \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"

    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained successfully!"
    else
        print_error "Failed to obtain SSL certificate!"
        print_warning "You can try again later or check Let's Encrypt rate limits"
        exit 1
    fi
fi

##############################################################################
# Step 5: Start All Services
##############################################################################

print_header "Step 5: Starting All Services"

print_info "Starting all services with docker-compose..."
docker-compose -f docker-compose.prod.yml up -d

print_info "Waiting for services to be healthy..."
sleep 5

##############################################################################
# Step 6: Verify Deployment
##############################################################################

print_header "Step 6: Verifying Deployment"

# Check if containers are running
print_info "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

# Check HTTP redirect
print_info "Testing HTTP to HTTPS redirect..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN || echo "000")
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
    print_success "HTTP redirect working (Status: $HTTP_RESPONSE)"
else
    print_warning "HTTP redirect returned status: $HTTP_RESPONSE"
fi

# Check HTTPS
print_info "Testing HTTPS connection..."
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    print_success "HTTPS working (Status: $HTTPS_RESPONSE)"
else
    print_warning "HTTPS returned status: $HTTPS_RESPONSE"
fi

##############################################################################
# Done!
##############################################################################

print_header "✓ Setup Complete!"

echo ""
print_success "Your application is now running at:"
echo ""
echo -e "  ${GREEN}https://$DOMAIN${NC}"
echo ""
print_info "Next steps:"
echo "  • Check https://$DOMAIN to verify the site is working"
echo "  • SSL certificate will auto-renew via cron job"
echo "  • Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""

##############################################################################
# SSL Auto-Renewal Setup
##############################################################################

print_info "Setting up SSL auto-renewal..."
CRON_CMD="0 0,12 * * * cd $(pwd) && docker-compose -f docker-compose.prod.yml run --rm certbot renew --quiet && docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "certbot renew"; then
    print_success "SSL auto-renewal cron job already configured"
else
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    print_success "SSL auto-renewal cron job added"
fi

echo ""
print_success "🎉 All done! Enjoy your TenFingers deployment!"
echo ""
