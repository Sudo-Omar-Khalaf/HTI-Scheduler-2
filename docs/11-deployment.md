# Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the HTI Scheduler application to various production environments, including cloud platforms, containerized deployments, and traditional server setups.

## Table of Contents

1. [Production Environment Setup](#production-environment-setup)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Platform Deployments](#cloud-platform-deployments)
4. [Traditional Server Deployment](#traditional-server-deployment)
5. [Database Configuration](#database-configuration)
6. [Environment Configuration](#environment-configuration)
7. [SSL/HTTPS Setup](#ssl-https-setup)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Recovery](#backup-and-recovery)
10. [Performance Optimization](#performance-optimization)

## Production Environment Setup

### Prerequisites

- Node.js 18+ installed
- PM2 for process management
- Nginx for reverse proxy
- SSL certificate
- Domain name configured

### System Requirements

**Minimum Requirements**:
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- Network: 100 Mbps

**Recommended Requirements**:
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- Network: 1 Gbps

### Security Hardening

1. **Create dedicated user**:
```bash
# Create application user
sudo useradd -m -s /bin/bash hti-scheduler
sudo usermod -aG sudo hti-scheduler

# Switch to application user
sudo su - hti-scheduler
```

2. **Configure firewall**:
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow application port (internal only)
sudo ufw allow from localhost to any port 3001
```

3. **Set up fail2ban** (optional):
```bash
sudo apt install fail2ban

# Configure for SSH
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Docker Deployment

### Docker Configuration

#### Dockerfile for Backend

```dockerfile
# server/Dockerfile
FROM node:18-alpine

# Install system dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads temp

# Change ownership to node user
RUN chown -R node:node /usr/src/app
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

#### Dockerfile for Frontend

```dockerfile
# client/Dockerfile
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: 
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - SESSION_SECRET=${SESSION_SECRET}
      - CLIENT_URL=${CLIENT_URL}
    volumes:
      - uploads:/usr/src/app/uploads
      - temp:/usr/src/app/temp
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=${API_URL}
    depends_on:
      - backend
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - app-network
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  uploads:
  temp:
  redis-data:

networks:
  app-network:
    driver: bridge
```

#### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build: 
      context: ./server
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=3001
      - SESSION_SECRET=${SESSION_SECRET}
      - REDIS_URL=redis://redis:6379
    volumes:
      - /var/app/uploads:/usr/src/app/uploads
      - /var/app/temp:/usr/src/app/temp
    networks:
      - app-network
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    environment:
      - REACT_APP_API_URL=https://api.yourappname.com
    networks:
      - app-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - app-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 256M

volumes:
  redis-data:

networks:
  app-network:
    driver: bridge
```

### Nginx Configuration for Docker

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name yourappname.com www.yourappname.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourappname.com www.yourappname.com;

        ssl_certificate /etc/letsencrypt/live/yourappname.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourappname.com/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Increase timeouts for large file uploads
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
            client_max_body_size 50M;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            
            # Handle React Router
            try_files $uri $uri/ /index.html;
        }

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Deployment Commands

```bash
# Clone repository
git clone https://github.com/Sudo-Omar-Khalaf/HTI-Scheduler-2.git
cd HTI-Scheduler-2

# Set up environment variables
cp .env.example .env
# Edit .env with production values

# Build and start containers
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## Cloud Platform Deployments

### AWS Deployment

#### Using AWS ECS (Elastic Container Service)

1. **Create ECR repositories**:
```bash
# Create repositories
aws ecr create-repository --repository-name hti-scheduler-backend
aws ecr create-repository --repository-name hti-scheduler-frontend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push images
docker build -t hti-scheduler-backend ./server
docker tag hti-scheduler-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/hti-scheduler-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/hti-scheduler-backend:latest

docker build -t hti-scheduler-frontend ./client
docker tag hti-scheduler-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/hti-scheduler-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/hti-scheduler-frontend:latest
```

2. **ECS Task Definition**:
```json
{
  "family": "hti-scheduler",
  "taskRoleArn": "arn:aws:iam::account-id:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::account-id:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/hti-scheduler-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "SESSION_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account-id:secret:hti-scheduler/session-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/hti-scheduler",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    },
    {
      "name": "frontend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/hti-scheduler-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "REACT_APP_API_URL",
          "value": "https://api.yourappname.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/hti-scheduler",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "frontend"
        }
      }
    }
  ]
}
```

3. **CloudFormation Template** (infrastructure as code):
```yaml
# infrastructure/aws-ecs.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'HTI Scheduler ECS Deployment'

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
  SubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
  DomainName:
    Type: String
    Default: yourappname.com

Resources:
  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: hti-scheduler-cluster

  # Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: hti-scheduler-alb
      Scheme: internet-facing
      Type: application
      Subnets: !Ref SubnetIds
      SecurityGroups:
        - !Ref ALBSecurityGroup

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3001
          ToPort: 3001
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: hti-scheduler-service
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      LaunchType: FARGATE
      DesiredCount: 2
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref ECSSecurityGroup
          Subnets: !Ref SubnetIds
          AssignPublicIp: ENABLED
      LoadBalancers:
        - ContainerName: frontend
          ContainerPort: 80
          TargetGroupArn: !Ref FrontendTargetGroup
        - ContainerName: backend
          ContainerPort: 3001
          TargetGroupArn: !Ref BackendTargetGroup

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
```

### Heroku Deployment

1. **Prepare application**:
```json
// server/package.json
{
  "scripts": {
    "start": "node index.js",
    "heroku-postbuild": "cd ../client && npm install && npm run build"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

2. **Create Procfile**:
```bash
# Procfile
web: cd server && npm start
```

3. **Deploy to Heroku**:
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login and create app
heroku login
heroku create hti-scheduler-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
heroku config:set CLIENT_URL=https://hti-scheduler-app.herokuapp.com

# Add buildpacks
heroku buildpacks:add heroku/nodejs

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=2
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: hti-scheduler
services:
- name: backend
  source_dir: /server
  github:
    repo: Sudo-Omar-Khalaf/HTI-Scheduler-2
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 2
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: SESSION_SECRET
    type: SECRET
  routes:
  - path: /api
- name: frontend
  source_dir: /client
  github:
    repo: Sudo-Omar-Khalaf/HTI-Scheduler-2
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: REACT_APP_API_URL
    value: ${backend.PUBLIC_URL}
  routes:
  - path: /
```

## Traditional Server Deployment

### Ubuntu Server Setup

1. **Install dependencies**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx
```

2. **Deploy application**:
```bash
# Clone repository
cd /opt
sudo git clone https://github.com/Sudo-Omar-Khalaf/HTI-Scheduler-2.git
sudo chown -R $USER:$USER HTI-Scheduler-2
cd HTI-Scheduler-2

# Install dependencies
cd server && npm install --production
cd ../client && npm install && npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hti-scheduler-backend',
      script: './server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        SESSION_SECRET: 'your-secret-key'
      },
      log_file: '/var/log/pm2/hti-scheduler.log',
      error_file: '/var/log/pm2/hti-scheduler-error.log',
      out_file: '/var/log/pm2/hti-scheduler-out.log',
      max_memory_restart: '1G'
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

3. **Configure Nginx**:
```nginx
# /etc/nginx/sites-available/hti-scheduler
server {
    listen 80;
    server_name yourappname.com www.yourappname.com;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        client_max_body_size 50M;
    }

    # Serve React app
    location / {
        root /opt/HTI-Scheduler-2/client/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /opt/HTI-Scheduler-2/client/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hti-scheduler /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourappname.com -d www.yourappname.com
```

## Database Configuration

### Redis Setup (for session storage)

1. **Install Redis**:
```bash
# Ubuntu
sudo apt install redis-server

# Configure Redis
sudo vim /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

sudo systemctl enable redis
sudo systemctl start redis
```

2. **Configure application**:
```javascript
// server/index.js
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

### MongoDB Setup (optional, for persistent data)

1. **Install MongoDB**:
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

sudo systemctl enable mongod
sudo systemctl start mongod
```

2. **Configure application**:
```javascript
// server/models/index.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hti-scheduler', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## Environment Configuration

### Environment Variables

Create comprehensive environment files:

```bash
# .env.production
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/hti-scheduler
REDIS_URL=redis://localhost:6379

# Session
SESSION_SECRET=your-super-secret-session-key
SESSION_MAX_AGE=86400000

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=/var/app/uploads
TEMP_DIR=/var/app/temp

# External Services
CLIENT_URL=https://yourappname.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/hti-scheduler/app.log

# Security
CORS_ORIGIN=https://yourappname.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### Application Configuration

```javascript
// server/config/index.js
const config = {
  development: {
    port: process.env.PORT || 3001,
    database: {
      mongodb: process.env.MONGODB_URI || 'mongodb://localhost:27017/hti-scheduler-dev',
      redis: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000'
    }
  },
  
  production: {
    port: process.env.PORT || 3001,
    database: {
      mongodb: process.env.MONGODB_URI,
      redis: process.env.REDIS_URL
    },
    cors: {
      origin: process.env.CORS_ORIGIN
    },
    security: {
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100
      }
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

## SSL/HTTPS Setup

### Let's Encrypt with Certbot

1. **Install Certbot**:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. **Get certificates**:
```bash
# Get certificate
sudo certbot --nginx -d yourappname.com -d www.yourappname.com

# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Custom SSL Certificate

If using a custom certificate:

```nginx
# /etc/nginx/sites-available/hti-scheduler
server {
    listen 443 ssl http2;
    server_name yourappname.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_certificate_chain /path/to/your/chain.crt;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourappname.com www.yourappname.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring and Logging

### Application Monitoring with PM2

```javascript
// ecosystem.config.js (enhanced)
module.exports = {
  apps: [{
    name: 'hti-scheduler-backend',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    
    // Monitoring configuration
    monitoring: true,
    pmx: true,
    
    // Auto-restart configuration
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    
    // Log configuration
    log_file: '/var/log/pm2/hti-scheduler.log',
    error_file: '/var/log/pm2/hti-scheduler-error.log',
    out_file: '/var/log/pm2/hti-scheduler-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    
    // Health check
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }]
};
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Set up log rotation
sudo vim /etc/logrotate.d/hti-scheduler
```

```bash
# /etc/logrotate.d/hti-scheduler
/var/log/hti-scheduler/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 hti-scheduler hti-scheduler
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Application Logging

```javascript
// server/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hti-scheduler' },
  transports: [
    new winston.transports.File({
      filename: '/var/log/hti-scheduler/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: '/var/log/hti-scheduler/combined.log'
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# backup.sh

# MongoDB backup
mongodump --host localhost:27017 --db hti-scheduler --out /backup/mongodb/$(date +%Y%m%d_%H%M%S)

# Redis backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb /backup/redis/dump_$(date +%Y%m%d_%H%M%S).rdb

# Application files backup
tar -czf /backup/app/hti-scheduler_$(date +%Y%m%d_%H%M%S).tar.gz /opt/HTI-Scheduler-2

# Clean old backups (keep 30 days)
find /backup -name "*.tar.gz" -mtime +30 -delete
find /backup -name "*.rdb" -mtime +30 -delete
find /backup/mongodb -type d -mtime +30 -exec rm -rf {} +

# Upload to cloud storage (optional)
# aws s3 sync /backup s3://your-backup-bucket/
```

### Automated Backup

```bash
# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh

# Weekly full backup
0 2 * * 0 /path/to/full-backup.sh
```

### Recovery Procedures

```bash
#!/bin/bash
# restore.sh

BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 YYYYMMDD_HHMMSS"
    exit 1
fi

# Stop application
pm2 stop all

# Restore MongoDB
mongorestore --host localhost:27017 --db hti-scheduler --drop /backup/mongodb/$BACKUP_DATE/hti-scheduler

# Restore Redis
sudo systemctl stop redis
cp /backup/redis/dump_$BACKUP_DATE.rdb /var/lib/redis/dump.rdb
sudo systemctl start redis

# Restore application files
cd /opt
sudo rm -rf HTI-Scheduler-2
sudo tar -xzf /backup/app/hti-scheduler_$BACKUP_DATE.tar.gz

# Restart application
pm2 start all
```

## Performance Optimization

### Application Optimization

1. **Enable gzip compression**:
```javascript
// server/index.js
const compression = require('compression');
app.use(compression());
```

2. **Implement caching**:
```javascript
// server/middleware/cache.js
const redis = require('redis');
const client = redis.createClient();

const cache = (duration = 300) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      res.sendResponse = res.json;
      res.json = (body) => {
        client.setex(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

module.exports = cache;
```

3. **Database optimization**:
```javascript
// MongoDB indexes
db.courses.createIndex({ "code": 1 });
db.scheduleEntries.createIndex({ "course_code": 1, "day": 1, "slot": 1 });
```

### Server Optimization

1. **Nginx optimization**:
```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;

http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

2. **System optimization**:
```bash
# Increase file descriptor limits
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# TCP optimization
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_tw_buckets = 1440000" >> /etc/sysctl.conf
sudo sysctl -p
```

This comprehensive deployment guide covers all aspects of deploying the HTI Scheduler application to production environments, from containerized deployments to traditional server setups, with proper security, monitoring, and optimization configurations.
