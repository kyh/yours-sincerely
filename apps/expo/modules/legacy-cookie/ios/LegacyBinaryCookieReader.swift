import Foundation

/**
 Read-only fallback for the cookie file written by the shipped Capacitor 4 app.

 Newer Foundation runtimes can namespace `HTTPCookieStorage.shared` into a
 bundle-specific file and stop exposing the legacy generic
 `Library/Cookies/Cookies.binarycookies` store. The binary-cookie container is
 parsed defensively and only the requested cookie value is returned. Any
 malformed or unfamiliar input is treated as absent.
 */
enum LegacyBinaryCookieReader {
  private static let fileName = "Cookies.binarycookies"

  static func read(name: String, host: String) -> String? {
    guard let file = fileURL() else { return nil }

    guard let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
      return nil
    }
    return read(data: data, name: name, host: host)
  }

  static func deleteStoreIfContains(name: String, host: String) throws {
    guard let file = fileURL() else { return }
    guard FileManager.default.fileExists(atPath: file.path) else { return }
    let data = try Data(contentsOf: file, options: .mappedIfSafe)
    guard containsRecord(data: data, name: name, host: host) else { return }

    try FileManager.default.removeItem(at: file)
  }

  static func read(data: Data, name: String, host: String) -> String? {
    let magic = Data("cook".utf8)
    guard data.count >= 8, data.count <= 4 * 1_024 * 1_024, data.prefix(4) == magic else {
      return nil
    }

    guard let pageCount = readUInt32(data, at: 4, bigEndian: true), pageCount <= 1_024 else {
      return nil
    }
    guard pageCount <= (data.count - 8) / 4 else {
      return nil
    }

    var pageSizes: [Int] = []
    pageSizes.reserveCapacity(pageCount)
    for index in 0..<pageCount {
      guard let size = readUInt32(data, at: 8 + index * 4, bigEndian: true), size > 0 else {
        return nil
      }
      pageSizes.append(size)
    }

    var cursor = 8 + pageCount * 4
    for pageSize in pageSizes {
      guard pageSize <= data.count - cursor else {
        return nil
      }
      let page = data.subdata(in: cursor..<(cursor + pageSize))
      cursor += pageSize

      if let value = readPage(page, name: name, host: host) {
        return value
      }
    }
    return nil
  }

  private static func readPage(_ page: Data, name: String, host: String) -> String? {
    guard
      page.count >= 8,
      readUInt32(page, at: 0, bigEndian: true) == 0x100,
      let cookieCount = readUInt32(page, at: 4, bigEndian: false),
      cookieCount <= 10_000,
      cookieCount <= (page.count - 12) / 4
    else {
      return nil
    }

    let headerEnd = 8 + cookieCount * 4 + 4
    for index in 0..<cookieCount {
      guard
        let recordOffset = readUInt32(page, at: 8 + index * 4, bigEndian: false),
        recordOffset >= headerEnd,
        recordOffset < page.count,
        let recordSize = readUInt32(page, at: recordOffset, bigEndian: false),
        recordSize >= 56,
        recordSize <= page.count - recordOffset
      else {
        continue
      }

      let record = page.subdata(in: recordOffset..<(recordOffset + recordSize))
      guard
        let flags = readUInt32(record, at: 8, bigEndian: false),
        let domainOffset = readUInt32(record, at: 16, bigEndian: false),
        let nameOffset = readUInt32(record, at: 20, bigEndian: false),
        let pathOffset = readUInt32(record, at: 24, bigEndian: false),
        let valueOffset = readUInt32(record, at: 28, bigEndian: false),
        let expires = readDouble(record, at: 40),
        domainOffset >= 56,
        nameOffset >= 56,
        pathOffset >= 56,
        valueOffset >= 56,
        let domain = readCString(record, at: domainOffset),
        let cookieName = readCString(record, at: nameOffset),
        let path = readCString(record, at: pathOffset),
        let value = readCString(record, at: valueOffset)
      else {
        continue
      }

      let domainMatches =
        domain.caseInsensitiveCompare(host) == .orderedSame ||
        domain.caseInsensitiveCompare(".\(host)") == .orderedSame
      let isHttpOnly = flags & 0x4 != 0
      if domainMatches && cookieName == name && path == "/" && isHttpOnly &&
        expires.isFinite && expires > Date.timeIntervalSinceReferenceDate && !value.isEmpty
      {
        return value
      }
    }
    return nil
  }

  private static func containsRecord(data: Data, name: String, host: String) -> Bool {
    let magic = Data("cook".utf8)
    guard data.count >= 8, data.count <= 4 * 1_024 * 1_024, data.prefix(4) == magic,
      let pageCount = readUInt32(data, at: 4, bigEndian: true), pageCount <= 1_024,
      pageCount <= (data.count - 8) / 4
    else {
      return false
    }

    var cursor = 8 + pageCount * 4
    for index in 0..<pageCount {
      guard let pageSize = readUInt32(data, at: 8 + index * 4, bigEndian: true),
        pageSize > 0, pageSize <= data.count - cursor
      else {
        return false
      }
      let page = data.subdata(in: cursor..<(cursor + pageSize))
      cursor += pageSize
      guard page.count >= 8, readUInt32(page, at: 0, bigEndian: true) == 0x100,
        let cookieCount = readUInt32(page, at: 4, bigEndian: false),
        cookieCount <= 10_000, cookieCount <= (page.count - 12) / 4
      else {
        continue
      }

      let headerEnd = 8 + cookieCount * 4 + 4
      for cookieIndex in 0..<cookieCount {
        guard let recordOffset = readUInt32(page, at: 8 + cookieIndex * 4, bigEndian: false),
          recordOffset >= headerEnd, recordOffset < page.count,
          let recordSize = readUInt32(page, at: recordOffset, bigEndian: false),
          recordSize >= 56, recordSize <= page.count - recordOffset
        else {
          continue
        }
        let record = page.subdata(in: recordOffset..<(recordOffset + recordSize))
        guard let domainOffset = readUInt32(record, at: 16, bigEndian: false),
          let nameOffset = readUInt32(record, at: 20, bigEndian: false),
          let domain = readCString(record, at: domainOffset),
          let cookieName = readCString(record, at: nameOffset)
        else {
          continue
        }
        let domainMatches =
          domain.caseInsensitiveCompare(host) == .orderedSame ||
          domain.caseInsensitiveCompare(".\(host)") == .orderedSame
        if domainMatches && cookieName == name { return true }
      }
    }
    return false
  }

  private static func readUInt32(_ data: Data, at offset: Int, bigEndian: Bool) -> Int? {
    guard offset >= 0, offset <= data.count - 4 else {
      return nil
    }

    let bytes = [UInt8](data[offset..<(offset + 4)])
    let value: UInt32
    if bigEndian {
      value =
        UInt32(bytes[0]) << 24 |
        UInt32(bytes[1]) << 16 |
        UInt32(bytes[2]) << 8 |
        UInt32(bytes[3])
    } else {
      value =
        UInt32(bytes[0]) |
        UInt32(bytes[1]) << 8 |
        UInt32(bytes[2]) << 16 |
        UInt32(bytes[3]) << 24
    }
    return Int(value)
  }

  private static func readCString(_ data: Data, at offset: Int) -> String? {
    guard offset >= 0, offset < data.count else {
      return nil
    }

    var end = offset
    while end < data.count, data[end] != 0 {
      end += 1
    }
    guard end < data.count else {
      return nil
    }
    return String(data: data[offset..<end], encoding: .utf8)
  }

  private static func readDouble(_ data: Data, at offset: Int) -> Double? {
    guard offset >= 0, offset <= data.count - 8 else { return nil }
    let bytes = [UInt8](data[offset..<(offset + 8)])
    var bits: UInt64 = 0
    for (index, byte) in bytes.enumerated() {
      bits |= UInt64(byte) << UInt64(index * 8)
    }
    return Double(bitPattern: bits)
  }

  private static func fileURL() -> URL? {
    FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first?
      .appendingPathComponent("Cookies", isDirectory: true)
      .appendingPathComponent(fileName, isDirectory: false)
  }
}
