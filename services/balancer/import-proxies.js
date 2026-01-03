const proxies = [
  {
    name: "PROXY1-SOCKS5",
    host: "45.139.31.229",
    port: 64753,
    protocol: "socks5",
    username: "As4f2nja",
    password: "rDbz8tjw",
    enabled: true,
    priority: 10,
  },
  {
    name: "PROXY2-SOCKS5",
    host: "185.111.27.238",
    port: 63031,
    protocol: "socks5",
    username: "As4f2nja",
    password: "rDbz8tjw",
    enabled: false,
    priority: 10,
  },
  {
    name: "PROXY3-SOCKS5",
    host: "130.49.37.44",
    port: 64707,
    protocol: "socks5",
    username: "As4f2nja",
    password: "rDbz8tjw",
    enabled: true,
    priority: 0,
  },
];

async function importProxies() {
  console.log('Starting proxy import...');
  
  for (const proxy of proxies) {
    try {
      const response = await fetch('http://localhost:9000/api/proxies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxy),
      });
      
      if (response.ok) {
        console.log(`✓ Added: ${proxy.name}`);
      } else if (response.status === 409) {
        console.log(`⊘ Skipped (already exists): ${proxy.name}`);
      } else {
        const error = await response.text();
        console.error(`✗ Error adding ${proxy.name}: ${error}`);
      }
    } catch (error) {
      console.error(`✗ Error adding ${proxy.name}:`, error.message);
    }
  }
  
  console.log('\nImport completed!');
}

importProxies();
