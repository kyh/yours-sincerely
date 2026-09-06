#!/usr/bin/env python3
"""Write an Apple Cookies.binarycookies file holding one Secure+HttpOnly cookie.

The shipped Capacitor iOS app left its session in Library/Cookies/Cookies.binarycookies;
this writes the same layout apps/expo/modules/legacy-cookie/ios/LegacyBinaryCookieReader.swift
parses, so a simulator can stage that state without the old app.
Usage: write-binarycookies.py <out-file> <domain> <name> <value>
"""
import struct
import sys
import time

REFERENCE_EPOCH = 978307200  # 2001-01-01 in Unix seconds


def record(domain: str, name: str, value: str, path: str = "/") -> bytes:
    strings = b""
    offsets = {}
    for key, text in (("domain", domain), ("name", name), ("path", path), ("value", value)):
        offsets[key] = 56 + len(strings)
        strings += text.encode() + b"\0"
    size = 56 + len(strings)
    now = time.time() - REFERENCE_EPOCH
    expires = now + 60 * 60 * 24 * 400
    flags = 0x1 | 0x4  # Secure | HttpOnly
    head = struct.pack(
        "<IIIIIIIIIIdd",
        size, 0, flags, 0,
        offsets["domain"], offsets["name"], offsets["path"], offsets["value"],
        0, 0,
        expires, now,
    )
    assert len(head) == 56
    return head + strings


def page(records: list[bytes]) -> bytes:
    header_end = 8 + len(records) * 4 + 4
    offsets = []
    cursor = header_end
    for r in records:
        offsets.append(cursor)
        cursor += len(r)
    body = struct.pack(">I", 0x100) + struct.pack("<I", len(records))
    body += b"".join(struct.pack("<I", o) for o in offsets) + struct.pack("<I", 0)
    return body + b"".join(records)


def main() -> None:
    out, domain, name, value = sys.argv[1:5]
    p = page([record(domain, name, value)])
    data = b"cook" + struct.pack(">I", 1) + struct.pack(">I", len(p)) + p + struct.pack(">I", 0)
    with open(out, "wb") as f:
        f.write(data)
    print(f"wrote {len(data)} bytes to {out}")


if __name__ == "__main__":
    main()
