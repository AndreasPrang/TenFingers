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

# Get server IPs
CURRENT_IPV4=$(curl -4 -s ifconfig.me 2>/dev/null || curl -4 -s icanhazip.com 2>/dev/null)
CURRENT_IPV6=$(curl -6 -s ifconfig.me 2>/dev/null || curl -6 -s icanhazip.com 2>/dev/null)

# Get domain IPs
DOMAIN_IPV4=$(dig +short A $DOMAIN | head -n1)
DOMAIN_IPV6=$(dig +short AAAA $DOMAIN | head -n1)

print_info "Server IPv4: $CURRENT_IPV4"
print_info "Domain IPv4: $DOMAIN_IPV4"
print_info "Server IPv6: $CURRENT_IPV6"
print_info "Domain IPv6: $DOMAIN_IPV6"

# Check if at least one IP matches
IPV4_MATCH=false
IPV6_MATCH=false

if [ -n "$CURRENT_IPV4" ] && [ "$CURRENT_IPV4" = "$DOMAIN_IPV4" ]; then
    IPV4_MATCH=true
    print_success "IPv4 DNS correctly configured!"
fi

if [ -n "$CURRENT_IPV6" ] && [ "$CURRENT_IPV6" = "$DOMAIN_IPV6" ]; then
    IPV6_MATCH=true
    print_success "IPv6 DNS correctly configured!"
fi

if [ "$IPV4_MATCH" = false ] && [ "$IPV6_MATCH" = false ]; then
    print_warning "DNS does not point to this server!"
    print_warning "At least one IP address (IPv4 or IPv6) must match."
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Please configure DNS and run this script again."
        exit 1
    fi
fi

##############################################################################
# Step 3: Stop Services
##############################################################################

print_header "Step 3: Stopping Services"

print_info "Stopping nginx, frontend, and certbot to free port 80..."
docker-compose -f docker-compose.prod.yml stop nginx frontend certbot 2>/dev/null || true
print_success "Services stopped"

##############################################################################
# Step 4: Request SSL Certificate
##############################################################################

print_header "Step 4: Requesting SSL Certificate"

CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

# Check if certificate files already exist (simpler check without running certbot)
print_info "Checking for existing SSL certificate..."
if docker-compose -f docker-compose.prod.yml run --rm --entrypoint sh certbot -c "test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null; then
    print_success "SSL certificate for $DOMAIN already exists!"
    print_info "Skipping certificate request..."
else
    print_info "Requesting new SSL certificate for $DOMAIN..."
    print_info "Contacting Let's Encrypt servers (this may take 30-90 seconds)..."
    echo ""

    # Run certbot with visible output for better feedback
    # Override entrypoint to run certonly instead of the default renew loop
    docker-compose -f docker-compose.prod.yml run --rm --entrypoint certbot certbot \
        certonly \
        --standalone \
        --email "$ADMIN_EMAIL" \
        --agree-tos \
        --no-eff-email \
        --cert-name "$DOMAIN" \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"

    CERTBOT_EXIT_CODE=$?
    echo ""

    if [ $CERTBOT_EXIT_CODE -eq 0 ]; then
        print_success "SSL certificate obtained successfully!"
    else
        print_error "Failed to obtain SSL certificate! (Exit code: $CERTBOT_EXIT_CODE)"
        print_warning "Possible reasons:"
        print_warning "  • DNS not properly configured"
        print_warning "  • Port 80 blocked by firewall"
        print_warning "  • Let's Encrypt rate limit reached"
        print_info "Check logs above for details"
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
