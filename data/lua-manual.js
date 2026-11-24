// Structured versions of the Lua 5.2 manual entries, shown on latest+
// params: [name, type, description, default], returns: [type, description]
// Types can be combined with |
var luaManualData = {
  "assert": {
    "description": "Raises an error if v is false or nil, otherwise returns all of its arguments.",
    "params": [
      ["v", "Any", "the value to check"],
      ["message", "Any", "the error message", "\"assertion failed!\""],
    ],
    "returns": [["Any", "all arguments, when v is truthy"]],
    "examples": ["local ok = assert(1 + 1 == 2, \"math is broken\")\nprint(ok) --> true"],
  },
  "bit32.arshift": {
    "description": "Shifts x to the right, filling vacant bits on the left with copies of its highest bit (arithmetic shift). Negative displacements shift to the left.",
    "params": [
      ["x", "Number", "the number to shift"],
      ["disp", "Int", "the number of bits to shift by"],
    ],
    "returns": [["Number", "the shifted number"]],
    "examples": ["print(bit32.arshift(0x80000000, 4)) --> 4160749568"],
  },
  "bit32.band": {
    "description": "Returns the bitwise AND of its operands.",
    "params": [["...", "Number", "the operands"]],
    "returns": [["Number", "the bitwise AND"]],
    "examples": ["print(bit32.band(12, 10)) --> 8"],
  },
  "bit32.bnot": {
    "description": "Returns the bitwise negation of x.",
    "params": [["x", "Number", "the number to negate"]],
    "returns": [["Number", "the negated number, equal to (-1 - x) % 2^32"]],
    "examples": ["print(bit32.bnot(0)) --> 4294967295"],
  },
  "bit32.bor": {
    "description": "Returns the bitwise OR of its operands.",
    "params": [["...", "Number", "the operands"]],
    "returns": [["Number", "the bitwise OR"]],
    "examples": ["print(bit32.bor(12, 10)) --> 14"],
  },
  "bit32.btest": {
    "description": "Checks whether the bitwise AND of its operands is different from zero.",
    "params": [["...", "Number", "the operands"]],
    "returns": [["Boolean", "whether any bit is set in all operands"]],
    "examples": ["print(bit32.btest(12, 3)) --> false"],
  },
  "bit32.bxor": {
    "description": "Returns the bitwise exclusive OR of its operands.",
    "params": [["...", "Number", "the operands"]],
    "returns": [["Number", "the bitwise XOR"]],
    "examples": ["print(bit32.bxor(12, 10)) --> 6"],
  },
  "bit32.extract": {
    "description": "Reads a range of bits from n as an unsigned number. Bits are numbered from 0 (least significant) to 31 (most significant), and all accessed bits must be in that range.",
    "params": [
      ["n", "Number", "the number to read from"],
      ["field", "Int", "the first bit to read"],
      ["width", "Int", "the number of bits to read", "1"],
    ],
    "returns": [["Number", "the extracted bits"]],
    "examples": ["print(bit32.extract(0xF0, 4, 4)) --> 15"],
  },
  "bit32.lrotate": {
    "description": "Rotates x to the left. Negative displacements rotate to the right.",
    "params": [
      ["x", "Number", "the number to rotate"],
      ["disp", "Int", "the number of bits to rotate by"],
    ],
    "returns": [["Number", "the rotated number"]],
    "examples": ["print(bit32.lrotate(1, 4)) --> 16"],
  },
  "bit32.lshift": {
    "description": "Shifts x to the left, filling vacant bits with zeros. Negative displacements shift to the right, and displacements above 31 result in zero.",
    "params": [
      ["x", "Number", "the number to shift"],
      ["disp", "Int", "the number of bits to shift by"],
    ],
    "returns": [["Number", "the shifted number"]],
    "examples": ["print(bit32.lshift(1, 4)) --> 16"],
  },
  "bit32.replace": {
    "description": "Returns a copy of n with a range of bits replaced by v. Bits are numbered from 0 to 31.",
    "params": [
      ["n", "Number", "the original number"],
      ["v", "Number", "the value to write"],
      ["field", "Int", "the first bit to replace"],
      ["width", "Int", "the number of bits to replace", "1"],
    ],
    "returns": [["Number", "the updated number"]],
    "examples": ["print(bit32.replace(0, 15, 4, 4)) --> 240"],
  },
  "bit32.rrotate": {
    "description": "Rotates x to the right. Negative displacements rotate to the left.",
    "params": [
      ["x", "Number", "the number to rotate"],
      ["disp", "Int", "the number of bits to rotate by"],
    ],
    "returns": [["Number", "the rotated number"]],
    "examples": ["print(bit32.rrotate(16, 4)) --> 1"],
  },
  "bit32.rshift": {
    "description": "Shifts x to the right, filling vacant bits with zeros (logical shift). Negative displacements shift to the left, and displacements above 31 result in zero.",
    "params": [
      ["x", "Number", "the number to shift"],
      ["disp", "Int", "the number of bits to shift by"],
    ],
    "returns": [["Number", "the shifted number"]],
    "examples": ["print(bit32.rshift(16, 4)) --> 1"],
  },
  "coroutine.create": {
    "description": "Creates a new coroutine that runs f when it is first resumed.",
    "params": [["f", "Function", "the coroutine body, must be a Lua function"]],
    "returns": [["Thread", "the new coroutine"]],
    "examples": ["local co = coroutine.create(function(text)\n  print(text) --> hello\nend)\ncoroutine.resume(co, \"hello\")"],
  },
  "coroutine.resume": {
    "description": "Starts or continues a coroutine. On the first resume the values are passed to its body, afterwards they become the results of the yield it stopped at.",
    "params": [
      ["co", "Thread", "the coroutine to run"],
      ["val1", "Any", "the first value to pass"],
      ["...", "Any", "more values to pass"],
    ],
    "returns": [
      ["Boolean", "whether it ran without errors"],
      ["Any", "the values passed to yield or returned by the body, or the error message"],
    ],
    "examples": ["local co = coroutine.create(function(a)\n  local b = coroutine.yield(a + 1)\n  return b * 2\nend)\nprint(select(2, coroutine.resume(co, 1))) --> 2\nprint(select(2, coroutine.resume(co, 5))) --> 10"],
  },
  "coroutine.running": {
    "description": "Returns the running coroutine.",
    "returns": [
      ["Thread", "the running coroutine"],
      ["Boolean", "whether it is the main coroutine"],
    ],
    "examples": ["local co, isMain = coroutine.running()\nprint(type(co)) --> thread"],
  },
  "coroutine.status": {
    "description": "Returns the status of a coroutine: \"running\" if it called status, \"suspended\" if it yielded or has not started, \"normal\" if it resumed another coroutine, or \"dead\" if it finished or stopped with an error.",
    "params": [["co", "Thread", "the coroutine to check"]],
    "returns": [["String", "the coroutine status"]],
    "examples": ["local co = coroutine.create(function() end)\nprint(coroutine.status(co)) --> suspended\ncoroutine.resume(co)\nprint(coroutine.status(co)) --> dead"],
  },
  "coroutine.wrap": {
    "description": "Creates a coroutine and returns a function that resumes it on each call. Unlike coroutine.resume, the function does not return a status boolean and it propagates errors.",
    "params": [["f", "Function", "the coroutine body, must be a Lua function"]],
    "returns": [["Function", "the function that resumes the coroutine"]],
    "examples": ["local nextNumber = coroutine.wrap(function()\n  for i = 1, 2 do\n    coroutine.yield(i)\n  end\nend)\nprint(nextNumber()) --> 1\nprint(nextNumber()) --> 2"],
  },
  "coroutine.yield": {
    "description": "Suspends the running coroutine. Its arguments become extra results of the coroutine.resume call.",
    "params": [["...", "Any", "the values to pass to resume"]],
    "returns": [["Any", "the values passed to the next resume"]],
    "examples": ["local co = coroutine.wrap(function()\n  local answer = coroutine.yield(\"question\")\n  print(answer) --> reply\nend)\nprint(co()) --> question\nco(\"reply\")"],
  },
  "debug.traceback": {
    "description": "Builds a traceback of the call stack. If message is neither a string nor nil, it is returned without further processing.",
    "params": [
      ["thread", "Thread", "the thread to inspect"],
      ["message", "Any", "the text to add at the beginning of the traceback"],
      ["level", "Int", "the stack level to start from, 1 is the function calling traceback", "1"],
    ],
    "returns": [["String", "the traceback"]],
    "examples": ["print(debug.traceback(\"stack:\"))"],
  },
  "error": {
    "description": "Stops the last protected function and uses message as its error. This function never returns.",
    "params": [
      ["message", "Any", "the error message"],
      ["level", "Int", "where to report the error: 1 is where error was called, 2 is the caller of that function, 0 adds no position", "1"],
    ],
    "examples": ["local ok, message = pcall(function()\n  error(\"failed\", 0)\nend)\nprint(message) --> failed"],
  },
  "getmetatable": {
    "description": "Returns the metatable of object. If the metatable has a \"__metatable\" field, that field's value is returned instead.",
    "params": [["object", "Any", "the value to inspect"]],
    "returns": [["Any", "the metatable, its __metatable field, or nil"]],
    "examples": ["local meta = {}\nlocal t = setmetatable({}, meta)\nprint(getmetatable(t) == meta) --> true"],
  },
  "ipairs": {
    "description": "Iterates over (1, t[1]), (2, t[2]), and so on, up to the first integer key that is absent. If t has an __ipairs metamethod, its first three results are returned instead.",
    "params": [["t", "Table", "the table to iterate"]],
    "returns": [
      ["Function", "the iterator"],
      ["Table", "the table"],
      ["Int", "the starting index, 0"],
    ],
    "examples": ["local total = 0\nfor i, v in ipairs({10, 20, 30}) do\n  total = total + v\nend\nprint(total) --> 60"],
  },
  "math.abs": {
    "description": "Returns the absolute value of x.",
    "params": [["x", "Number", "the number"]],
    "returns": [["Number", "the absolute value"]],
    "examples": ["print(math.abs(-5)) --> 5"],
  },
  "math.acos": {
    "description": "Returns the arc cosine of x in radians.",
    "params": [["x", "Number", "the cosine value"]],
    "returns": [["Number", "the angle in radians"]],
    "examples": ["print(math.acos(1)) --> 0"],
  },
  "math.asin": {
    "description": "Returns the arc sine of x in radians.",
    "params": [["x", "Number", "the sine value"]],
    "returns": [["Number", "the angle in radians"]],
    "examples": ["print(math.asin(0)) --> 0"],
  },
  "math.atan": {
    "description": "Returns the arc tangent of x in radians.",
    "params": [["x", "Number", "the tangent value"]],
    "returns": [["Number", "the angle in radians"]],
    "examples": ["print(math.atan(0)) --> 0"],
  },
  "math.atan2": {
    "description": "Returns the arc tangent of y/x in radians, using the signs of both values to find the quadrant. It also handles x being zero.",
    "params": [
      ["y", "Number", "the y value"],
      ["x", "Number", "the x value"],
    ],
    "returns": [["Number", "the angle in radians"]],
    "examples": ["print(math.atan2(0, -1)) --> 3.1415926535898"],
  },
  "math.ceil": {
    "description": "Rounds x up to the nearest integer.",
    "params": [["x", "Number", "the number"]],
    "returns": [["Int", "the smallest integer larger than or equal to x"]],
    "examples": ["print(math.ceil(3.2)) --> 4"],
  },
  "math.cos": {
    "description": "Returns the cosine of x.",
    "params": [["x", "Number", "the angle in radians"]],
    "returns": [["Number", "the cosine"]],
    "examples": ["print(math.cos(0)) --> 1"],
  },
  "math.cosh": {
    "description": "Returns the hyperbolic cosine of x.",
    "params": [["x", "Number", "the number"]],
    "returns": [["Number", "the hyperbolic cosine"]],
    "examples": ["print(math.cosh(0)) --> 1"],
  },
  "math.deg": {
    "description": "Converts an angle from radians to degrees.",
    "params": [["x", "Number", "the angle in radians"]],
    "returns": [["Number", "the angle in degrees"]],
    "examples": ["print(math.deg(math.pi)) --> 180"],
  },
  "math.exp": {
    "description": "Returns e raised to the power of x.",
    "params": [["x", "Number", "the exponent"]],
    "returns": [["Number", "the result"]],
    "examples": ["print(math.exp(0)) --> 1"],
  },
  "math.floor": {
    "description": "Rounds x down to the nearest integer.",
    "params": [["x", "Number", "the number"]],
    "returns": [["Int", "the largest integer smaller than or equal to x"]],
    "examples": ["print(math.floor(3.7)) --> 3"],
  },
  "math.fmod": {
    "description": "Returns the remainder of dividing x by y, rounding the quotient towards zero.",
    "params": [
      ["x", "Number", "the dividend"],
      ["y", "Number", "the divisor"],
    ],
    "returns": [["Number", "the remainder"]],
    "examples": ["print(math.fmod(-7, 3)) --> -1"],
  },
  "math.frexp": {
    "description": "Splits x into m and e so that x = m * 2^e. The absolute value of m is in the range [0.5, 1), or zero when x is zero.",
    "params": [["x", "Number", "the number"]],
    "returns": [
      ["Number", "the mantissa m"],
      ["Int", "the exponent e"],
    ],
    "examples": ["local m, e = math.frexp(8)\nprint(m) --> 0.5\nprint(e) --> 4"],
  },
  "math.ldexp": {
    "description": "Returns m * 2^e.",
    "params": [
      ["m", "Number", "the mantissa"],
      ["e", "Int", "the exponent"],
    ],
    "returns": [["Number", "the result"]],
    "examples": ["print(math.ldexp(0.5, 4)) --> 8"],
  },
  "math.log": {
    "description": "Returns the logarithm of x in the given base.",
    "params": [
      ["x", "Number", "the number"],
      ["base", "Number", "the logarithm base", "math.exp(1)"],
    ],
    "returns": [["Number", "the logarithm"]],
    "examples": ["print(math.log(8, 2)) --> 3"],
  },
  "math.max": {
    "description": "Returns the largest of its arguments.",
    "params": [
      ["x", "Number", "the first number"],
      ["...", "Number", "more numbers"],
    ],
    "returns": [["Number", "the maximum value"]],
    "examples": ["print(math.max(1, 5, 3)) --> 5"],
  },
  "math.min": {
    "description": "Returns the smallest of its arguments.",
    "params": [
      ["x", "Number", "the first number"],
      ["...", "Number", "more numbers"],
    ],
    "returns": [["Number", "the minimum value"]],
    "examples": ["print(math.min(1, 5, 3)) --> 1"],
  },
  "math.modf": {
    "description": "Splits x into its integral and fractional parts.",
    "params": [["x", "Number", "the number"]],
    "returns": [
      ["Number", "the integral part"],
      ["Number", "the fractional part"],
    ],
    "examples": ["local whole, fraction = math.modf(3.5)\nprint(whole) --> 3\nprint(fraction) --> 0.5"],
  },
  "math.pow": {
    "description": "Returns x raised to the power of y. The expression x^y does the same.",
    "params": [
      ["x", "Number", "the base"],
      ["y", "Number", "the exponent"],
    ],
    "returns": [["Number", "the result"]],
    "examples": ["print(math.pow(2, 10)) --> 1024"],
  },
  "math.rad": {
    "description": "Converts an angle from degrees to radians.",
    "params": [["x", "Number", "the angle in degrees"]],
    "returns": [["Number", "the angle in radians"]],
    "examples": ["print(math.rad(180)) --> 3.1415926535898"],
  },
  "math.random": {
    "description": "Generates a pseudo-random number. Without arguments it returns a real number in [0, 1), with m an integer in [1, m], and with m and n an integer in [m, n].",
    "params": [
      ["m", "Int", "the upper limit, or the lower limit when n is given"],
      ["n", "Int", "the upper limit"],
    ],
    "returns": [["Number", "the random number"]],
    "examples": ["local dice = math.random(6)\nlocal percent = math.random(0, 100)"],
  },
  "math.randomseed": {
    "description": "Sets the seed of the pseudo-random generator. Equal seeds produce equal sequences of numbers.",
    "params": [["x", "Number", "the seed"]],
    "examples": ["math.randomseed(42)\nlocal first = math.random(100)\nmath.randomseed(42)\nprint(math.random(100) == first) --> true"],
  },
  "math.sin": {
    "description": "Returns the sine of x.",
    "params": [["x", "Number", "the angle in radians"]],
    "returns": [["Number", "the sine"]],
    "examples": ["print(math.sin(0)) --> 0"],
  },
  "math.sinh": {
    "description": "Returns the hyperbolic sine of x.",
    "params": [["x", "Number", "the number"]],
    "returns": [["Number", "the hyperbolic sine"]],
    "examples": ["print(math.sinh(0)) --> 0"],
  },
  "math.sqrt": {
    "description": "Returns the square root of x. The expression x^0.5 does the same.",
    "params": [["x", "Number", "the number"]],
    "returns": [["Number", "the square root"]],
    "examples": ["print(math.sqrt(16)) --> 4"],
  },
  "math.tan": {
    "description": "Returns the tangent of x.",
    "params": [["x", "Number", "the angle in radians"]],
    "returns": [["Number", "the tangent"]],
    "examples": ["print(math.tan(0)) --> 0"],
  },
  "math.tanh": {
    "description": "Returns the hyperbolic tangent of x.",
    "params": [["x", "Number", "the number"]],
    "returns": [["Number", "the hyperbolic tangent"]],
    "examples": ["print(math.tanh(0)) --> 0"],
  },
  "next": {
    "description": "Returns the next key of a table and its value, or nil after the last key. Use next(t) to check whether a table is empty. The order is not specified, and assigning to a non-existent field during traversal is undefined, but existing fields can be changed or cleared.",
    "params": [
      ["table", "Table", "the table to traverse"],
      ["index", "Any", "the current key, nil starts from the beginning", "nil"],
    ],
    "returns": [
      ["Any", "the next key, or nil"],
      ["Any", "its value"],
    ],
    "examples": ["print(next({}) == nil) --> true"],
  },
  "os.date": {
    "description": "Formats a date and time in France time (CET/CEST), using the C strftime rules. A leading ! does not switch to UTC, and results run about 4 seconds behind. The format \"*t\" returns a table with year, month, day, hour, min, sec, wday, yday, and isdst. Always pass a time in seconds with \"*t\", because its default time is wrong.",
    "params": [
      ["format", "String", "the date format", "\"%c\""],
      ["time", "Number", "the time in milliseconds, or in seconds with \"*t\". Uses the current time when absent, except with \"*t\""],
    ],
    "returns": [["String|Table", "the formatted date"]],
    "examples": ["local today = os.date(\"%Y-%m-%d\", os.time())\nlocal date = os.date(\"*t\", math.floor(os.time() / 1000))"],
  },
  "os.difftime": {
    "description": "Returns t2 minus t1, in the same unit as the given times. For os.time values, that is milliseconds.",
    "params": [
      ["t2", "Number", "the later time"],
      ["t1", "Number", "the earlier time"],
    ],
    "returns": [["Number", "the difference"]],
    "examples": ["print(os.difftime(5000, 1000)) --> 4000"],
  },
  "os.time": {
    "description": "Returns the current time in milliseconds, or the time of the date in the given table. The table needs year, month, and day, and can have hour (default 12), min (default 0), sec (default 0), and isdst. Dates are read as France time (CET/CEST).",
    "params": [["table", "Table", "the date to convert, uses the current time when absent"]],
    "returns": [["Number", "the time in milliseconds"]],
    "examples": ["local nowMs = os.time()\nlocal newYearMs = os.time({year = 2026, month = 1, day = 1})"],
  },
  "pairs": {
    "description": "Iterates over all key-value pairs of a table, in no specified order. If t has a __pairs metamethod, its first three results are returned instead.",
    "params": [["t", "Table", "the table to iterate"]],
    "returns": [
      ["Function", "the next function"],
      ["Table", "the table"],
      ["Any", "the starting key, nil"],
    ],
    "examples": ["local count = 0\nfor key, value in pairs({a = 1, b = 2}) do\n  count = count + 1\nend\nprint(count) --> 2"],
  },
  "pcall": {
    "description": "Calls f in protected mode, so an error inside it is caught instead of being propagated.",
    "params": [
      ["f", "Function", "the function to call"],
      ["arg1", "Any", "the first argument"],
      ["...", "Any", "more arguments"],
    ],
    "returns": [
      ["Boolean", "whether the call succeeded"],
      ["Any", "the results of the call, or the error message"],
    ],
    "examples": ["local ok, result = pcall(math.floor, 3.7)\nprint(ok) --> true\nprint(result) --> 3"],
  },
  "rawequal": {
    "description": "Checks whether two values are equal without invoking any metamethod.",
    "params": [
      ["v1", "Any", "the first value"],
      ["v2", "Any", "the second value"],
    ],
    "returns": [["Boolean", "whether they are equal"]],
    "examples": ["print(rawequal(\"a\", \"a\")) --> true"],
  },
  "rawget": {
    "description": "Gets table[index] without invoking any metamethod.",
    "params": [
      ["table", "Table", "the table"],
      ["index", "Any", "the key"],
    ],
    "returns": [["Any", "the stored value"]],
    "examples": ["local t = setmetatable({}, {__index = function() return 1 end})\nprint(t.x) --> 1\nprint(rawget(t, \"x\")) --> nil"],
  },
  "rawlen": {
    "description": "Returns the length of a table or string without invoking any metamethod.",
    "params": [["v", "Table|String", "the value to measure"]],
    "returns": [["Int", "the length"]],
    "examples": ["print(rawlen({1, 2, 3})) --> 3"],
  },
  "rawset": {
    "description": "Sets table[index] to value without invoking any metamethod.",
    "params": [
      ["table", "Table", "the table"],
      ["index", "Any", "the key, cannot be nil or NaN"],
      ["value", "Any", "the value to store"],
    ],
    "returns": [["Table", "the same table"]],
    "examples": ["local t = setmetatable({}, {__newindex = function() end})\nrawset(t, \"x\", 1)\nprint(t.x) --> 1"],
  },
  "select": {
    "description": "Returns all arguments after position index, where negative numbers count from the end. With \"#\" it returns the number of extra arguments instead.",
    "params": [
      ["index", "Int|String", "the position, or \"#\""],
      ["...", "Any", "the arguments"],
    ],
    "returns": [["Any", "the selected arguments, or their count"]],
    "examples": ["print(select(\"#\", \"a\", \"b\", \"c\")) --> 3\nprint(select(-1, \"a\", \"b\", \"c\")) --> c"],
  },
  "setmetatable": {
    "description": "Sets the metatable of a table, or removes it when metatable is nil. Raises an error if the current metatable has a \"__metatable\" field.",
    "params": [
      ["table", "Table", "the table"],
      ["metatable", "Table", "the new metatable, or nil"],
    ],
    "returns": [["Table", "the same table"]],
    "examples": ["local t = setmetatable({}, {__index = {x = 1}})\nprint(t.x) --> 1"],
  },
  "string.byte": {
    "description": "Returns the numerical codes of the characters from i to j. Indices follow the same rules as string.sub, and codes are not necessarily portable across platforms.",
    "params": [
      ["s", "String", "the string"],
      ["i", "Int", "the first position", "1"],
      ["j", "Int", "the last position, defaults to i"],
    ],
    "returns": [["Int", "the character codes"]],
    "examples": ["print(string.byte(\"A\")) --> 65"],
  },
  "string.char": {
    "description": "Builds a string from numerical character codes. Codes are not necessarily portable across platforms.",
    "params": [["...", "Int", "the character codes"]],
    "returns": [["String", "the new string"]],
    "examples": ["print(string.char(72, 105)) --> Hi"],
  },
  "string.dump": {
    "description": "Returns a string containing a binary representation of a function.",
    "params": [["function", "Function", "the function to dump"]],
    "returns": [["String", "the binary representation"]],
    "examples": ["local data = string.dump(function() return 42 end)\nprint(#data > 0) --> true"],
  },
  "string.find": {
    "description": "Finds the first match of a pattern. If the pattern has captures, they are returned after the two positions.",
    "params": [
      ["s", "String", "the string to search"],
      ["pattern", "String", "the pattern to look for"],
      ["init", "Int", "where to start, can be negative", "1"],
      ["plain", "Boolean", "true does a plain substring search, requires init", "false"],
    ],
    "returns": [
      ["Int", "the start position, or nil"],
      ["Int", "the end position"],
      ["String", "the captures, if any"],
    ],
    "examples": ["local first, last = string.find(\"hello world\", \"wor\")\nprint(first) --> 7\nprint(last) --> 9"],
  },
  "string.format": {
    "description": "Builds a formatted string using C sprintf rules. The options *, h, L, l, n, and p are not supported, and %q writes a string that Lua can safely read back.",
    "params": [
      ["formatstring", "String", "the format"],
      ["...", "Any", "the values to format"],
    ],
    "returns": [["String", "the formatted string"]],
    "examples": ["print(string.format(\"%s has %d points\", \"Souris\", 10)) --> Souris has 10 points"],
  },
  "string.gmatch": {
    "description": "Returns an iterator over the matches of a pattern, producing its captures or the whole match. A ^ at the start of the pattern does not work as an anchor here.",
    "params": [
      ["s", "String", "the string to search"],
      ["pattern", "String", "the pattern to look for"],
    ],
    "returns": [["Function", "the iterator"]],
    "examples": ["local words = {}\nfor word in string.gmatch(\"hello world from Lua\", \"%a+\") do\n  words[#words + 1] = word\nend\nprint(#words) --> 4"],
  },
  "string.gsub": {
    "description": "Replaces matches of a pattern. In a replacement string, %1 to %9 are captures, %0 is the whole match, and %% is a percent sign. A table is queried with the first capture, and a function receives all captures. If they return false or nil, the match is kept.",
    "params": [
      ["s", "String", "the original string"],
      ["pattern", "String", "the pattern to replace"],
      ["repl", "String|Table|Function", "the replacement"],
      ["n", "Int", "the maximum number of replacements, replaces all when absent"],
    ],
    "returns": [
      ["String", "the new string"],
      ["Int", "the number of matches"],
    ],
    "examples": ["local result, count = string.gsub(\"hello world\", \"o\", \"0\")\nprint(result) --> hell0 w0rld\nprint(count) --> 2"],
  },
  "string.len": {
    "description": "Returns the length of a string. Embedded zeros are counted.",
    "params": [["s", "String", "the string"]],
    "returns": [["Int", "the length"]],
    "examples": ["print(string.len(\"hello\")) --> 5"],
  },
  "string.lower": {
    "description": "Returns a copy of the string with uppercase letters changed to lowercase. What counts as a letter depends on the locale.",
    "params": [["s", "String", "the string"]],
    "returns": [["String", "the lowercase string"]],
    "examples": ["print(string.lower(\"HeLLo\")) --> hello"],
  },
  "string.match": {
    "description": "Finds the first match of a pattern and returns its captures, or the whole match if it has none.",
    "params": [
      ["s", "String", "the string to search"],
      ["pattern", "String", "the pattern to look for"],
      ["init", "Int", "where to start, can be negative", "1"],
    ],
    "returns": [["String", "the captures or match, or nil"]],
    "examples": ["print(string.match(\"Souris#1234\", \"#(%d+)\")) --> 1234"],
  },
  "string.rep": {
    "description": "Repeats a string n times, with an optional separator between copies.",
    "params": [
      ["s", "String", "the string to repeat"],
      ["n", "Int", "the number of copies"],
      ["sep", "String", "the separator", "\"\""],
    ],
    "returns": [["String", "the repeated string"]],
    "examples": ["print(string.rep(\"ab\", 3, \"-\")) --> ab-ab-ab"],
  },
  "string.reverse": {
    "description": "Returns the string reversed.",
    "params": [["s", "String", "the string"]],
    "returns": [["String", "the reversed string"]],
    "examples": ["print(string.reverse(\"abc\")) --> cba"],
  },
  "string.sub": {
    "description": "Returns the part of a string from i to j. Negative positions count from the end, and out-of-range positions are corrected to fit the string.",
    "params": [
      ["s", "String", "the string"],
      ["i", "Int", "the first position"],
      ["j", "Int", "the last position", "-1"],
    ],
    "returns": [["String", "the substring"]],
    "examples": ["print(string.sub(\"hello\", 2, 4)) --> ell\nprint(string.sub(\"hello\", -2)) --> lo"],
  },
  "string.upper": {
    "description": "Returns a copy of the string with lowercase letters changed to uppercase. What counts as a letter depends on the locale.",
    "params": [["s", "String", "the string"]],
    "returns": [["String", "the uppercase string"]],
    "examples": ["print(string.upper(\"HeLLo\")) --> HELLO"],
  },
  "table.concat": {
    "description": "Joins the strings or numbers of a list. Returns an empty string if i is greater than j.",
    "params": [
      ["list", "Table", "the list"],
      ["sep", "String", "the separator", "\"\""],
      ["i", "Int", "the first index", "1"],
      ["j", "Int", "the last index", "#list"],
    ],
    "returns": [["String", "the joined string"]],
    "examples": ["print(table.concat({\"a\", \"b\", \"c\"}, \", \")) --> a, b, c"],
  },
  "table.insert": {
    "description": "Inserts a value into a list, shifting later elements up. With two arguments, the value is added at the end.",
    "params": [
      ["list", "Table", "the list"],
      ["pos", "Int", "the position to insert at", "#list + 1"],
      ["value", "Any", "the value to insert"],
    ],
    "examples": ["local t = {\"a\", \"c\"}\ntable.insert(t, 2, \"b\")\nprint(table.concat(t)) --> abc"],
  },
  "table.pack": {
    "description": "Stores its arguments in a new table with keys 1, 2, and so on, plus a field n with their total. The result may not be a sequence.",
    "params": [["...", "Any", "the values to store"]],
    "returns": [["Table", "the new table"]],
    "examples": ["local t = table.pack(\"a\", nil, \"c\")\nprint(t.n) --> 3"],
  },
  "table.remove": {
    "description": "Removes an element from a list and shifts later elements down. pos can also be 0 when the list is empty, or #list + 1.",
    "params": [
      ["list", "Table", "the list"],
      ["pos", "Int", "the position to remove", "#list"],
    ],
    "returns": [["Any", "the removed value"]],
    "examples": ["local t = {\"a\", \"b\", \"c\"}\nprint(table.remove(t)) --> c\nprint(#t) --> 2"],
  },
  "table.sort": {
    "description": "Sorts a list in place. The sort is not stable, so equal elements may change their relative order.",
    "params": [
      ["list", "Table", "the list"],
      ["comp", "Function", "receives two elements and returns true when the first must come before the second, uses < when absent"],
    ],
    "examples": ["local t = {3, 1, 2}\ntable.sort(t, function(a, b) return a > b end)\nprint(table.concat(t, \",\")) --> 3,2,1"],
  },
  "table.unpack": {
    "description": "Returns the elements of a list as separate values.",
    "params": [
      ["list", "Table", "the list"],
      ["i", "Int", "the first index", "1"],
      ["j", "Int", "the last index", "#list"],
    ],
    "returns": [["Any", "the elements"]],
    "examples": ["local first, second = table.unpack({1, 2})\nprint(second) --> 2"],
  },
  "tonumber": {
    "description": "Converts a value to a number, or returns nil if it can't. With a base, e must be a string containing an integer in that base.",
    "params": [
      ["e", "Any", "the value to convert"],
      ["base", "Int", "the base, from 2 to 36"],
    ],
    "returns": [["Number", "the number, or nil"]],
    "examples": ["print(tonumber(\"42\")) --> 42\nprint(tonumber(\"ff\", 16)) --> 255"],
  },
  "tostring": {
    "description": "Converts a value to a string. If its metatable has a \"__tostring\" field, that function produces the result. Use string.format for full control over numbers.",
    "params": [["v", "Any", "the value to convert"]],
    "returns": [["String", "the string"]],
    "examples": ["print(tostring(42) .. \" points\") --> 42 points"],
  },
  "type": {
    "description": "Returns the type of a value as a string: \"nil\", \"number\", \"string\", \"boolean\", \"table\", \"function\", \"thread\", or \"userdata\".",
    "params": [["v", "Any", "the value to check"]],
    "returns": [["String", "the type name"]],
    "examples": ["print(type({})) --> table"],
  },
  "xpcall": {
    "description": "Calls f in protected mode like pcall, and handles errors with msgh.",
    "params": [
      ["f", "Function", "the function to call"],
      ["msgh", "Function", "the message handler"],
      ["arg1", "Any", "the first argument"],
      ["...", "Any", "more arguments"],
    ],
    "returns": [
      ["Boolean", "whether the call succeeded"],
      ["Any", "the results of the call, or the handler's result"],
    ],
    "examples": ["local ok, message = xpcall(function()\n  error(\"failed\", 0)\nend, function(err)\n  return \"caught: \" .. err\nend)\nprint(message) --> caught: failed"],
  },
};
