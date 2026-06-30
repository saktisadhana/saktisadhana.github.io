"""Encode the easter-egg flag as base64(XOR(flag, key)) for tulip-pm.js.

The key is the resolved "build secret" path, so the flag only decrypts cleanly
when the path-traversal exploit lands on the right target. The flag is passed as
an argument (never hard-coded) so the literal never lands in the repo.

Usage from the project root:
  python tools/encode_flag.py 'rcks{...}'
"""
import base64
import sys

KEY = ".tulip/build.secret"

if len(sys.argv) != 2:
    sys.exit("usage: python tools/encode_flag.py '<flag>'")

flag = sys.argv[1]
raw = flag.encode("latin-1")
ct = bytes(b ^ ord(KEY[i % len(KEY)]) for i, b in enumerate(raw))
b64 = base64.b64encode(ct).decode()

# round-trip check
dec = bytes(b ^ ord(KEY[i % len(KEY)]) for i, b in enumerate(base64.b64decode(b64)))
assert dec.decode("latin-1") == flag, "round-trip mismatch"

print("key       :", KEY)
print("ciphertext:", b64)
