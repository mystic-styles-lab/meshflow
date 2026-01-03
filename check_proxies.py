import requests
import json

# Get proxies
response = requests.get("http://127.0.0.1:8000/api/balancer/proxies")
proxies = response.json()

print("Proxies data:")
print(json.dumps(proxies, indent=2, ensure_ascii=False))
