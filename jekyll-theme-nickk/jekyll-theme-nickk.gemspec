# frozen_string_literal: true
Gem::Specification.new do |spec|
  spec.name          = "jekyll-theme-nickk"
  spec.version       = "0.1.0"
  spec.authors       = ["Your Name"]
  spec.email         = ["you@example.com"]
  spec.summary       = "A clean Jekyll blog theme"
  spec.homepage      = "https://github.com/youruser/jekyll-theme-nickk"
  spec.license       = "MIT"

  spec.files = `git ls-files -z`.split("\x0").select { |f|
    f.match(%r!\A(assets|_data|_layouts|_includes|_sass|LICENSE|README|_config\.yml)\b!i)
  }

  spec.add_runtime_dependency "jekyll", "~> 4.4"
  spec.required_ruby_version = ">= 2.7"
end
