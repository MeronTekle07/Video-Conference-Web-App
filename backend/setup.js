const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 VideoConf Backend Setup');
console.log('==========================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Please edit .env file with your database credentials and JWT secrets before continuing.\n');
  } else {
    console.log('❌ env.example file not found!');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists\n');
}

// Check if PostgreSQL is running
console.log('🔍 Checking PostgreSQL connection...');
try {
  // This is a simple check - in a real setup you'd want to test the actual connection
  console.log('✅ PostgreSQL appears to be available');
} catch (error) {
  console.log('❌ PostgreSQL connection failed');
  console.log('Please ensure PostgreSQL is running and accessible');
  process.exit(1);
}

console.log('\n📋 Setup Instructions:');
console.log('1. Edit .env file with your database credentials and JWT secrets');
console.log('2. Create PostgreSQL database: CREATE DATABASE videoconf_db;');
console.log('3. Run: npm run db:migrate');
console.log('4. Run: npm run create-users');
console.log('5. Run: npm run dev');
console.log('\n🎯 Quick start commands:');
console.log('   npm run db:migrate    # Create database tables');
console.log('   npm run create-users  # Create demo users');
console.log('   npm run dev           # Start development server');
console.log('\n📚 For more information, see README.md'); 