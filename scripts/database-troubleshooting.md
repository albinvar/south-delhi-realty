# 🔧 Database Connection Troubleshooting Guide

## Current Issue: ETIMEDOUT Errors

Your application is experiencing database connection timeout errors (`ETIMEDOUT`). This means the application cannot connect to the database server.

## 🚨 Immediate Actions

### 1. Check Database Server Status

**For MySQL/MariaDB:**
```bash
# Check if MySQL is running
sudo systemctl status mysql
# or
sudo systemctl status mariadb

# If not running, start it
sudo systemctl start mysql
sudo systemctl enable mysql
```

**For Docker Database:**
```bash
# Check if database container is running
docker ps | grep mysql

# If not running, start the container
docker-compose up -d db
```

### 2. Test Database Connection Manually

Run the database connection test script:
```bash
node scripts/check-db-connection.js
```

### 3. Check Environment Variables

Verify your database environment variables are set:
```bash
echo "DB_HOST: $DB_HOST"
echo "DB_USER: $DB_USER"
echo "DB_NAME: $DB_NAME"
echo "DB_PORT: $DB_PORT"
```

## 🔍 Diagnostic Steps

### Step 1: Network Connectivity Test

Test if the database server is reachable:
```bash
# Test connection to database host
telnet $DB_HOST $DB_PORT

# Or use nc (netcat)
nc -zv $DB_HOST $DB_PORT

# Or use ping
ping $DB_HOST
```

### Step 2: Database Client Connection Test

Try connecting with a MySQL client:
```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME
```

### Step 3: Check Database Logs

**For MySQL/MariaDB:**
```bash
# Check MySQL error logs
sudo tail -f /var/log/mysql/error.log

# Check slow query log
sudo tail -f /var/log/mysql/slow.log
```

**For Docker:**
```bash
# Check database container logs
docker logs mysql-container-name
```

### Step 4: Check Application Logs

```bash
# Check PM2 logs
pm2 logs south-delhi-realty

# Check application logs
tail -f logs/error.log
tail -f logs/combined.log
```

## 🛠️ Common Solutions

### Solution 1: Increase Database Connection Limits

Edit MySQL configuration (`/etc/mysql/my.cnf` or `/etc/mysql/mysql.conf.d/mysqld.cnf`):

```ini
[mysqld]
max_connections = 200
wait_timeout = 600
interactive_timeout = 600
connect_timeout = 60
max_allowed_packet = 64M
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### Solution 2: Firewall Configuration

**Ubuntu/Debian:**
```bash
# Allow MySQL port
sudo ufw allow 3306/tcp

# Or allow from specific IP
sudo ufw allow from YOUR_APP_IP to any port 3306
```

**CentOS/RHEL:**
```bash
# Allow MySQL port
sudo firewall-cmd --permanent --add-port=3306/tcp
sudo firewall-cmd --reload
```

### Solution 3: Database User Permissions

Connect to MySQL as root and check user permissions:
```sql
-- Check user permissions
SHOW GRANTS FOR 'your_db_user'@'%';
SHOW GRANTS FOR 'your_db_user'@'localhost';

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON your_database.* TO 'your_db_user'@'%';
GRANT ALL PRIVILEGES ON your_database.* TO 'your_db_user'@'localhost';
FLUSH PRIVILEGES;
```

### Solution 4: Database Connection Pool Settings

Update your database configuration in `server/db.ts`:

```typescript
const connectionConfig = {
  // ... existing config
  connectionLimit: 20,        // Increase connection limit
  acquireTimeout: 30000,      // 30 seconds
  timeout: 45000,             // 45 seconds
  connectTimeout: 45000,      // 45 seconds
  reconnect: true,
  keepAliveInitialDelay: 0,
  enableKeepAlive: true,
};
```

### Solution 5: Database Server Optimization

**MySQL Configuration Tuning:**
```ini
[mysqld]
# Connection settings
max_connections = 200
max_connect_errors = 999999
connect_timeout = 60
wait_timeout = 28800
interactive_timeout = 28800

# Buffer settings
key_buffer_size = 256M
sort_buffer_size = 2M
read_buffer_size = 2M
read_rnd_buffer_size = 8M
myisam_sort_buffer_size = 64M

# InnoDB settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_log_buffer_size = 8M
innodb_flush_log_at_trx_commit = 1
innodb_lock_wait_timeout = 50
```

## 🔧 Production Environment Specific

### For DigitalOcean Managed Database

1. **Check Database Status:**
   - Go to DigitalOcean Control Panel
   - Navigate to Databases
   - Check if your database cluster is running

2. **Connection Pool Settings:**
   - Database may have connection limits
   - Consider upgrading database plan if needed

3. **Firewall Rules:**
   - Ensure your application server IP is allowed
   - Check VPC network settings

### For External Database Providers

1. **Check Provider Status:**
   - Visit your database provider's status page
   - Check for any ongoing maintenance or outages

2. **IP Whitelist:**
   - Ensure your application server IP is whitelisted
   - Check if your hosting provider's IP ranges are allowed

## 🚨 Emergency Recovery Steps

### If Database is Completely Unavailable

1. **Switch to Backup Database:**
   ```bash
   # Update environment variables to backup DB
   export DB_HOST=backup-db-host
   export DB_NAME=backup-db-name
   
   # Restart application
   pm2 restart south-delhi-realty
   ```

2. **Enable Maintenance Mode:**
   ```bash
   # Create maintenance.html in public folder
   # Update nginx to serve maintenance page
   ```

3. **Scale Application:**
   ```bash
   # Reduce concurrent connections
   pm2 scale south-delhi-realty 1
   ```

## 📊 Monitoring and Prevention

### Set Up Database Monitoring

1. **Database Health Checks:**
   ```bash
   # Add to crontab (run every 5 minutes)
   */5 * * * * /path/to/project/scripts/check-db-connection.js
   ```

2. **Application Monitoring:**
   ```bash
   # Install PM2 monitoring
   pm2 install pm2-auto-pull
   pm2 install pm2-logrotate
   ```

3. **Log Monitoring:**
   ```bash
   # Monitor for database errors
   tail -f logs/error.log | grep -i "database\|timeout\|connection"
   ```

### Preventive Measures

1. **Regular Database Maintenance:**
   ```sql
   -- Run weekly
   OPTIMIZE TABLE properties;
   OPTIMIZE TABLE users;
   OPTIMIZE TABLE property_media;
   ```

2. **Connection Pool Monitoring:**
   - Monitor active connections
   - Set up alerts for high connection usage

3. **Database Backups:**
   ```bash
   # Daily backup
   mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup_$(date +%Y%m%d).sql
   ```

## 📞 Getting Help

If none of these solutions work:

1. **Check Application Logs:**
   ```bash
   pm2 logs south-delhi-realty --lines 100
   ```

2. **Run Full Diagnostic:**
   ```bash
   node scripts/check-db-connection.js
   ```

3. **Contact Support:**
   - Include error logs
   - Include environment configuration (without passwords)
   - Include steps you've already tried
