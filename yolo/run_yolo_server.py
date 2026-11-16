"""Keep the YOLO HTTP service available if inference exits unexpectedly."""

import subprocess
import sys
import time
from pathlib import Path


SERVER_SCRIPT = Path(__file__).with_name("yolo_server.py")


def main():
    while True:
        print("[YOLO SUPERVISOR] Starting vision server...", flush=True)
        process = subprocess.Popen([sys.executable, str(SERVER_SCRIPT)])
        try:
            exit_code = process.wait()
        except KeyboardInterrupt:
            print("[YOLO SUPERVISOR] Stop requested; shutting down vision server.", flush=True)
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
            return 0

        print(
            f"[YOLO SUPERVISOR] Vision server exited with code {exit_code}; restarting in 3 seconds.",
            flush=True,
        )
        time.sleep(3)


if __name__ == "__main__":
    raise SystemExit(main())
