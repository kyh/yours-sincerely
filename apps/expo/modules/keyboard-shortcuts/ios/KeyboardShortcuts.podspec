Pod::Spec.new do |s|
  s.name           = 'KeyboardShortcuts'
  s.version        = '1.0.0'
  s.summary        = 'Focused hardware keyboard shortcuts'
  s.description    = 'Responder-chain keyboard commands for native composers and card stacks.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
