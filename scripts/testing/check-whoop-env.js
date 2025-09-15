const dotenv = require('dotenv');
dotenv.config();

console.log('🔍 Checking WHOOP environment variables:');
console.log('WHOOP_CLIENT_ID exists:', !!process.env.WHOOP_CLIENT_ID);
console.log('WHOOP_CLIENT_SECRET exists:', !!process.env.WHOOP_CLIENT_SECRET);
console.log('WHOOP_CLIENT_ID length:', process.env.WHOOP_CLIENT_ID?.length || 0);
console.log('WHOOP_CLIENT_SECRET length:', process.env.WHOOP_CLIENT_SECRET?.length || 0);

if (process.env.WHOOP_CLIENT_ID) {
    console.log('WHOOP_CLIENT_ID starts with:', process.env.WHOOP_CLIENT_ID.substring(0, 8) + '...');
}
if (process.env.WHOOP_CLIENT_SECRET) {
    console.log('WHOOP_CLIENT_SECRET starts with:', process.env.WHOOP_CLIENT_SECRET.substring(0, 8) + '...');
}
