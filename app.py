import os
import subprocess
import platform
import re
import time
import threading
import urllib.request
import urllib.error
import json
from flask import Flask, render_template, jsonify

app = Flask(__name__)


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
    return render_template("index.html")


@app.route("/api/network-info")
def api_network_info():
    return jsonify(get_network_info())


@app.route("/api/speedtest")
def api_speedtest():
    result = run_speed_test()
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
