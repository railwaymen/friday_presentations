### How to Create a Ruby Gem

Krzysztof Buszewicz

---

## Agenda

1. Starting Up
2. Folder Structure
3. Gem Specification
4. Configuration
5. Generators (Rails)
6. Modules & Errors
7. Publishing

---

## 1. Starting Up

```bash
gem install bundler
bundle gem railwaymen
```
(using bundler 1.16.1)

3 questions:
* specs (chosen rspec),
* license (chosen yes),
* coc (chosen no).

```bash
cd railwaymen
git commit -m "Initial commit"
git remote add origin https://github.com/krzysztofbuszewicz-railwaymen/railwaymen.git
git push -u origin master
```

---

## 2. Folder Structure

```bash
.
├── .git                     # git repository
├── bin
│   ├── console              # console loader with dependencies
│   └── setup                # automated setup script
├── Gemfile                  # dependencies management
├── .gitignore               # initially configured .gitignore
├── lib
│   ├── railwaymen           # main folder for gem's classes etc.
│   │   └── version.rb       # gem versioning file
│   └── railwaymen.rb        # maing gem's file required when gem loaded
├── LICENSE.txt              # license file
├── railwaymen.gemspec       # gem and dependencies specification
├── Rakefile                 # file for rake tasks including gem tasks
├── README.md                # readme for describing gem
├── .rspec                   # rspec configuration
├── spec
│   ├── railwaymen_spec.rb   # maing module spec
│   └── spec_helper.rb       # rspec config
└── .travis.yml              # travis CI config
```

---

## 3. Gem Specification

```ruby
# railwaymen.gemspec
lib = File.expand_path("../lib", __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require "railwaymen/version"

Gem::Specification.new do |spec|
  spec.name = "railwaymen"
  spec.version = Railwaymen::VERSION
  spec.authors = ["Krzysztof Buszewicz"]
  spec.email = ["krzysztof.buszewicz@railwaymen.org"]

  spec.summary = "Example gem"
  spec.description = "This gem was created for presentation purposes."
  spec.homepage = "https://github.com/krzysztofbuszewicz-railwaymen/railwaymen"
  spec.license = "MIT"

  spec.files = `git ls-files -z`.split("\x0").reject do |f|
    f.match(%r{^(test|spec|features)/})
  end

  spec.bindir = "exe"
  spec.executables = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.16"
  spec.add_development_dependency "rake", "~> 10.0"
  spec.add_development_dependency "rspec", "~> 3.0"
end
```

http://guides.rubygems.org/specification-reference/

---

## 3. Gem Specification

```bash
bundle
git add -A
git commit -m "filled .gemspec"
git push
```

---

## 4. Configuration

```ruby
# lib/railwaymen/configuration.rb
module Railwaymen
  class Configuration
    attr_reader :names

    def initialize
      @names = %w(Krzysztof)
    end

    def names=(names)
      raise(StandardError, 'names must be an array of strings') if !valid_names?(names)
      @names = names
    end

    private

    def valid_names?(names)
      names.is_a?(Array) && names.all? { |n| n.is_a?(String) }
    end
  end
end
```

---

## 4. Configuration

```ruby
# lib/railwaymen.rb
require "railwaymen/version"
require "railwaymen/configuration"

module Railwaymen
  class << self
    def configuration
      @configuration ||= Configuration.new
    end

    def configure
      yield(configuration) if block_given?
      configuration
    end
  end
end
```

```bash
git add -A
git commit -m "added configuration"
git push
```

---

## 5. Generators (Rails)

Goal: generate initializer in Rails projects using our gem by:

```bash
bundle exec rails g railwaymen:install
```

---

## 5. Generators (Rails)

```ruby
# lib/generators/railwaymen/templates/initializer.rb
Railwaymen.configure do |c|
  c.names = %w(Krzysiek Zdzisiek Misiek)
end
```

```ruby
# lib/generators/railwaymen/install_generator.rb
require 'rails/generators'

module Railwaymen
  class InstallGenerator < ::Rails::Generators::Base
    namespace 'railwaymen:install'
    source_root File.expand_path('../templates', __FILE__)
    desc 'Generates railwaymen gem initializer.'

    def install
      template 'initializer.rb', 'config/initializers/railwaymen.rb'
    end
  end
end
```

```bash
git add -A
git commit -m "add install generator for Rails"
git push
```

---

## 6. Modules & Errors

a) Add classes and modules under lib/railwaymen directory

```ruby
# lib/railwaymen/conductor.rb
module Railwaymen
  module Conductor
    def check_ticket!(ticket)
      raise Errors::MissingTicket if ticket.nil?
      "OK"
    end
  end
end
```

---

## 6. Modules & Errors

b) Create gem's own error classes under lib/railwaymen/errors and Errors namespace

```ruby
# lib/railwaymen/errors/missing_ticket.rb
module Railwaymen
  module Errors
    class MissingTicket < StandardError
      def initialize
        super('Ticket is nil and it cannot be!')
      end
    end
  end
end
```

---

## 6. Modules & Errors

c) Include them in lib/railwaymen.rb

```ruby
# lib/railwaymen.rb
require "railwaymen/version"
require "railwaymen/configuration"
require "railwaymen/errors/missing_ticket"
require "railwaymen/conductor"

module Railwaymen
  class << self
    def configuration
      @configuration ||= Configuration.new
    end

    def configure
      yield(configuration) if block_given?
      configuration
    end
  end
end
```

---

## 6. Modules & Errors

d) Fix & write specs

```ruby
RSpec.describe Railwaymen do
  it "has a version number" do
    expect(Railwaymen::VERSION).not_to be nil
  end

  # LOL, remove this
  it "does something useful" do
    expect(false).to eq(true)
  end
end
```

```bash
git add -A
git commit -m "sample module, error, and fixed specs"
git push
```

---

## 7. Publishing


```bash
bundle exec rake release

# railwaymen 0.1.0 built to pkg/railwaymen-0.1.0.gem.
# Tagged v0.1.0.
# Pushed git commits and tags.
# rake aborted!
# Your rubygems.org credentials aren't set. Run `gem push` to set them.
```

```bash
gem push pkg/railwaymen-0.1.0.gem
```

---

## Summary

Questions ?
