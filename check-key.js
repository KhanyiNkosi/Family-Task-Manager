// check-key.js - Simple JWT key validator
const anonKey = process.argv[2] || '';

console.log('=== JWT KEY VALIDATOR ===');
console.log('Key length:', anonKey.length);
console.log('Key starts with "eyJ":', anonKey.startsWith('eyJ'));

const parts = anonKey.split('.');
console.log('Number of parts:', parts.length);

if (parts.length === 3) {
  console.log('✅ Valid JWT format (3 parts)');
  
  try {
    // Try to decode the parts
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    console.log('Header:', JSON.stringify(header, null, 2));
    console.log('Payload - iss:', payload.iss);
    console.log('Payload - role:', payload.role);
    console.log('Payload - exp:', new Date(payload.exp * 1000).toISOString());
    
    if (payload.role === 'anon') {
      console.log('✅ Correct role: anon');
    } else {
      console.log('❌ Wrong role:', payload.role);
    }
    
  } catch (err) {
    console.log('❌ Cannot decode JWT:', err.message);
  }
} else {
  console.log('❌ INVALID: JWT must have 3 parts separated by dots');
  console.log('Example: header.payload.signature');
}

console.log('');
