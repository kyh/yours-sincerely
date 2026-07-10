Pod::Spec.new do |s|
  s.name           = 'LegacyCookie'
  s.version        = '1.0.0'
  s.summary        = 'Reads the legacy Capacitor WebView session cookie'
  s.description    = 'One-shot bridge to migrate the __session cookie from the old Capacitor app.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
