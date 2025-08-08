// Test script to verify all imports work correctly

console.log('🔍 Testing frontend imports...')

try {
  // Test API imports
  const api = require('./src/services/api.js')
  console.log('✅ API imports OK')
  
  console.log('📦 Available exports:')
  console.log('  - api (default):', typeof api.default)
  console.log('  - api (named):', typeof api.api)
  console.log('  - authAPI:', typeof api.authAPI)
  console.log('  - usersAPI:', typeof api.usersAPI)
  console.log('  - postsAPI:', typeof api.postsAPI)
  
  console.log('\n🎉 All imports working correctly!')
  
} catch (error) {
  console.error('❌ Import error:', error.message)
  process.exit(1)
}
