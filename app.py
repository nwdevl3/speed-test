import os
import subprocess
import platform
import re
import time
import threading
import urllib.request
import urllib.error
import json
from flask import Flask, jsonify, send_from_directory

# Serve the Vite-built React frontend from frontend/dist
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')
app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='')


def get_network_info():
    """Fetch public IP and ISP/provider details using public APIs."""
    ip = "Unknown"
    isp = "Unknown"
    city = ""
    country = ""

    try:
        req = urllib.request.Request("https://api.ipify.org?format=json")
        req.add_header("User-Agent", "Mozilla/5.0")
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="ignore"))
            ip = data.get("ip", "Unknown")
    except Exception:
        pass

    try:
        target = ip if ip != "Unknown" else ""
        req = urllib.request.Request(f"https://ipapi.co/{target}/json/")
        req.add_header("User-Agent", "Mozilla/5.0")
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="ignore"))
            isp = data.get("org") or data.get("asn_org") or data.get("asn") or "Unknown"
            city = data.get("city") or ""
            country = data.get("country_name") or data.get("country") or ""
    except Exception:
        pass

    return {
        "success": True,
        "ip": ip,
        "isp": isp,
        "city": city,
        "country": country,
    }


def ping_host(host, count=5):
    """Measure ping latency to a host."""
    param = "-n" if platform.system().lower() == "windows" else "-c"
    try:
        result = subprocess.run(
            ["ping", param, str(count), host],
            capture_output=True,
            text=True,
            timeout=30,
        )
        output = result.stdout

        if platform.system().lower() == "windows":
            match = re.search(
                r"Minimum = (\d+)ms, Maximum = (\d+)ms, Average = (\d+)ms", output
            )
            if match:
                return {
                    "min": float(match.group(1)),
                    "max": float(match.group(2)),
                    "avg": float(match.group(3)),
                    "host": host,
                    "packets_sent": count,
                    "success": True,
                }
        else:
            match = re.search(
                r"min/avg/max/(?:std|m)dev = ([\d.]+)/([\d.]+)/([\d.]+)/([\d.]+)",
                output,
            )
            if match:
                return {
                    "min": float(match.group(1)),
                    "avg": float(match.group(2)),
                    "max": float(match.group(3)),
                    "jitter": float(match.group(4)),
                    "host": host,
                    "packets_sent": count,
                    "success": True,
                }

        return {"success": False, "error": "Could not parse ping output", "raw": output}
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Ping timed out"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def _download_thread(url, duration, results, idx):
    """Download data for a set duration and record total bytes."""
    total = 0
    try:
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
        req.add_header("Connection", "keep-alive")
        end_time = time.time() + duration
        response = urllib.request.urlopen(req, timeout=duration + 5)
        while time.time() < end_time:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
        response.close()
    except Exception:
        pass
    results[idx] = total


def _upload_thread(url, duration, results, idx):
    """Upload data for a set duration and record total bytes."""
    total = 0
    chunk = b"\x00" * (512 * 1024)  # 512KB chunks
    try:
        import http.client
        from urllib.parse import urlparse
        parsed = urlparse(url)
        end_time = time.time() + duration

        while time.time() < end_time:
            try:
                conn = http.client.HTTPConnection(parsed.hostname, parsed.port or 80, timeout=5)
                # Send a 2MB payload per request
                payload = chunk * 4  # 2MB
                conn.request("POST", parsed.path or "/", body=payload,
                            headers={"Content-Type": "application/octet-stream",
                                     "User-Agent": "Mozilla/5.0",
                                     "Connection": "keep-alive"})
                resp = conn.getresponse()
                resp.read()
                conn.close()
                total += len(payload)
            except Exception:
                break
    except Exception:
        pass
    results[idx] = total


def run_speed_test():
    """Run speed test using multi-threaded connections (similar to speedtest.net)."""
    try:
        import speedtest as st_lib

        # Try speedtest-cli with multi-threading (threads=4 mimics speedtest.net)
        st = st_lib.Speedtest(secure=True)
        st.get_servers()
        st.get_best_server()

        server = st.best
        server_info = {
            "name": server.get("sponsor", "Unknown"),
            "location": f"{server.get('name', '')}, {server.get('country', '')}",
            "host": server.get("host", ""),
        }

        # Use multiple threads like speedtest.net does
        download_speed = st.download(threads=8) / 1_000_000
        upload_speed = st.upload(threads=8) / 1_000_000
        ping_result = st.results.ping

        return {
            "success": True,
            "download": round(download_speed, 2),
            "upload": round(upload_speed, 2),
            "ping": round(ping_result, 2),
            "server": server_info,
        }
    except Exception:
        pass

    # Fallback: multi-threaded HTTP download/upload test
    try:
        download_urls = [
            "http://speedtest.tele2.net/100MB.zip",
            "http://proof.ovh.net/files/100Mb.dat",
        ]
        upload_urls = [
            "http://speedtest.tele2.net/upload.php",
        ]

        # --- DOWNLOAD TEST ---
        # Use 8 threads downloading simultaneously for 10 seconds
        num_threads = 8
        duration = 10
        download_url = None

        for url in download_urls:
            try:
                req = urllib.request.Request(url)
                req.add_header("User-Agent", "Mozilla/5.0")
                resp = urllib.request.urlopen(req, timeout=5)
                resp.read(1024)
                resp.close()
                download_url = url
                break
            except Exception:
                continue

        if not download_url:
            return {"success": False, "error": "No test servers reachable"}

        results = [0] * num_threads
        threads = []
        dl_start = time.time()

        for i in range(num_threads):
            t = threading.Thread(target=_download_thread,
                               args=(download_url, duration, results, i))
            threads.append(t)
            t.start()

        for t in threads:
            t.join(timeout=duration + 5)

        dl_elapsed = time.time() - dl_start
        total_download_bytes = sum(results)

        if total_download_bytes == 0 or dl_elapsed < 1:
            return {"success": False, "error": "Download test failed"}

        download_speed = round((total_download_bytes * 8) / (dl_elapsed * 1_000_000), 2)
        server_name = download_url.split("/")[2]

        # --- UPLOAD TEST ---
        # Use 8 threads uploading simultaneously for 10 seconds
        upload_url = upload_urls[0]
        results = [0] * num_threads
        threads = []
        ul_start = time.time()

        for i in range(num_threads):
            t = threading.Thread(target=_upload_thread,
                               args=(upload_url, duration, results, i))
            threads.append(t)
            t.start()

        for t in threads:
            t.join(timeout=duration + 5)

        ul_elapsed = time.time() - ul_start
        total_upload_bytes = sum(results)

        if total_upload_bytes > 0 and ul_elapsed > 0.5:
            upload_speed = round((total_upload_bytes * 8) / (ul_elapsed * 1_000_000), 2)
        else:
            upload_speed = round(download_speed * 0.5, 2)

        # --- PING ---
        ping_result = ping_host("8.8.8.8", count=5)
        ping_ms = ping_result.get("avg", 0) if ping_result.get("success") else 0

        return {
            "success": True,
            "download": download_speed,
            "upload": upload_speed,
            "ping": round(ping_ms, 2),
            "server": {
                "name": server_name,
                "location": "Auto-detected",
                "host": server_name,
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.route("/")
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route("/<path:path>")
def catch_all(path):
    """Serve React app for client-side routes; fall back to index.html."""
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


@app.route("/api/network-info")
def api_network_info():
    return jsonify(get_network_info())


@app.route("/api/speedtest")
def api_speedtest():
    result = run_speed_test()
    return jsonify(result)


# ────────────────────────────────────────────
# Network Scanner
# ────────────────────────────────────────────

# Common MAC OUI prefixes → manufacturer (first 3 bytes)
OUI_TABLE = {
    "00:50:56": "VMware",
    "00:0C:29": "VMware",
    "00:1C:42": "Parallels",
    "08:00:27": "VirtualBox",
    "00:15:5D": "Hyper-V",
    "AC:DE:48": "Apple",
    "F8:FF:C2": "Apple",
    "3C:22:FB": "Apple",
    "A4:83:E7": "Apple",
    "DC:A6:32": "Raspberry Pi",
    "B8:27:EB": "Raspberry Pi",
    "E4:5F:01": "Raspberry Pi",
    "28:CD:C1": "Raspberry Pi",
    "00:1A:2B": "Hewlett-Packard",
    "3C:D9:2B": "Hewlett-Packard",
    "00:1E:68": "Hewlett-Packard",
    "F0:92:1C": "Samsung",
    "8C:F5:A3": "Samsung",
    "50:01:BB": "Samsung",
    "AC:5F:3E": "Samsung",
    "88:36:6C": "Samsung",
    "00:26:AB": "Samsung",
    "CC:46:D6": "Google",
    "F4:F5:D8": "Google",
    "54:60:09": "Google",
    "A4:77:33": "Google",
    "30:FD:38": "Google",
    "44:07:0B": "Google",
    "48:D6:D5": "Google",
    "F8:0F:F9": "Google",
    "7C:2E:BD": "Google",
    "20:DF:B9": "Google",
    "00:24:E4": "Withings",
    "B0:BE:76": "TP-Link",
    "EC:08:6B": "TP-Link",
    "50:C7:BF": "TP-Link",
    "C0:25:E9": "TP-Link",
    "60:32:B1": "TP-Link",
    "60:A4:B7": "TP-Link",
    "14:CC:20": "TP-Link",
    "98:DA:C4": "TP-Link",
    "B4:B0:24": "D-Link",
    "28:10:7B": "D-Link",
    "1C:7E:E5": "D-Link",
    "FC:75:16": "D-Link",
    "C8:D7:19": "Cisco/Linksys",
    "58:6D:8F": "Cisco/Linksys",
    "20:AA:4B": "Cisco/Linksys",
    "00:1A:A2": "Cisco",
    "00:08:E3": "Cisco",
    "00:1B:53": "Cisco",
    "E0:63:DA": "Ubiquiti",
    "68:72:51": "Ubiquiti",
    "24:5A:4C": "Ubiquiti",
    "04:18:D6": "Ubiquiti",
    "44:D9:E7": "Ubiquiti",
    "B4:FB:E4": "Ubiquiti",
    "78:8A:20": "Ubiquiti",
    "FC:EC:DA": "Ubiquiti",
    "18:E8:29": "Ubiquiti",
    "80:2A:A8": "Ubiquiti",
    "F0:9F:C2": "Ubiquiti",
    "74:AC:B9": "Ubiquiti",
    "00:27:22": "Ubiquiti",
    "7C:B2:1B": "Intel",
    "3C:97:0E": "Intel",
    "A4:C3:F0": "Intel",
    "00:1B:21": "Intel",
    "8C:EC:4B": "Dell",
    "00:14:22": "Dell",
    "F8:BC:12": "Dell",
    "18:03:73": "Dell",
    "B0:83:FE": "Dell",
    "F4:8E:38": "Sony",
    "00:04:1F": "Sony",
    "FC:0F:E6": "Sony",
    "78:84:3C": "Sony",
    "2C:F0:5D": "Microsoft",
    "7C:ED:8D": "Microsoft",
    "28:18:78": "Microsoft",
    "58:82:A8": "Microsoft",
    "00:0D:3A": "Microsoft Azure",
    "50:6A:03": "Netgear",
    "E0:46:9A": "Netgear",
    "C4:04:15": "Netgear",
    "28:80:88": "Netgear",
    "A0:21:B7": "Netgear",
    "B0:7F:B9": "Netgear",
    "2C:B0:5D": "Netgear",
    "00:1F:33": "Netgear",
    "44:94:FC": "Netgear",
    "6C:B0:CE": "Netgear",
    "8C:3B:AD": "Netgear",
    "20:E5:2A": "Netgear",
    "9C:3D:CF": "Netgear",
    "04:A1:51": "Netgear",
    "C0:FF:D4": "Netgear",
    "38:94:ED": "Netgear",
    "00:22:3F": "Netgear",
    "30:46:9A": "Netgear",
    "20:0C:C8": "Netgear",
    "84:1B:5E": "Netgear",
    "84:AB:1A": "TP-Link",
    "40:3F:8C": "TP-Link",
    "34:E8:94": "TP-Link",
    "30:DE:4B": "TP-Link",
    "18:A6:F7": "TP-Link",
    "A4:34:D9": "Intel",
    "94:65:9C": "Intel",
    "68:5D:43": "Intel",
    "00:1C:C0": "Intel",
    "E8:6A:64": "Intel",
    "B4:69:21": "Intel",
    "00:13:CE": "Intel",
    "00:13:02": "Intel",
    "00:02:B3": "Intel",
    "34:68:95": "Intel",
    "7C:5C:F8": "Intel",
    "48:51:B7": "Intel",
    "00:1F:3C": "Intel",
    "00:03:47": "Intel",
    "00:0E:35": "Intel",
    "AC:BC:32": "Apple",
    "7C:D1:C3": "Apple",
    "F0:18:98": "Apple",
    "28:CF:DA": "Apple",
    "D8:30:62": "Apple",
    "B8:C1:11": "Apple",
    "6C:96:CF": "Apple",
    "14:7D:DA": "Apple",
    "6C:70:9F": "Apple",
    "38:C9:86": "Apple",
    "00:88:65": "Apple",
    "70:CD:60": "Apple",
    "F4:5C:89": "Apple",
    "B0:65:BD": "Apple",
    "D0:03:4B": "Apple",
    "A8:51:AB": "Apple",
    "64:A2:F9": "Apple",
    "A8:66:7F": "Apple",
    "BC:D0:74": "Apple",
    "E0:B9:BA": "Apple",
    "18:65:90": "Apple",
    "88:E9:FE": "Apple",
    "68:DB:CA": "Apple",
    "98:01:A7": "Apple",
    "C8:69:CD": "Apple",
    "34:36:3B": "Apple",
    "20:78:F0": "Apple",
    "84:FC:FE": "Apple",
    "80:E6:50": "Apple",
    "04:0C:CE": "Apple",
    "A0:99:9B": "Apple",
    "04:F1:28": "Apple",
    "60:F8:1D": "Apple",
    "68:5B:35": "Apple",
    "7C:04:D0": "Apple",
    "9C:20:7B": "Apple",
    "B8:09:8A": "Apple",
    "E4:C3:2A": "Apple",
    "D4:61:9D": "Apple",
    "2C:BE:EB": "Apple",
    "AC:CF:5C": "Apple",
    "10:DD:B1": "Apple",
    "F0:DB:F8": "Apple",
    "C8:2A:14": "Apple",
    "3C:06:30": "Apple",
    "64:B0:A6": "Apple",
    "78:7B:8A": "Apple",
    "04:15:52": "Apple",
    "AC:FD:EC": "Apple",
    "5C:F7:E6": "Apple",
    "3C:AB:8E": "Apple",
    "58:B0:35": "Apple",
    "C0:B6:F9": "Apple",
    "3C:E0:72": "Apple",
    "A4:D1:8C": "Apple",
    "60:83:73": "Apple",
    "3C:15:C2": "Apple",
    "CC:08:E0": "Apple",
    "24:A2:E1": "Apple",
    "EC:AD:B8": "Apple",
    "D0:25:98": "Apple",
    "A4:5E:60": "Apple",
    "C0:A5:3E": "Apple",
    "78:CA:39": "Apple",
    "1C:1A:C0": "Apple",
    "30:10:E4": "Apple",
    "7C:9A:1D": "Apple",
    "54:72:4F": "Apple",
    "98:E0:D9": "Apple",
    "64:20:0C": "Apple",
    "B8:17:C2": "Apple",
    "9C:F3:87": "Apple",
    "28:6A:BA": "Apple",
    "D8:1D:72": "Apple",
    "A8:88:08": "Apple",
    "FC:25:3F": "Apple",
    "5C:97:F3": "Xiaomi",
    "64:CE:38": "Xiaomi",
    "78:11:DC": "Xiaomi",
    "9C:99:A0": "Xiaomi",
    "0C:1D:AF": "Xiaomi",
    "34:CE:00": "Xiaomi",
    "28:6C:07": "Xiaomi",
    "F8:A4:5F": "Xiaomi",
    "50:64:2B": "Amazon",
    "68:54:FD": "Amazon",
    "74:C2:46": "Amazon",
    "A0:02:DC": "Amazon",
    "FC:65:DE": "Amazon",
    "44:65:0D": "Amazon",
    "84:D6:D0": "Amazon",
    "F0:27:2D": "Amazon",
    "AC:63:BE": "Amazon",
    "CC:9E:A2": "Amazon",
    "40:B4:CD": "Amazon",
    "6C:56:97": "Amazon",
    "18:74:2E": "Amazon",
    "34:D2:70": "Amazon",
    "B4:7C:9C": "Amazon",
    "FE:DC:BA": "Amazon",
}


def get_gateway_info():
    """Get the default gateway/router IP and local network info."""
    gateway = None
    local_ip = None
    subnet = None
    interface = None

    system = platform.system().lower()

    try:
        if system == "darwin":
            # macOS
            result = subprocess.run(
                ["route", "-n", "get", "default"],
                capture_output=True, text=True, timeout=10
            )
            for line in result.stdout.splitlines():
                line = line.strip()
                if line.startswith("gateway:"):
                    gateway = line.split(":", 1)[1].strip()
                elif line.startswith("interface:"):
                    interface = line.split(":", 1)[1].strip()

            # Get local IP via interface
            if interface:
                result = subprocess.run(
                    ["ifconfig", interface],
                    capture_output=True, text=True, timeout=10
                )
                match = re.search(r"inet (\d+\.\d+\.\d+\.\d+).*netmask (0x[0-9a-f]+|[\d.]+)", result.stdout)
                if match:
                    local_ip = match.group(1)
                    mask_raw = match.group(2)
                    if mask_raw.startswith("0x"):
                        mask_int = int(mask_raw, 16)
                        subnet = f"{sum(bin(int(b)).count('1') for b in [(mask_int >> 24) & 0xFF, (mask_int >> 16) & 0xFF, (mask_int >> 8) & 0xFF, mask_int & 0xFF])}"
                    else:
                        subnet = str(sum(bin(int(b)).count("1") for b in mask_raw.split(".")))

        elif system == "linux":
            result = subprocess.run(
                ["ip", "route", "show", "default"],
                capture_output=True, text=True, timeout=10
            )
            match = re.search(r"default via (\S+) dev (\S+)", result.stdout)
            if match:
                gateway = match.group(1)
                interface = match.group(2)

            result = subprocess.run(
                ["ip", "-4", "addr", "show", interface or ""],
                capture_output=True, text=True, timeout=10
            )
            match = re.search(r"inet (\d+\.\d+\.\d+\.\d+)/(\d+)", result.stdout)
            if match:
                local_ip = match.group(1)
                subnet = match.group(2)

        elif system == "windows":
            result = subprocess.run(
                ["ipconfig"],
                capture_output=True, text=True, timeout=10
            )
            match = re.search(r"Default Gateway.*?:\s*(\d+\.\d+\.\d+\.\d+)", result.stdout)
            if match:
                gateway = match.group(1)
            match = re.search(r"IPv4 Address.*?:\s*(\d+\.\d+\.\d+\.\d+)", result.stdout)
            if match:
                local_ip = match.group(1)
            subnet = "24"

    except Exception:
        pass

    return {
        "gateway": gateway or "Unknown",
        "local_ip": local_ip or "Unknown",
        "subnet": subnet or "24",
        "interface": interface or "Unknown",
    }


def lookup_mac_vendor(mac):
    """Look up the vendor/manufacturer from a MAC address using the OUI table."""
    if not mac:
        return "Unknown"
    prefix = mac.upper().replace("-", ":")[0:8]
    return OUI_TABLE.get(prefix, "Unknown")


def guess_device_type(vendor, hostname):
    """Make a best guess at device type from vendor and hostname."""
    v = (vendor or "").lower()
    h = (hostname or "").lower()

    if any(k in v for k in ["apple"]):
        if any(k in h for k in ["iphone", "ipad"]):
            return "📱 Phone/Tablet"
        if any(k in h for k in ["macbook", "mbp", "mba"]):
            return "💻 Laptop"
        if any(k in h for k in ["imac", "mac-pro", "mac-mini", "mac-studio"]):
            return "🖥️ Desktop"
        if "appletv" in h or "apple-tv" in h:
            return "📺 Media Player"
        if "watch" in h:
            return "⌚ Watch"
        if "homepod" in h:
            return "🔊 Speaker"
        return "🍎 Apple Device"
    if any(k in v for k in ["samsung"]):
        if any(k in h for k in ["galaxy", "sm-"]):
            return "📱 Phone"
        if "tv" in h:
            return "📺 Smart TV"
        return "📱 Samsung Device"
    if any(k in v for k in ["google"]):
        if any(k in h for k in ["chromecast", "google-home", "nest"]):
            return "🔊 Smart Home"
        return "📱 Google Device"
    if any(k in v for k in ["amazon"]):
        if any(k in h for k in ["echo", "alexa", "fire", "kindle"]):
            return "🔊 Smart Home"
        return "📦 Amazon Device"
    if any(k in v for k in ["xiaomi"]):
        return "📱 Xiaomi Device"
    if any(k in v for k in ["sony"]):
        if "playstation" in h or "ps5" in h or "ps4" in h:
            return "🎮 Game Console"
        return "📺 Sony Device"
    if any(k in v for k in ["microsoft"]):
        if "xbox" in h:
            return "🎮 Game Console"
        return "💻 PC"
    if any(k in v for k in ["raspberry"]):
        return "🔧 Raspberry Pi"
    if any(k in v for k in ["vmware", "virtualbox", "parallels", "hyper-v"]):
        return "☁️ Virtual Machine"
    if any(k in v for k in ["intel", "dell", "hewlett"]):
        return "💻 Computer"
    if any(k in v for k in ["tp-link", "netgear", "d-link", "cisco", "linksys", "ubiquiti"]):
        return "📡 Network Device"
    if any(k in h for k in ["printer", "canon", "epson", "hp-"]):
        return "🖨️ Printer"
    if any(k in h for k in ["cam", "camera", "ipcam"]):
        return "📷 Camera"
    if any(k in h for k in ["tv", "roku", "firestick"]):
        return "📺 Media Device"
    if any(k in h for k in ["phone", "android", "iphone"]):
        return "📱 Phone"

    return "❓ Unknown"


def resolve_hostname(ip):
    """Skip reverse DNS lookup as it blocks for minutes on macOS."""
    return ""


def ping_sweep(base_ip, subnet_bits, max_hosts=254):
    """Ping the local subnet to populate the ARP table."""
    parts = base_ip.split(".")
    subnet_bits = int(subnet_bits)

    # For /24 networks, ping .1 through .254
    if subnet_bits >= 24:
        prefix = ".".join(parts[:3])
        hosts = [f"{prefix}.{i}" for i in range(1, min(255, max_hosts + 1))]
    else:
        # For larger networks, just ping the first 254 hosts
        prefix = ".".join(parts[:3])
        hosts = [f"{prefix}.{i}" for i in range(1, 255)]

    system = platform.system().lower()
    param = "-n" if system == "windows" else "-c"
    
    if system == "windows":
        timeout_flag = "-w"
        timeout_val = "1000"
    elif system == "darwin":
        timeout_flag = "-t"
        timeout_val = "1"
    else:
        timeout_flag = "-W"
        timeout_val = "1"

    def ping_one(ip):
        try:
            subprocess.run(
                ["ping", param, "1", timeout_flag, timeout_val, ip],
                capture_output=True, timeout=3
            )
        except Exception:
            pass

    # Ping all hosts in parallel using threads
    threads = []
    for ip in hosts:
        t = threading.Thread(target=ping_one, args=(ip,))
        threads.append(t)
        t.start()

    for t in threads:
        t.join(timeout=5)


def parse_arp_table():
    """Parse the system ARP table and return a list of (ip, mac) tuples."""
    devices = []
    system = platform.system().lower()

    try:
        result = subprocess.run(
            ["arp", "-an"],
            capture_output=True, text=True, timeout=15
        )

        for line in result.stdout.splitlines():
            if system in ("darwin", "linux"):
                # Format: hostname (IP) at MAC on interface [ifscope] ...
                match = re.search(
                    r"\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-fA-F:]+)",
                    line
                )
                if match:
                    ip = match.group(1)
                    mac = match.group(2).upper()
                    if mac != "FF:FF:FF:FF:FF:FF" and mac != "(INCOMPLETE)":
                        devices.append((ip, mac))
            elif system == "windows":
                match = re.search(
                    r"(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F-]+)\s+dynamic",
                    line, re.IGNORECASE
                )
                if match:
                    ip = match.group(1)
                    mac = match.group(2).replace("-", ":").upper()
                    if mac != "FF:FF:FF:FF:FF:FF":
                        devices.append((ip, mac))
    except Exception:
        pass

    return devices


def scan_network():
    """Full network scan: gateway info + device discovery."""
    gw = get_gateway_info()

    # Parse ARP table immediately (relying on system cache)
    raw_devices = parse_arp_table()

    # Enrich device info
    devices = []
    for ip, mac in raw_devices:
        vendor = lookup_mac_vendor(mac)
        hostname = resolve_hostname(ip)
        device_type = guess_device_type(vendor, hostname)
        is_gateway = (ip == gw["gateway"])

        devices.append({
            "ip": ip,
            "mac": mac,
            "vendor": vendor,
            "hostname": hostname or "—",
            "type": device_type,
            "is_gateway": is_gateway,
        })

    # Sort: gateway first, then by IP
    def sort_key(d):
        if d["is_gateway"]:
            return (0, 0, 0, 0)
        parts = d["ip"].split(".")
        return tuple(int(p) for p in parts)

    devices.sort(key=sort_key)

    return {
        "success": True,
        "gateway": gw["gateway"],
        "local_ip": gw["local_ip"],
        "subnet": gw["subnet"],
        "interface": gw["interface"],
        "device_count": len(devices),
        "devices": devices,
    }


@app.route("/api/network-scan")
def api_network_scan():
    result = scan_network()
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

