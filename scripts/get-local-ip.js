#!/usr/bin/env node

/**
 * Helper script to find your local IP address for mobile testing
 * Run: node scripts/get-local-ip.js
 */

const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address,
        });
      }
    }
  }

  return addresses;
}

console.log('\n🌐 Local Network IP Addresses:\n');

const addresses = getLocalIPAddress();

if (addresses.length === 0) {
  console.log('❌ No local network IP addresses found.');
  console.log('   Make sure you are connected to a network (WiFi or Ethernet).\n');
} else {
  addresses.forEach(({ interface: iface, address }, index) => {
    console.log(`${index + 1}. ${iface}: ${address}`);
  });

  console.log('\n📝 To enable mobile access:\n');
  console.log('1. Update your .env.local file:');
  console.log(`   NEXT_PUBLIC_APP_URL=http://${addresses[0].address}:3000\n`);
  console.log('2. Restart your dev server:');
  console.log('   npm run dev\n');
  console.log('3. Make sure your phone is on the same WiFi network\n');
  console.log('4. Try accessing the QR code upload feature again!\n');
}
