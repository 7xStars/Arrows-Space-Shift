"""Launch this game on a stable port to retain browser saves.

If the port is in use, stop before opening a different build.
"""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser
import json
import os

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']

class FreshFiles(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

def main():
    handler = partial(FreshFiles, directory=str(ROOT))
    port = int(os.environ.get('ASS_PORT', '4177'))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', port), handler)
    except OSError:
        print(f'Port {port} is in use. Close the previous game server, then try again.', flush=True)
        raise SystemExit(1)
    with server:
        url = f'http://127.0.0.1:{server.server_port}/'
        print(f'Arrow Space Shift v{VERSION} running from: {ROOT}', flush=True)
        print(f'Open: {url}', flush=True)
        print('The server stays running until you close this terminal or press Ctrl+C.', flush=True)
        try:
            webbrowser.open(url)
            server.serve_forever(poll_interval=0.2)
        except KeyboardInterrupt:
            print('\nServer stopped.', flush=True)

if __name__ == '__main__':
    main()
