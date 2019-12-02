## Mathematical formulas in Ruby

Tomek Wielgocki

---

### Problem

How to evaluate this formula:
<p class="formula">2*height*(width + length)</p>
for given values of <span class="formula">height</span>, <span class="formula">width</span> and <span class="formula">length</span>?

---

### Solution #1 (naive)

`Kernel#eval`

---

```ruby
formula = '2*height*(width + length)'
variables = { 'height' => 3, 'width' => 4, 'length' => 5 }

variables.each do |key, value|
  formula.gsub!(key, value)
end

eval(formula)
```

---

### Solution #2

Improved `Kernel#eval`

---

```ruby
VALID_EXPRESSION = /\A[0-9\.\+\-\*\/\(\)]*\z/
formula = '2*height*(width + length)'
variables = { 'height' => 3, 'width' => 4, 'length' => 5 }

variables.each do |key, value|
  formula.gsub!(key, value)
end

if VALID_EXPRESSION =~ formula
  eval(formula)
else
  raise 'Invalid formula'
end
```

---

### Solution #3 (pro)

Abstract Syntax Tree (AST)

---

![](../images/analysis-02.png)

---

![](../images/ast-01.png)

---

Do we have to implement it?

---

No! We have Dentaku!

---

```ruby
formula = '2*height*(width + length)'
variables = { 'height' => 3, 'width' => 4, 'length' => 5 }

calculator = Dentaku::Calculator.new
calculator.evaluate!(formula, variables)
```

---

Support for case sensitivity:
```ruby
formula = '2*HEIGHT*(width + length)'
variables = { 'height' => 3, 'width' => 4, 'length' => 5 }

calculator = Dentaku::Calculator.new(case_sensitive: true)
calculator.evaluate!(formula, variables) # ERROR!
```

---

Support for functions:
```ruby
formula = 'roundup(2*radius*PI)'
variables = { 'radius' => 4.75, 'PI' => 3.14 }

calculator = Dentaku::Calculator.new
calculator.evaluate!(formula, variables)
```

---

Demo

---

### Contact

https://github.com/tiwi/mathematical-formulas

tomek@railwaymen.org

---

### Join our team!

https://railwaymen.org/

praca@railwaymen.org

---

Questions?