$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "source_space_engine/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "source_space_engine"
  s.version     = SourceSpaceEngine::VERSION
  s.authors     = ["Tjong Anthony"]
  s.email       = ["tjonganthony@gmail.com"]
  s.homepage    = "TODO"
  s.summary     = "TODO: Summary of SourceSpaceEngine."
  s.description = "TODO: Description of SourceSpaceEngine."
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.rdoc"]
  s.test_files = Dir["test/**/*"]

  s.add_dependency "rails", "~> 4.2.5"

  s.add_development_dependency "sqlite3"
end
